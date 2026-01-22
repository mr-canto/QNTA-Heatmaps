# Outcode Name Logic

## Goal
Provide a consistent, human-friendly area name for each outcode while keeping the outcode visible and preventing duplicates. The app is Southwark-focused, so Southwark-related ward names are preferred when available.

## Inputs
- **Postcodes.io response** for each postcode during import:
  - `outcode`
  - `admin_ward`
  - `admin_district`
  - `latitude` / `longitude`

## How Postcodes.io Works During Import
1. Import extracts and normalizes postcodes from addresses.
2. Postcodes are sent to Postcodes.io in batches using the `/postcodes` endpoint.
3. The response already includes `admin_ward` and `admin_district` for each postcode.
4. We store lat/lon as usual and also capture ward/district metadata for name selection.
5. This happens once at import time; no extra calls are made at render time.

## Outcode Name Selection Rule
For each outcode, aggregate all its postcodes and apply the following:
1. **Prefer Southwark wards**:
   - Filter records where `admin_district == "Southwark"`.
   - Count `admin_ward` frequency within that subset.
   - If any exist, pick the **most frequent** Southwark ward.
2. **Fallback when no Southwark districts**:
   - Count `admin_ward` frequency across all records.
   - Pick the **most frequent** ward overall.
3. **Ties**:
   - Break ties alphabetically for deterministic output.
4. **Missing data**:
   - If no ward data is available, fall back to displaying the outcode only.

## Display Rule
- UI displays: `<Primary Ward>, <Outcode>`.
- Only the **ward** portion may be truncated; the outcode always stays visible.
- A tooltip can show the full ward list (sorted by frequency) to explain overlap.

## Rationale
- Outcodes span multiple neighborhoods; a single label must be chosen.
- Using **most frequent ward** is stable and reflects the dominant area in the dataset.
- Southwark wards take priority to align with the app’s remit.
- Tooltip preserves transparency for mixed or cross-borough outcodes.

## Notes
- If future requirements demand official labels, consider a reference table of outcode-to-area mappings.
- This approach avoids extra runtime queries and keeps logic deterministic per import snapshot.
