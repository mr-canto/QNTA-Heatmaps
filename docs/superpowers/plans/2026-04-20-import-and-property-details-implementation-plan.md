# Import And Property Details Implementation Plan

## Goal

Implement the approved design so the platform:

- keeps the current minimum import gate exactly as it works today
- imports optional work-order enrichment fields
- preserves one summary row per property for the map
- preserves one work-order row per imported spreadsheet row for property history
- shows chronological work-order history in the property details card

## Implementation strategy

Work in the following order:

1. Add storage for work-order rows and date normalization support.
2. Expand the importer to capture optional enrichment fields and warnings.
3. Keep property-summary generation intact for map behavior.
4. Add read/query support for property history.
5. Upgrade the property details UI to show summary plus work-order history.
6. Verify that the current import gate and map behavior do not regress.

This sequence reduces risk because it leaves current property/map behavior stable while adding the new row-level layer underneath it.

## Phase 1: Database and types

### Objectives

- add a new table for imported work-order rows
- link work-order rows to imports and properties in a stable way
- support nullable enrichment fields
- support normalized date storage for sorting

### Tasks

- create a Supabase migration for a new `work_orders` table
- include fields for:
  - `id`
  - `import_id`
  - property link or normalized address link
  - `address`
  - `postcode`
  - `outcode`
  - `work_order_ref`
  - `description`
  - `estimated_cost`
  - raw date value
  - normalized sortable date value
  - import row order for stable fallback ordering
- add indexes that support:
  - filtering by import
  - filtering by property/address
  - sorting by normalized date
- add RLS policies matching the existing import ownership model
- regenerate or update TypeScript database types

### Notes

- The property summary layer should remain available as the map-facing table/query shape.
- The work-order table should not weaken the existing import ownership or visibility rules.

## Phase 2: Import parser and validation

### Objectives

- keep current hard-failure rules unchanged
- capture optional enrichment fields from the spreadsheet
- parse costs and dates without making them new import blockers

### Tasks

- extend the parser to detect and map optional columns from Sheet 1 style data:
  - `WO Ref`
  - `Description`
  - `Est Cost`
  - `Date`
- preserve the existing address/postcode detection behavior
- extend row parsing so each raw row can carry optional enrichment values
- add date normalization logic that:
  - uses UK-first parsing
  - accepts Excel date values
  - accepts common UK date strings
  - accepts ISO-like values when present
- add estimated-cost normalization logic that:
  - accepts numeric spreadsheet values
  - accepts currency-like strings if they appear
- produce non-blocking warnings for:
  - missing work-order ref
  - blank description
  - unparseable estimated cost
  - unparseable date

### Notes

- Current hard failures remain only:
  - unusable address body
  - missing/invalid postcode after current logic
  - failed geocoding
- Optional-field problems should never exclude a row on their own.

## Phase 3: Import persistence

### Objectives

- continue storing one property summary per deduplicated address
- also store one work-order row per imported spreadsheet row

### Tasks

- keep the current property-summary save path for `properties`
- update the import service so it also inserts `work_orders`
- ensure each work-order row is linked to the correct imported property summary/address
- preserve current outcode-stat generation
- preserve current import status lifecycle:
  - `pending`
  - `processing`
  - `completed`
  - `failed`
- make rollback/failure cleanup cover new work-order inserts as part of the import transaction flow

### Notes

- The source of truth for map rendering remains the property summary layer.
- The source of truth for card history becomes the new work-order layer.

## Phase 4: Read/query layer

### Objectives

- keep existing map queries stable
- add a clear query path for property history

### Tasks

- leave the current map/property summary query contract intact where possible
- add a query/hook for work-order history by selected property
- define history sorting rules:
  - parsed dates first, newest to oldest
  - undated/unparseable rows below dated rows
  - stable fallback using import row order and then work-order ref
- add any lightweight derived summary fields needed for the card top section

### Notes

- Avoid forcing the map to read raw work-order rows.
- Keep the new history query focused and easy to test independently.

## Phase 5: Import page UX

### Objectives

- preserve today’s import flow
- enrich the feedback model with optional-field warnings

### Tasks

- keep the existing upload/validate/confirm structure
- preserve current excluded-row display for hard failures
- add a secondary warnings summary for enrichment-field issues
- update success messaging so it can communicate:
  - rows scanned
  - properties imported
  - rows excluded
  - work orders imported with warnings
- ensure preview data still helps users inspect incoming columns

### Notes

- Do not turn optional-field warnings into blocking alerts.
- The overall flow should still feel like the current importer, just more informative.

## Phase 6: Property details UI

### Objectives

- replace the minimal popup content with the approved richer property details view
- keep the card readable at both low and high history counts

### Tasks

- update the property details component to show:
  - address
  - postcode/outcode context if available
  - total visits
  - approved top-summary metrics such as latest work order or total estimated cost
- add a work-order history list beneath the summary
- render per-entry fields as available:
  - date
  - work-order ref
  - description
  - estimated cost
- apply approved fallback behavior:
  - light fallback for missing reference when needed
  - short fallback for missing description
  - omit cost line when cost is absent
- support long histories with a compact stacked layout and a `show more` pattern

### Notes

- The ordering itself should imply newest-first; no extra “Latest first” label is needed.
- Missing optional values should not make the card feel broken or noisy.

## Phase 7: Verification

### Objectives

- confirm no regression to current import success rules
- confirm new enrichment and history behavior works end to end

### Verification checklist

- importer still accepts files that pass the current minimum gate
- duplicate addresses still roll up into one property summary with correct visit count
- work-order rows are stored for each imported spreadsheet row
- optional fields are stored when present
- missing optional fields do not block import
- UK-style dates parse correctly across mixed input types
- unparseable dates create warnings, not exclusions
- map renders correctly from property summary data
- property details card renders correctly for:
  - single-visit properties
  - multi-visit properties
  - partial work-order data
  - mixed valid/invalid dates
  - long history lists

## Delivery order

Recommended delivery slices:

1. Schema + types
2. Parser + import persistence
3. Work-order query layer
4. Import page warning UX
5. Property details card/history UI
6. End-to-end verification and polish

## Risks and mitigations

### Risk: importer becomes too tightly coupled to one spreadsheet shape

Mitigation:

- keep address/postcode detection logic intact
- layer optional field mapping on top rather than replacing the current parser contract

### Risk: property/work-order linking becomes ambiguous

Mitigation:

- persist normalized property linkage consistently during import
- include import row order for deterministic fallback behavior

### Risk: date parsing becomes brittle

Mitigation:

- centralize date normalization
- make parse failures non-blocking
- verify against representative UK-style inputs

### Risk: popup becomes overcrowded

Mitigation:

- keep the top section compact
- treat history as the main content area
- collapse long histories behind a `show more` pattern

## Done criteria

The work is done when:

- the current minimum import gate behaves the same as before
- optional work-order enrichment fields are imported and stored
- one property summary still powers the map per address
- one work-order row exists per imported source row
- property details shows chronological history cleanly
- import warnings distinguish hard exclusions from non-blocking enrichment issues
- regression checks pass for map, import, and property-details behavior
