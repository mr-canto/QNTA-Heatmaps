# Dashboard Improvements Plan

## Current Reality

The system uses an **import snapshot model**:
- Each CSV upload creates an independent snapshot
- `visit_count` = duplicate addresses within a single file (not across time)
- No connection between imports - properties aren't matched across snapshots
- Only the "current" import is displayed

**Problem:** The "Biggest Increase" metric compares unrelated datasets, creating confusion about what the percentage actually means.

---

## Phase 1: Fix Current Dashboard (Snapshot-Only Metrics)

Work within the existing architecture. Focus on clarity and honesty about what the data shows.

### Changes

| Current | Proposed | Rationale |
|---------|----------|-----------|
| "Biggest Increase" card | Remove or replace with "Highest Volume Area" | Comparing unrelated snapshots is misleading |
| "Multi-Visit Hotspot" | Add "(This Import)" label | Makes it explicit this is snapshot data |
| Single "5+ visits" count | Severity breakdown: 1, 2-3, 4-6, 7+ visits | Better prioritisation for housing teams |
| - | Add "Concentration Score" | Shows if problems are spread or clustered |
| - | Add "Top Problem Properties" list | Actionable addresses for immediate attention |

### New Metrics to Add

1. **Concentration Score** - "X% of visits come from Y areas"
2. **Worst Property** - Address with highest visit count
3. **Geographic Coverage** - How many of 13 areas are affected
4. **Severity Distribution** - Granular visit count breakdown

---

## Phase 2: Cumulative Tracking (Optional Future Enhancement)

Enable real trends by changing the data model.

### Required Architecture Changes

1. **Master Property Registry** - Permanent IDs for unique addresses
2. **Visit Records** - Store individual visits, not aggregated counts
3. **Import as Addition** - Imports add to history instead of replacing

### New Capabilities

- True trend analysis ("48% increase over 3 months")
- Repeat offender identification (properties in multiple imports)
- Resolution tracking (properties that stopped appearing)
- Seasonal pattern detection
- New vs returning property breakdown

---

## Decision Required

- **Phase 1 only:** Improves clarity without architectural changes
- **Phase 1 + Phase 2:** Full longitudinal tracking capability

Phase 2 is a significant change but enables the housing team to identify chronic problem areas and measure improvement over time.
