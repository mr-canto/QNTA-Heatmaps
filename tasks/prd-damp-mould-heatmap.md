# QNTA Heatmap Web Application PRD

## Introduction/Overview

This project converts an existing standalone HTML heatmap into a production-ready React web application with a Supabase backend. The application visualises damp and mould work order data across Southwark properties on an interactive map, allowing housing teams to identify problem areas and track patterns over time. The key differentiator is the historical snapshots feature, enabling users to view and compare data from any previous import. Users land on a dashboard with key metrics before navigating to the detailed heatmap view.

## Goals

- Migrate all hardcoded property data (~9,870 properties) to a Supabase database
- Provide a dashboard with snapshot overview, problem area highlights, and quick actions
- Enable authenticated users to view and interact with the heatmap
- Allow users to import new data via Excel/CSV uploads, creating historical snapshots
- Provide time-travel functionality to view the map at any point in history
- Add search and export capabilities not present in the original HTML version

## User Stories

### US-001: User Authentication
**As a** housing team member, **I want** to log in with my credentials **so that** only authorised staff can access the application.

**Acceptance Criteria:**
- [ ] Users must authenticate before viewing any part of the application
- [ ] Unauthenticated users are redirected to the login page
- [ ] Existing auth system (email/password) is used
- [ ] After login, users are redirected to the Dashboard
- [ ] Sign out clears the session and redirects to the login page
- [ ] Typecheck passes

---

### US-002: Database Schema Setup
**As a** developer, **I want** to create the Supabase database schema **so that** property data and import history can be stored properly.

**Acceptance Criteria:**
- [ ] `imports` table created with: id, uploaded_by, uploaded_at, filename, record_count, is_current
- [ ] `properties` table created with: id, import_id, address, postcode, outcode, lat, lon, visit_count
- [ ] `outcode_stats` table created with: id, import_id, outcode, area_name, total_visits, property_count, multi_visit_count, lat, lon
- [ ] Foreign key relationships established between tables
- [ ] Row Level Security (RLS) policies configured:
  - Authenticated users can SELECT all rows from all tables
  - Authenticated users can INSERT into `imports`, `properties`, and `outcode_stats`
  - Authenticated users can UPDATE `imports.is_current` only
  - No DELETE permissions (snapshots are preserved indefinitely)
- [ ] Indexes created on import_id and outcode columns
- [ ] Typecheck passes

---

### US-003: Seed Initial Data Migration
**As a** developer, **I want** to migrate the existing 9,870 properties to Supabase **so that** the application has data to display on first launch.

**Acceptance Criteria:**
- [ ] Source data is extracted from the provided XLSX file (not the HTML file)
- [ ] All 9,870 properties from the Excel file are imported
- [ ] The one address without a postcode is handled appropriately (excluded)
- [ ] Initial import is recorded in the imports table
- [ ] Outcode statistics are calculated and stored
- [ ] Data can be queried successfully from the application
- [ ] Typecheck passes

---

### US-004: Application Header
**As a** user, **I want** to see a consistent header across all pages **so that** I can navigate the application and manage my session.

**Acceptance Criteria:**
- [ ] Header displays "QNTA Heatmap" branding on the left using Fraunces font
- [ ] Header background is teal (#0f5d5e) with subtle radial gradient overlay
- [ ] Header height is 72px, fixed at top of viewport
- [ ] Navigation links for Dashboard, Heatmap, and Import are displayed
- [ ] Active page is visually highlighted in navigation
- [ ] User's initials displayed in a coloured avatar circle on the right
- [ ] Clicking avatar reveals dropdown with user name and Sign Out option
- [ ] Layout matches Design Specifications wireframe
- [ ] Built with ShadCN components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-005: User Avatar Component
**As a** user, **I want** to see my initials in a coloured avatar **so that** the interface feels personalised.

**Acceptance Criteria:**
- [ ] Avatar displays user's initials (e.g., "VA" for Victor Acquah)
- [ ] Avatar background colour is vibrant (not grey) - derived from user's name for consistency
- [ ] Initials are white text on coloured background
- [ ] Avatar is circular with appropriate sizing
- [ ] Built with ShadCN Avatar component
- [ ] Typecheck passes

---

### US-006: Dashboard Page Layout
**As a** user, **I want** to land on a dashboard after login **so that** I get an overview before diving into details.

**Acceptance Criteria:**
- [ ] Dashboard is the default page after authentication
- [ ] Page displays welcome message with user's first name
- [ ] Page contains sections: Snapshot Overview, Problem Areas, Quick Actions
- [ ] Layout matches Design Specifications wireframe
- [ ] Route is `/dashboard`
- [ ] Built with ShadCN Card components for sections
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-007: Properties Donut Chart
**As a** user, **I want** to see a donut chart showing total properties **so that** I understand the single vs multi-visit split at a glance.

**Acceptance Criteria:**
- [ ] Donut chart displays with total properties count (9,870) in the centre
- [ ] Chart has two segments: Single Visit (teal #0f5d5e) and Multi Visit (coral #d16b55)
- [ ] Segment sizes reflect actual proportions
- [ ] Legend below chart shows "Single Visit" and "Multi Visit" with counts
- [ ] Positioned in Snapshot Overview section per wireframe
- [ ] Uses a charting library compatible with React (e.g., Recharts)
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-008: Visit Breakdown Panel
**As a** user, **I want** to see a breakdown of visit categories **so that** I understand the distribution of issues.

**Acceptance Criteria:**
- [ ] Panel displays three horizontal bars: Single Visit, Multi Visit, Severe (5+)
- [ ] Each bar shows: label, count, percentage, and visual progress bar
- [ ] Bar fill colour: teal (#0f5d5e) for single, coral (#d16b55) for multi/severe
- [ ] Percentages are calculated from total properties
- [ ] Positioned in Snapshot Overview section per wireframe
- [ ] Built with ShadCN Progress or custom bar components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-009: Top 5 Areas Chart
**As a** user, **I want** to see the top 5 problem areas **so that** I know where to focus resources.

**Acceptance Criteria:**
- [ ] Horizontal bar chart shows top 5 outcodes by total visit count
- [ ] Each bar displays: area name, outcode, visual bar, and count
- [ ] Bars are sorted by visit count descending (highest at top)
- [ ] Bar fill colour is teal (#0f5d5e)
- [ ] Clicking an area navigates to Heatmap page filtered to that area
- [ ] Positioned in Problem Areas section per wireframe
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-010: Multi-Visit Hotspot Card
**As a** user, **I want** to see which area has the highest concentration of recurring issues **so that** I can prioritise interventions.

**Acceptance Criteria:**
- [ ] Card displays the outcode with highest percentage of multi-visit properties
- [ ] Shows area name and outcode
- [ ] Shows percentage of properties in that area with repeat visits
- [ ] Card has visual emphasis (border or background colour)
- [ ] Positioned in Problem Areas section per wireframe
- [ ] Built with ShadCN Card component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-011: Biggest Increase Card
**As a** user, **I want** to see which area has grown most since the last import **so that** I can identify emerging problems.

**Acceptance Criteria:**
- [ ] Card displays the outcode with largest percentage increase since previous import
- [ ] Shows area name and outcode
- [ ] Shows percentage change with "+" prefix (e.g., "+23%")
- [ ] If no previous import exists, card displays "No previous data available"
- [ ] Card has visual emphasis (border or background colour)
- [ ] Positioned in Problem Areas section per wireframe
- [ ] Built with ShadCN Card component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-012: Quick Actions Row
**As a** user, **I want** quick access to common actions **so that** I can navigate efficiently.

**Acceptance Criteria:**
- [ ] Three action buttons displayed in a row: View Heatmap, Import Data, Export Data
- [ ] Each button has a subtle icon (Lucide icons) alongside text
- [ ] "View Heatmap" navigates to `/heatmap`
- [ ] "Import Data" navigates to `/import`
- [ ] "Export Data" triggers CSV download of current snapshot
- [ ] Positioned at bottom of dashboard per wireframe
- [ ] Built with ShadCN Button components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-013: Interactive Map Component
**As a** user, **I want** to see an interactive map displaying property locations **so that** I can visualise damp and mould issues across Southwark.

**Acceptance Criteria:**
- [ ] Leaflet map renders centred on Southwark (51.4700, -0.0650)
- [ ] Map is responsive and fills available space below header
- [ ] Zoom controls are accessible
- [ ] Base tile layer loads correctly (OpenStreetMap)
- [ ] Route is `/heatmap`
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-014: Heatmap Visualisation Mode
**As a** user, **I want** to view data as a heatmap **so that** I can quickly identify areas with high concentrations of issues.

**Acceptance Criteria:**
- [ ] Heatmap layer renders using Leaflet.heat plugin
- [ ] Intensity is based on visit_count
- [ ] Colour gradient uses 5-colour scale per Design Specifications: #2f7ab8 → #3aa6b9 → #f1d77a → #f2a65a → #d45a4b
- [ ] Heatmap updates when filters are applied
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-015: Marker Visualisation Mode
**As a** user, **I want** to view individual property markers **so that** I can see exact locations and details.

**Acceptance Criteria:**
- [ ] Circle markers render for each property
- [ ] Marker size scales with visit_count
- [ ] Single-visit properties are teal (#0f5d5e), multi-visit are coral (#d16b55)
- [ ] Clicking a marker shows popup with banner header (teal for single, coral for multi), address section, and visit count section
- [ ] Popup has close button, 14px border radius, large shadow per Design Specifications
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-016: Cluster Visualisation Mode
**As a** user, **I want** to view clustered markers **so that** the map remains performant with thousands of points.

**Acceptance Criteria:**
- [ ] MarkerCluster plugin groups nearby markers
- [ ] Cluster count displays on cluster icons
- [ ] Clicking a cluster zooms in to show individual markers
- [ ] Clusters update when filters are applied
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-017: View Mode Toggle
**As a** user, **I want** to switch between heatmap, markers, and cluster views **so that** I can analyse data in different ways.

**Acceptance Criteria:**
- [ ] Toggle buttons for Heatmap, Markers, Clusters are displayed
- [ ] Active mode is visually highlighted
- [ ] Switching modes updates the map immediately
- [ ] Current mode persists during filter changes
- [ ] Built with ShadCN Button components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-018: Area Filter Dropdown
**As a** user, **I want** to filter by postcode area **so that** I can focus on specific neighbourhoods.

**Acceptance Criteria:**
- [ ] Dropdown lists all outcodes with area names (e.g., "Peckham, SE15")
- [ ] "All Areas" option shows complete dataset
- [ ] Selecting an area filters the map and zooms to that location
- [ ] Visit count shown next to each area in dropdown
- [ ] Built with ShadCN Select component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-019: Visit Type Filter
**As a** user, **I want** to filter by single or multiple visits **so that** I can identify recurring problem properties.

**Acceptance Criteria:**
- [ ] Toggle buttons for All, Single Visit, Multi Visit
- [ ] Filter applies to current map view
- [ ] Can be combined with area filter
- [ ] Built with ShadCN Button components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-020: Minimum Visits Slider
**As a** user, **I want** to set a minimum visit threshold **so that** I can focus on properties with the most issues.

**Acceptance Criteria:**
- [ ] Slider ranges from 1 to 10+
- [ ] Current value is displayed
- [ ] Map updates as slider moves
- [ ] 10+ shows properties with 10 or more visits
- [ ] Built with ShadCN Slider component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-021: Heatmap Statistics Header
**As a** user, **I want** to see summary statistics on the heatmap page **so that** I understand the filtered data.

**Acceptance Criteria:**
- [ ] Displays total properties count for current filter
- [ ] Displays single visit count for current filter
- [ ] Displays multi visit count for current filter
- [ ] Statistics update when filters change
- [ ] Positioned at top of heatmap page below main header
- [ ] Built with ShadCN components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-022: Area Statistics Panel
**As a** user, **I want** to see a breakdown by area on the heatmap page **so that** I can compare neighbourhoods.

**Acceptance Criteria:**
- [ ] Lists all outcodes with visit counts
- [ ] Visual bar indicates relative volume
- [ ] Clicking an area filters the map to that area
- [ ] Sorted by visit count descending
- [ ] Built with ShadCN Card and custom components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-023: Search by Address or Postcode
**As a** user, **I want** to search for a specific address or postcode **so that** I can quickly find properties of interest.

**Acceptance Criteria:**
- [ ] Search input field in the controls panel
- [ ] Searches both address and postcode fields
- [ ] Results filter the map in real-time as user types
- [ ] Matching properties are highlighted or isolated
- [ ] Clear button resets search
- [ ] Built with ShadCN Input component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-024: Export Filtered Data
**As a** user, **I want** to export the currently filtered data **so that** I can analyse it in Excel or share with colleagues.

**Acceptance Criteria:**
- [ ] Export button in the controls panel
- [ ] Exports current filtered dataset (respects all active filters)
- [ ] Downloads as CSV file
- [ ] Includes columns: address, postcode, outcode, visit_count
- [ ] Filename includes current date and snapshot identifier
- [ ] Built with ShadCN Button component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-025: Historical Snapshot Selector
**As a** user, **I want** to view the heatmap from a previous import **so that** I can see how the data has changed over time.

**Acceptance Criteria:**
- [ ] Dropdown lists all available imports with dates
- [ ] "Current" option is selected by default
- [ ] Selecting a past import loads that snapshot's data
- [ ] Map, statistics, and filters all reflect the selected snapshot
- [ ] Clear visual indicator when viewing historical data (e.g., amber banner stating "Viewing data from [date]")
- [ ] Built with ShadCN Select component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-026: Data Import Page
**As a** user, **I want** to upload a new Excel or CSV file **so that** I can update the heatmap with fresh data.

**Acceptance Criteria:**
- [ ] Dedicated import page at route `/import`
- [ ] File upload accepts .xlsx and .csv formats (max 10MB)
- [ ] Drag-and-drop zone for file upload
- [ ] Error shown if file too large: "File exceeds 10MB limit"
- [ ] Error shown if wrong file type: "Please upload an Excel or CSV file"
- [ ] Error shown if no Address column: "No 'Address' column found in file"
- [ ] Preview of data shown before confirming (first 100 rows, total count)
- [ ] Confirm button processes the import
- [ ] Cancel button discards the upload
- [ ] Progress bar shown during processing (expected 15-45 seconds for large files)
- [ ] Built with ShadCN Card, Button, and Input components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-027a: Import File Parsing and Validation
**As a** user, **I want** my uploaded file to be parsed and validated **so that** I know if the data is suitable for import.

**Acceptance Criteria:**
- [ ] File is parsed (Excel via xlsx library, CSV via papaparse)
- [ ] Address column is required; error shown if missing: "No 'Address' column found in file"
- [ ] Postcode column is optional
- [ ] Addresses are deduplicated; visit count = number of occurrences
- [ ] Total row count and unique address count are calculated
- [ ] Parsing errors are caught and displayed to user
- [ ] Typecheck passes

---

### US-027b: Postcode Extraction and Validation
**As a** user, **I want** postcodes to be extracted and validated **so that** properties can be geocoded and mapped.

**Acceptance Criteria:**
- [ ] Postcode detection: extract from Address field first using UK postcode regex
- [ ] Fallback to Postcode column if extraction from Address fails
- [ ] Outcode derived from postcode (e.g., "SE15" from "SE15 2JZ")
- [ ] Addresses without valid postcodes are marked for exclusion
- [ ] If all addresses are invalid, error shown: "No valid addresses found. All rows were missing postcodes."
- [ ] List of excluded addresses with reasons is prepared for display
- [ ] Typecheck passes

---

### US-027c: Import Database Operations
**As a** user, **I want** validated data to be saved to the database **so that** it becomes a new snapshot.

**Acceptance Criteria:**
- [ ] New import record is created with current timestamp (only if at least one valid address)
- [ ] Previous import is marked as not current (`is_current = false`)
- [ ] New properties are inserted with the new import_id
- [ ] Outcode statistics are calculated and stored in `outcode_stats` table
- [ ] All database operations are wrapped in a transaction (rollback on failure)
- [ ] Success summary displayed: "X properties imported, Y excluded"
- [ ] Excluded addresses listed with reasons
- [ ] Typecheck passes

---

### US-028: Import Geocoding
**As a** user, **I want** uploaded addresses to be geocoded **so that** they can be displayed on the map.

**Acceptance Criteria:**
- [ ] Valid postcodes are geocoded using Postcodes.io API (free, UK-specific)
- [ ] Geocoding runs synchronously during import (batched, 100 postcodes per request)
- [ ] Rate limiting is respected (batch requests where possible)
- [ ] Properties without valid postcodes are excluded entirely
- [ ] Properties where geocoding fails (API error) are excluded entirely
- [ ] If geocoding service is completely unavailable, import fails with error: "Unable to process addresses. Please try again later."
- [ ] Excluded addresses listed by name so user can investigate
- [ ] Typecheck passes

---

### US-029: Import History List
**As a** user, **I want** to see a list of all past imports **so that** I can track when data was updated.

**Acceptance Criteria:**
- [ ] Table displayed on Import page below upload section
- [ ] Shows all imports with: date, filename, record count, uploaded by
- [ ] Current import is highlighted or badged
- [ ] Most recent imports shown first
- [ ] Built with ShadCN Table component
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-030: Loading States
**As a** user, **I want** to see loading indicators **so that** I know the system is working.

**Acceptance Criteria:**
- [ ] Loading spinner shown while dashboard data loads
- [ ] Loading spinner shown while map data loads
- [ ] Loading state shown during filter changes
- [ ] Loading state shown during file upload and processing
- [ ] Skeleton loaders used for cards where appropriate
- [ ] Built with ShadCN Skeleton and Spinner components
- [ ] Verify in browser
- [ ] Typecheck passes

---

### US-031: Responsive Layout
**As a** user, **I want** the application to work on different screen sizes **so that** I can use it on desktop or tablet.

**Acceptance Criteria:**
- [ ] Responsive behaviour matches `docs/heatmap-design.css` exactly
- [ ] **Desktop (>1024px)**: Side panels fixed, 280px width, positioned left/right
- [ ] **Tablet (768-1024px)**: Panels narrow to 240px, reduced padding/font sizes
- [ ] **Mobile (<768px)**: Panels become slide-out drawers with toggle buttons, header stacks vertically, legend spans full width at bottom
- [ ] **Small mobile (<480px)**: Full-width panels, further font reductions
- [ ] Mobile toggle buttons appear at <768px to open/close panels
- [ ] Panel slide animations use 0.3s ease transition
- [ ] Touch targets enlarged on mobile (24px slider thumbs, 12px padding on stats)
- [ ] Verify in browser at 1280px, 1024px, 768px, 480px, 375px viewports
- [ ] Typecheck passes

---

### US-032: Error States and Recovery
**As a** user, **I want** to see clear error messages when something goes wrong **so that** I understand what happened and can take action.

**Acceptance Criteria:**
- [ ] Toast notification displayed when API requests fail
- [ ] Error messages are user-friendly (not technical jargon)
- [ ] Retry button shown where applicable (e.g., failed data fetch)
- [ ] Network connectivity issues display: "Unable to connect. Please check your internet connection."
- [ ] Session expiry redirects to login with message: "Your session has expired. Please log in again."
- [ ] Form validation errors displayed inline next to relevant fields
- [ ] Built with ShadCN Toast component
- [ ] Verify in browser
- [ ] Typecheck passes

---

## Functional Requirements

1. All property data must be stored in Supabase, not hardcoded in the application
2. Each data import creates a new snapshot; previous snapshots are preserved indefinitely
3. Only one import can be marked as "current" at any time
4. Users must be authenticated to access any part of the application
5. The root route (`/`) redirects to `/dashboard` if authenticated, or `/login` if not
6. The map must support at least 10,000 markers without performance degradation
7. Search must return results within 500ms for typical queries
8. Export must handle the full dataset (up to 15,000 rows) without timeout
9. All UI components must use ShadCN component library
10. No emojis shall be used anywhere in the application UI
11. The application must work in Chrome, Firefox, Safari, and Edge (latest versions)

## Non-Goals

- Real-time data synchronisation with external housing systems (data is imported manually)
- User management or registration (users are created manually in Supabase)
- Editing individual property records in the UI
- Deleting historical snapshots
- Mobile phone optimisation (tablet minimum)
- Offline functionality
- Multi-tenancy (single organisation use)
- Storing original Excel/CSV files (only processed data is retained)
- Role-based access control (all authenticated users have full access)

## Design Specifications

> **Note:** For exact positioning, responsive breakpoints, animations, and component layouts, refer to `docs/heatmap-design.css`. The values below are for quick reference; the stylesheet is the source of truth.

### Colour Palette

| Element | Colour | Hex Code |
|---------|--------|----------|
| Primary / Header / Accent | Teal | #0f5d5e |
| Accent Strong | Dark Teal | #0b4d4f |
| Accent Soft | Light Teal | #d9eceb |
| Single Visit | Teal | #0f5d5e |
| Multi Visit / Accent Warm | Coral | #d16b55 |
| Accent Warm Soft | Light Coral | #f7e5df |
| Accent Cool | Blue | #2f7ab8 |
| Text Strong | Dark | #1f2a37 |
| Text | Default | #2f3b4a |
| Text Muted | Grey | #627083 |
| Text Soft | Light Grey | #8996a5 |
| Surface | White | #ffffff |
| Surface Alt | Off-white | #f4f7f6 |
| Surface Soft | Light Grey | #eef2f1 |
| Border | Grey | #dce3e7 |

### Heatmap Gradient (5 colours, left to right)

| Step | Hex Code |
|------|----------|
| Heat 1 (Low) | #2f7ab8 |
| Heat 2 | #3aa6b9 |
| Heat 3 | #f1d77a |
| Heat 4 | #f2a65a |
| Heat 5 (High) | #d45a4b |

### Typography

- **Display/Headings**: Fraunces (serif), weight 500-700
- **Body/UI**: Manrope (sans-serif), weight 400-700
- **Data values**: Manrope, weight 600, tabular-nums for alignment

### Spacing & Radii

| Token | Value |
|-------|-------|
| Border Radius Small | 10px |
| Border Radius Default | 14px |
| Border Radius Large | 18px |
| Header Height | 72px |
| Panel Offset | 18px |

### Shadows

| Token | Value |
|-------|-------|
| Shadow Small | 0 6px 16px rgba(15, 23, 42, 0.08) |
| Shadow Medium | 0 12px 26px rgba(15, 23, 42, 0.12) |
| Shadow Large | 0 20px 45px rgba(15, 23, 42, 0.16) |

### Component Styles

- **Cards/Panels**: White background, 1px border (#dce3e7), 14px radius, large shadow
- **Toggle buttons (inactive)**: Transparent background, muted text
- **Toggle buttons (active)**: White background, strong text, small shadow, slight lift (-1px)
- **Section labels**: 11px uppercase, 0.14em letter-spacing, weight 700, muted colour

### Dashboard Wireframe

```
+-----------------------------------------------------------------------------+
|  QNTA Heatmap            Dashboard    Heatmap    Import         [VA] v     |
+-----------------------------------------------------------------------------+
|                                                                             |
|   Welcome back, Victor                                                      |
|   Here's your current overview                                              |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|   SNAPSHOT OVERVIEW                                                         |
|  +----------------------------------+  +----------------------------------+ |
|  |                                  |  |                                  | |
|  |          PROPERTIES              |  |       VISIT BREAKDOWN            | |
|  |      +------------------+        |  |                                  | |
|  |    /-|     9,870        |-\      |  |   Single Visit      7,529  76%  | |
|  |   /  |     total        |  \     |  |   [==========================]  | |
|  |  |   +------------------+   |    |  |                                  | |
|  |  | ############-----------  |    |  |   Multi Visit       2,341  24%  | |
|  |   \                       /      |  |   [========]                     | |
|  |    \---------------------/       |  |                                  | |
|  |   Single Visit   Multi Visit     |  |   Severe (5+)         312   3%  | |
|  |      7,529          2,341        |  |   [===]                          | |
|  |                                  |  |                                  | |
|  +----------------------------------+  +----------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|   PROBLEM AREAS                                                             |
|  +------------------------------------------+  +--------------------------+ |
|  |                                          |  |                          | |
|  |  TOP 5 BY VISIT COUNT                    |  |  MULTI-VISIT HOTSPOT     | |
|  |                                          |  |                          | |
|  |  SE15 Peckham     [================] 892 |  |  SE15 Peckham            | |
|  |  SE17 Walworth    [===========]      645 |  |  42% of properties       | |
|  |  SE1  Borough     [==========]       580 |  |  have repeat visits      | |
|  |  SE16 Rotherhithe [=========]        512 |  |                          | |
|  |  SE5  Camberwell  [=======]          428 |  +--------------------------+ |
|  |                                          |  |                          | |
|  |  -----------------------------------------  |  BIGGEST INCREASE        | |
|  |  Click any area to view on heatmap       |  |                          | |
|  |                                          |  |  SE5 Camberwell          | |
|  +------------------------------------------+  |  +23% since last import  | |
|                                                |                          | |
|                                                +--------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|   QUICK ACTIONS                                                             |
|  +-------------------+ +-------------------+ +-------------------+          |
|  |                   | |                   | |                   |          |
|  |   View Heatmap    | |   Import Data     | |   Export Data     |          |
|  |                   | |                   | |                   |          |
|  +-------------------+ +-------------------+ +-------------------+          |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Header Wireframe

```
+-----------------------------------------------------------------------------+
|  [Logo] QNTA Heatmap      Dashboard    Heatmap    Import        [VA] v     |
|                              ^active                            Victor      |
|                                                                 Sign Out    |
+-----------------------------------------------------------------------------+
```

- Logo: Text-based or simple icon
- Navigation: Text links, active state underlined or highlighted
- Avatar: Circular, coloured background with white initials
- Dropdown: Appears on avatar click, contains user name and Sign Out

### Heatmap Page Wireframe

```
+-----------------------------------------------------------------------------+
|  HEADER                                                                     |
+-----------------------------------------------------------------------------+
| [Stats: 9,870 properties | 7,529 single | 2,341 multi] [Snapshot: Current v]|
+-----------------------------------------------------------------------------+
|  +------------+                                              +------------+ |
|  | CONTROLS   |                                              | AREAS      | |
|  |            |                                              |            | |
|  | View Mode  |                                              | SE15   892 | |
|  | [H] [M] [C]|                                              | SE17   645 | |
|  |            |                                              | SE1    580 | |
|  | Area       |             +--------------------+           | SE16   512 | |
|  | [All v]    |             |                    |           | SE5    428 | |
|  |            |             |                    |           | ...        | |
|  | Visit Type |             |       MAP          |           |            | |
|  | [A][S][M]  |             |                    |           |            | |
|  |            |             |                    |           |            | |
|  | Min Visits |             |                    |           |            | |
|  | [----o---] |             +--------------------+           |            | |
|  |            |                                              |            | |
|  | Search     |                                              |            | |
|  | [________] |                                              |            | |
|  |            |                                              +------------+ |
|  | [Export]   |                                              | LEGEND     | |
|  +------------+                                              | Low -> High| |
|                                                              +------------+ |
+-----------------------------------------------------------------------------+
```

### Historical Data Banner

When viewing a past snapshot, display an amber banner below the header:

```
+-----------------------------------------------------------------------------+
| [!] You are viewing historical data from 15 November 2025       [View Current]|
+-----------------------------------------------------------------------------+
```

## Technical Considerations

- **Frontend**: React 19 + TypeScript + Vite (existing setup)
- **Styling**: Tailwind CSS 4 + ShadCN components (existing setup)
- **Design Reference**: `docs/heatmap-design.css` — canonical stylesheet with all positioning, responsive breakpoints, animations, and component styles. Import or adapt for React components.
- **Fonts**: Google Fonts — Fraunces (display/headings) + Manrope (body/UI)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Mapping**: Leaflet.js with plugins (leaflet.heat, leaflet.markercluster)
- **Charts**: Recharts for donut chart and bar charts
- **State Management**: React Query for server state, React Context for UI state
- **File Parsing**: xlsx library for Excel, papaparse for CSV
- **Geocoding**: Postcodes.io API (free, UK-specific, no API key required)
- **Icons**: Lucide React (already installed)
- **Data Flow**: Excel -> Parse -> Deduplicate -> Geocode -> Store in Supabase

### Database Schema Overview

```
imports
├── id (uuid, primary key)
├── uploaded_by (uuid, references auth.users)
├── uploaded_at (timestamp)
├── filename (text)
├── record_count (integer)
└── is_current (boolean)

properties
├── id (uuid, primary key)
├── import_id (uuid, references imports)
├── address (text)
├── postcode (text)
├── outcode (text)
├── lat (double precision)
├── lon (double precision)
└── visit_count (integer)

outcode_stats
├── id (uuid, primary key)
├── import_id (uuid, references imports)
├── outcode (text)
├── area_name (text)
├── total_visits (integer)
├── property_count (integer)
├── multi_visit_count (integer)
├── lat (double precision)
└── lon (double precision)
```

### Outcode to Area Name Mapping

```
SE15 -> Peckham
SE1  -> Borough
SE17 -> Walworth
SE16 -> Rotherhithe
SE5  -> Camberwell
SE22 -> East Dulwich
SE21 -> Dulwich
SE24 -> Herne Hill
SE11 -> Kennington
SE23 -> Forest Hill
SE14 -> New Cross
SE8  -> Deptford
SE19 -> Crystal Palace
SE26 -> Sydenham
SE27 -> West Norwood
SE6  -> Catford
DA14 -> Sidcup
SE4  -> Brockley
```

## Success Metrics

- All 9,870 initial properties display correctly on the map
- Dashboard loads with accurate statistics within 2 seconds
- Page load time under 3 seconds for initial map render
- Filter operations complete within 500ms
- Zero hardcoded property data in the codebase
- Users can switch between any two historical snapshots within 2 seconds
- User can successfully import a 15,000-row Excel file
- Application passes TypeScript strict mode with no errors

## Decisions Made

- **Geocoding failures**: Properties without valid postcodes or where geocoding fails are excluded entirely from the database. The import summary lists excluded addresses so users can investigate. This ensures statistics always match what's visible on the map.
- **Import column requirements**: Address column is required. Postcode column is optional. Postcode is extracted from Address first; Postcode column is fallback only if extraction fails.
- **Import preview**: Shows first 100 rows with total count displayed.
- **Biggest Increase metric**: Shows percentage change (not absolute numbers) to normalise across different area sizes.
- **No emojis**: The application UI will not use emojis anywhere.
- **All users are admins**: No role-based access control; all authenticated users have full access including import.
- **Max file size**: 10MB limit for uploads (standard practice; sufficient for 50k+ rows).
- **Zero valid addresses**: If all addresses fail validation, no import record is created.
- **Geocoding timing**: Synchronous during upload with progress bar; expected 15-45 seconds for large files.
- **Design source**: `docs/heatmap-design.css` is the canonical stylesheet. Original reference: `damp_mould_heatmap_interactive.html`.
- **Date format**: Use "15 Nov 2025" format for snapshot selector and historical data banner (more readable, matches UK convention).
- **First import comparison**: When no previous import exists, the "Biggest Increase" card displays "No previous data available".
- **Root route behaviour**: `/` redirects to `/dashboard` if authenticated, `/login` if not.
- **Sign out behaviour**: Clears session and redirects to `/login`.
- **Snapshot retention**: Historical snapshots are retained indefinitely. No automatic cleanup or deletion limit.
