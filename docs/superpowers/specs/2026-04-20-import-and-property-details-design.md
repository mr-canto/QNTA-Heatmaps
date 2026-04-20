# Import And Property Details Design

## Purpose

Extend the platform in two connected areas without weakening the current import gate:

1. Expand the import flow so it can ingest richer row-level data from the new spreadsheet shape.
2. Expand the property details experience so users can see chronological work-order history for a property, not just an aggregated visit count.

This design keeps the current minimum import rules exactly as they are today. New fields enrich imported data and the property details card, but they do not become new blockers for import success.

## Current State

### Current import behavior

The current importer:

- accepts `.xlsx`, `.xls`, and `.csv` files up to 10MB
- scans Excel sheets and selects the sheet with the strongest address-column match
- requires an address-bearing column
- treats a separate postcode column as optional
- extracts postcode from the address first, then falls back to a postcode column
- excludes rows that do not contain a usable address body
- excludes rows that do not contain a valid UK postcode
- excludes rows whose postcode cannot be geocoded via `postcodes.io`
- deduplicates repeated addresses into a single property row
- converts repeated address count into `visit_count`

### Current property details behavior

The current property popup only shows:

- property address
- total visits

Work-order-level rows are not preserved after import, so the UI cannot show:

- work order reference
- job description
- estimated cost
- dated history

## Incoming data shape

The new workbook's Sheet 1 currently contains:

- `WO Ref`
- `Address`
- `Description`
- `Con Site`
- `Sta`
- `Ver`
- `Pri`
- `Inv`
- `Apo`
- `Est Cost`

The design also assumes an importable `Date` field will be present for the intended workflow.

Only some of these columns are needed for the new UX. The required enrichment targets are:

- `WO Ref`
- `Description`
- `Est Cost`
- `Date`

## Design Goals

- preserve the current minimum import gate exactly as it works today
- support richer row-level data without breaking map performance
- show property history in a way that is easy to scan
- treat new fields as enrichments, not as new hard requirements
- support UK-first date parsing across common date input types
- make the importer extensible so additional columns can be added later with minimal redesign

## Recommended approach

### Summary

Keep two connected data layers:

1. A property summary layer for the map and top-level property metrics.
2. A work-order row layer for the property details history.

This is the recommended balance between flexibility and low disruption.

### Why this approach

- The map already works well with one row per property.
- The property details experience needs one row per work order.
- Work-order fields do not belong on a single aggregated property row.
- Future enrichment becomes much easier if job-level data is stored separately from property summary data.

## Import UX

### Minimum import gate

The minimum accepted import gate remains unchanged.

A row is still only excluded for the existing hard-failure reasons:

- no usable address body
- no valid UK postcode after current extraction logic
- postcode cannot be geocoded

### Enrichment fields

The importer adds support for optional row-level enrichment fields:

- `WO Ref`
- `Description`
- `Est Cost`
- `Date`

If these fields are present, they should be captured and stored.

If these fields are missing, blank, or partially malformed, the row can still import as long as it passes the existing minimum gate.

### Import feedback model

The import flow should distinguish between:

- `Excluded rows`
  Hard failures that prevent import for the row.
- `Additional field warnings`
  Non-blocking issues on enrichment fields.

Examples of additional field warnings:

- missing `WO Ref`
- blank `Description`
- unparseable `Est Cost`
- unparseable `Date`

### User-facing import summary

The import summary should help users understand both the hard-failure outcome and the enrichment quality, for example:

- rows scanned
- properties ready to import
- rows excluded
- work orders imported with field warnings

## Data model

### Property summary layer

The property summary layer remains the source for:

- map rendering
- marker/clustering behavior
- heatmap intensity
- top-level property metrics

Each property summary should still represent one address and include:

- address
- postcode
- outcode
- latitude/longitude
- total visits

It may also include derived metrics, such as:

- latest work-order date
- total estimated cost
- latest work-order ref

### Work-order row layer

A new work-order row should be stored for each imported spreadsheet row that survives the current minimum import gate.

Each work-order row should link back to the property summary/address and include nullable enrichment fields such as:

- `WO Ref`
- `Description`
- `Est Cost`
- `Date`
- raw import ordering metadata if needed for stable sorting

This preserves the full row history needed by the property details view.

## Property details UX

### Overall structure

The property details UI should be driven by:

1. Property summary data at the top.
2. Work-order history underneath.

### Top section

The top section should stay compact and scannable. It should prioritize:

- property address
- postcode/outcode context
- total visit count
- optionally, summary metrics such as latest work order or total estimated cost

### History section

The history section is the main content area. It should:

- show one item per work-order row
- sort newest to oldest
- display date, work-order ref, description, and estimated cost when available
- support growing to many entries without becoming unreadable

The history list should be designed so it can collapse older items behind a `show more` pattern if the list becomes long.

### Missing optional fields in the card

Missing optional fields should not create a noisy UI.

Recommended behavior:

- missing `WO Ref`: show a light fallback only when needed, such as `Reference unavailable`
- missing `Description`: show a short fallback such as `No description recorded`
- missing `Est Cost`: omit the cost line
- missing or unparseable `Date`: keep the row visible, but do not turn the card into an error state

The property details card should remain clean even when imported enrichment data is incomplete.

## Date handling

### Design intent

The system should be built with the assumption that a date field is part of the upload workflow.

Date handling must:

- use UK convention first
- accept a range of common date input types
- support chronological sorting in the property details history

### Accepted date inputs

The parser should support common UK-friendly inputs, including:

- Excel date cell values
- `dd/mm/yyyy`
- `d/m/yy`
- `dd-mm-yyyy`
- `dd mmm yyyy`
- ISO-like values when present

### Parse behavior

The importer should attempt to normalize incoming date values into a sortable internal representation.

If a date cannot be parsed:

- the row should still import if it passes the current minimum gate
- the issue should be surfaced as an additional field warning
- the row should still appear in property history

### Sort behavior

Work-order history should sort:

1. parsed dates, newest to oldest
2. then a stable fallback order for undated/unparseable rows

Stable fallback order can use import row order and then work-order ref if needed.

## Data flow

### Parsing stage

Keep the existing address/postcode detection logic intact.

Add optional field mapping for:

- `WO Ref`
- `Description`
- `Est Cost`
- `Date`

### Validation stage

Keep existing hard-failure validation unchanged.

Add a second, non-blocking warning layer for enrichment fields.

### Persistence stage

Save:

- one property summary per address
- one work-order row per imported spreadsheet row

### Read stage

- map views continue reading property summary data
- property details reads property summary plus linked work-order rows

### Sorting stage

History sorting uses normalized parsed dates first, then stable fallback ordering.

## UX wireframe reference

The approved direction for the property details card is:

```text
+----------------------------------------------------------------------------------+
| Property Details                                                         [Close] |
+----------------------------------------------------------------------------------+
|  115 Manor Grove, London, SE15 1EH                                               |
|  Peckham / SE15                                                                  |
|                                                                                  |
|  +----------------------+  +----------------------+  +----------------------+    |
|  | Total visits         |  | Latest work order    |  | Est. total cost      |    |
|  | 7                    |  | 11608413/1           |  | £1,248.60            |    |
|  +----------------------+  +----------------------+  +----------------------+    |
|                                                                                  |
|  Work Order History                                                               |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 15 Mar 2026                                             WO Ref 11608413/1 |  |
|  | As per EHO, raise for a carpenter and change lock to FED.                 |  |
|  | Est. cost £74.25                                                          |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | 02 Mar 2026                                             WO Ref 11593759/1 |  |
|  | Tenant reported door still faulty from previous job.                      |  |
|  | Est. cost £53.98                                                          |  |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  | Reference unavailable                                                       | |
|  | No description recorded                                                     | |
|  +----------------------------------------------------------------------------+  |
|                                                                                  |
|  [Show older history]                                                            |
+----------------------------------------------------------------------------------+
```

## Testing expectations

The implementation should verify that:

- importer still accepts the same files it accepts today
- repeated addresses still roll up into the same property visit count
- optional enrichment fields are stored when present
- missing optional enrichment fields do not block import
- mixed UK date formats parse consistently
- invalid or missing dates create warnings, not exclusions
- property details renders correctly for:
  - one visit
  - many visits
  - partial work-order data
  - undated or unparseable-date work orders

## Out of scope

This design does not define:

- unrelated map redesign
- unrelated dashboard redesign
- destructive changes to current minimum import validation
- mandatory use of every spreadsheet column beyond the agreed enrichment fields

## Recommendation

Proceed with an implementation plan based on:

- unchanged minimum import gate
- optional enrichment fields for `WO Ref`, `Description`, `Est Cost`, and `Date`
- property summary data retained for map behavior
- new work-order row storage for property history
- a compact property details card with chronological work-order history
