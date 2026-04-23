# Heatmap HTML vs React Comparison

## Scope and sources
- Source of truth: `damp_mould_heatmap_interactive.html`, `docs/heatmap-design.css`, `tasks/prd-damp-mould-heatmap.md`, `AGENTS.md`
- Current implementation (key files): `src/pages/HeatmapPage.tsx`, `src/components/HeatmapStatsHeader.tsx`, `src/components/AreaStatsPanel.tsx`, `src/components/MarkerLayer.tsx`, `src/components/ClusterLayer.tsx`, `src/components/HeatmapLayer.tsx`, `src/components/Header.tsx`, `src/index.css`, `src/pages/DashboardPage.tsx`, `src/pages/ImportPage.tsx`, `src/hooks/useProperties.ts`, `src/hooks/useOutcodeStats.ts`, `src/components/TopAreasChart.tsx`
- Method: static file comparison only (no runtime rendering)

## Source conflicts that need a decision
| Area | HTML/CSS | PRD | AGENTS.md | Status/Notes |
| --- | --- | --- | --- | --- |
| Brand/title text | "Southwark Damp & Mould Heatmap" in header (`damp_mould_heatmap_interactive.html`) | Header says "QNTA Heatmap" (`tasks/prd-damp-mould-heatmap.md`) | N/A | Conflict: decide whether the heatmap page title should match HTML or the global app branding. |
| Heatmap stat labels | Total Work Orders, Properties, Multi-Visit (`damp_mould_heatmap_interactive.html`) | Total properties, single, multi (`tasks/prd-damp-mould-heatmap.md`) | N/A | Conflict: HTML vs PRD on which metrics appear in the header stats. |
| Legend labels | Low, Medium, High (`damp_mould_heatmap_interactive.html`) | Low -> High (`tasks/prd-damp-mould-heatmap.md`) | N/A | Conflict: number of legend labels. |
| Color palette | Teal/coral palette (`damp_mould_heatmap_interactive.html`, `docs/heatmap-design.css`) | Teal/coral palette (`tasks/prd-damp-mould-heatmap.md`) | Deep blue primary, blue single, red multi (`AGENTS.md`) | Conflict: instructions vs PRD/HTML. Decide which palette is authoritative. |
| Outcode mapping | Includes SE19, SE26, SE27, SE6, DA14, SE4 (`damp_mould_heatmap_interactive.html`) | Includes same extended list (`tasks/prd-damp-mould-heatmap.md`) | Shorter list (`AGENTS.md`) | Conflict: AGENTS list is shorter than PRD/HTML. |

## Heatmap page comparison (header, layout, panels)
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Heatmap page title | "Southwark Damp & Mould Heatmap" header title (`damp_mould_heatmap_interactive.html`) | "QNTA Heatmap" global header only (`src/components/Header.tsx`) | Different | Heatmap-specific title text is missing and global brand differs. | Add a heatmap page title/subtitle block, or replace brand text when on `/heatmap`. Needs a product decision due to source conflict. |
| Header subtitle | Date range text in header (`damp_mould_heatmap_interactive.html`) | No subtitle (`src/components/Header.tsx`) | Missing | Date range line is absent. | Add a subtitle area and compute date range from current snapshot metadata. |
| Header styling | Shadow, border-bottom, dual radial overlay, padding 16px 28px (`docs/heatmap-design.css`) | Single radial overlay, no shadow/border, padding 24px (`src/components/Header.tsx`) | Different | Visual weight and spacing do not match. | Port header CSS from HTML into Tailwind or add a CSS class in `src/index.css`. |
| Header responsive layout | Stacks on <768px with stats bar full width (`docs/heatmap-design.css`) | No responsive header rules (`src/components/Header.tsx`) | Different | Mobile layout differs from HTML (no stacking rules). | Add responsive styles for header and nav to match HTML breakpoints. |
| Heatmap stats location | Stats inside header, right-aligned (`damp_mould_heatmap_interactive.html`) | Separate bar overlay at top of map, centered (`src/components/HeatmapStatsHeader.tsx`) | Different | Stats are in a different container and alignment. | Move stats into the header or align placement to HTML. |
| Heatmap stats labels | Total Work Orders / Properties / Multi-Visit (`damp_mould_heatmap_interactive.html`) | Properties / Single Visit / Multi Visit (`src/components/HeatmapStatsHeader.tsx`) | Different | Labels and metric set do not match HTML. | Decide which set to use; update labels and data source accordingly. |
| Heatmap stats data | Static summary values from `mapData.summary` (`damp_mould_heatmap_interactive.html`) | Derived from filtered `properties` list (`src/components/HeatmapStatsHeader.tsx`) | Different | HTML shows global summary; React shows filtered counts. | Align to HTML or keep PRD behavior; if keeping PRD, update HTML expectations in design notes. |
| Stats bar alignment | `justify-content: flex-end` (`docs/heatmap-design.css`) | `justify-center` (`src/components/HeatmapStatsHeader.tsx`) | Different | Metrics centered instead of right-aligned. | Change flex alignment to `justify-end` and adjust spacing. |
| Banner for historical snapshot | PRD expects banner with "View Current" action (`tasks/prd-damp-mould-heatmap.md`) | Banner present but no CTA (`src/pages/HeatmapPage.tsx`) | Partial | Missing button and placement logic. | Add CTA to clear `selectedImportId` and position below header. |
| Banner stacking | Banner and stats overlap risk (both `top-0` with different z-index) (`src/pages/HeatmapPage.tsx`) | HTML has no banner | Different | React banner can overlap stats bar. | Add top offset for stats when banner is visible. |
| Map container offset | HTML uses JS to set `margin-top` and height based on header (`damp_mould_heatmap_interactive.html`) | Fixed `h-[calc(100vh-72px)]` with no dynamic offsets (`src/pages/HeatmapPage.tsx`) | Different | Does not account for variable header/stats height. | Apply CSS variables and resize logic (port `setLayoutMetrics` into React). |
| Panels top offset | Top offset is header height + 18px (`docs/heatmap-design.css`) | Uses `calc(72px+18px)` (`src/pages/HeatmapPage.tsx`) | Partial | Works for a fixed header only; does not account for stats bar height. | Update offset to include stats bar height or place stats in header. |
| Controls panel size/position | Left 24px, width 280px, padding 16px (`docs/heatmap-design.css`) | Left 24px, width 280px, padding 16px (`src/pages/HeatmapPage.tsx`) | Same | Matches HTML on desktop. | No change. |
| Info panel size/position | Right 24px, width 280px, padding 16px (`docs/heatmap-design.css`) | Right 24px, width 280px, padding 16px (`src/pages/HeatmapPage.tsx`) | Same | Matches HTML on desktop. | No change. |
| Panel styling | White background, 1px border, 14px radius, large shadow (`docs/heatmap-design.css`) | Same styling in controls/info/legend (`src/pages/HeatmapPage.tsx`) | Same | Matches HTML. | No change. |
| Info panel title | "Visits by Area" (`damp_mould_heatmap_interactive.html`) | "Areas by Visit Count" (`src/pages/HeatmapPage.tsx`) | Different | Title text mismatch. | Rename to match HTML. |
| Info panel scroll indicator | "Scroll for more" lip appears when list scrolls (`damp_mould_heatmap_interactive.html`) | No scroll indicator (`src/components/AreaStatsPanel.tsx`) | Missing | UX cue missing. | Port scroll-lip markup and scroll handler from HTML. |
| Info panel height | Uses CSS variables based on actual legend height (`docs/heatmap-design.css`) | Fixed `calc(100vh-72px-18px-120px-24px-16px)` (`src/pages/HeatmapPage.tsx`) | Partial | Fixed numbers may not match actual legend height. | Compute legend height with a ref or CSS var similar to HTML. |
| Legend title | "Visit Intensity" (`damp_mould_heatmap_interactive.html`) | "Heat Intensity" (`src/pages/HeatmapPage.tsx`) | Different | Title mismatch. | Update legend title. |
| Legend labels | Low / Medium / High (`damp_mould_heatmap_interactive.html`) | Low / High (`src/pages/HeatmapPage.tsx`) | Different | Missing medium label. | Add the middle label and adjust spacing. |
| Legend gradient stops | Explicit 5 stops at 0.2/0.4/0.6/0.8/1 (`damp_mould_heatmap_interactive.html`) | CSS gradient with implicit `via` spacing (`src/pages/HeatmapPage.tsx`) | Different | Color distribution likely different. | Use inline `style` with exact gradient stops or add CSS class. |
| Legend tablet padding | 12px at <=1024px (`docs/heatmap-design.css`) | 14px via `p-3.5` (`src/pages/HeatmapPage.tsx`) | Different | Slight spacing mismatch on tablet. | Adjust tablet padding to 12px. |

## Heatmap controls comparison (left panel)
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Control order | View Mode -> Filter by Area -> Filter by Visits -> Number of Visits (`damp_mould_heatmap_interactive.html`) | View Mode -> Visit Type -> Min Visits -> Area Filter -> Search -> Snapshot -> Export (`src/pages/HeatmapPage.tsx`) | Different | Order differs and extra sections inserted. | Reorder to match HTML; if keeping new features, place them after the HTML sections. |
| View mode buttons | Text-only toggles (`damp_mould_heatmap_interactive.html`) | Buttons with icons (`src/pages/HeatmapPage.tsx`) | Different | Icons change spacing and layout. | Remove icons or add custom styling to match HTML. |
| View mode labels | Heatmap / Markers / Clusters (`damp_mould_heatmap_interactive.html`) | Heatmap / Markers / Clusters (`src/pages/HeatmapPage.tsx`) | Same | Labels match. | No change. |
| Area filter label | "Filter by Area" (`damp_mould_heatmap_interactive.html`) | "Area Filter" (`src/pages/HeatmapPage.tsx`) | Different | Label text mismatch. | Rename to match HTML. |
| Area dropdown UI | Native select with custom arrow (`damp_mould_heatmap_interactive.html`) | Shadcn `Select` (`src/pages/HeatmapPage.tsx`) | Different | Visual and interaction differences. | Style `Select` to mimic HTML or swap to native select with CSS from HTML. |
| Area dropdown option text | "AreaName, SE15 (123 visits)" (`damp_mould_heatmap_interactive.html`) | "AreaName, SE15 (123)" (`src/pages/HeatmapPage.tsx`) | Different | Missing "visits" suffix. | Append "visits" to match HTML. |
| Visit filter label | "Filter by Visits" (`damp_mould_heatmap_interactive.html`) | "Visit Type" (`src/pages/HeatmapPage.tsx`) | Different | Label mismatch. | Rename to match HTML. |
| Visit filter labels | All / Single / Multiple (`damp_mould_heatmap_interactive.html`) | All / Single / Multi Visit (`src/pages/HeatmapPage.tsx`) | Different | "Multiple" vs "Multi Visit". | Update label text. |
| Min visits label | "Number of Visits" (`damp_mould_heatmap_interactive.html`) | "Min Visits" (`src/pages/HeatmapPage.tsx`) | Different | Label mismatch. | Rename to match HTML. |
| Slider tick labels | 1 / 5 / 10+ (`damp_mould_heatmap_interactive.html`) | 1 / 10+ (`src/pages/HeatmapPage.tsx`) | Different | Missing mid tick. | Add the 5 marker. |
| Slider track/height | 6px track, custom thumb with border/shadow (`damp_mould_heatmap_interactive.html`) | Shadcn slider default track height and custom thumb sizes only (`src/pages/HeatmapPage.tsx`) | Different | Slider styling does not match HTML. | Port slider CSS or use native range input. |
| Search control | Not present in HTML; required by PRD (`tasks/prd-damp-mould-heatmap.md`) | Present (`src/pages/HeatmapPage.tsx`) | Added | New control not in HTML. | Keep if PRD takes precedence; otherwise hide or relocate. |
| Snapshot selector placement | PRD wireframe places near stats header (`tasks/prd-damp-mould-heatmap.md`) | Inside controls panel (`src/pages/HeatmapPage.tsx`) | Different | Placement differs from PRD. | Move snapshot selector to the stats header. |
| Export button | Not in HTML; required by PRD (`tasks/prd-damp-mould-heatmap.md`) | Present in controls panel (`src/pages/HeatmapPage.tsx`) | Same (PRD) | Matches PRD, not HTML. | Keep but style to match HTML panel controls. |

## Heatmap area stats list comparison (right panel)
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Area bar scaling | Log scale based on `total_visits` (`damp_mould_heatmap_interactive.html`) | Linear scale (`src/components/AreaStatsPanel.tsx`) | Different | Relative bar lengths do not match HTML. | Use log scale formula from HTML. |
| Area item layout | Area name with outcode inline, count on right (`damp_mould_heatmap_interactive.html`) | Two-column grid, outcode separate (`src/components/AreaStatsPanel.tsx`) | Different | Typography and alignment differ. | Match HTML markup and CSS classes. |
| Area item hover | Subtle lift/shadow (`damp_mould_heatmap_interactive.html`) | Similar lift/shadow (`src/components/AreaStatsPanel.tsx`) | Same | Behavior matches. | No change. |
| Area click zoom | `map.setView` with zoom 14 (`damp_mould_heatmap_interactive.html`) | `map.flyTo` with zoom 15 (`src/components/MapController.tsx`) | Different | Zoom level and animation differ. | Use zoom 14 and adjust animation to match HTML. |
| Scroll indicator | Scroll lip with "Scroll for more" (`damp_mould_heatmap_interactive.html`) | None (`src/components/AreaStatsPanel.tsx`) | Missing | UX indicator missing. | Implement scroll-lip and visibility logic. |

## Heatmap map and layer comparison
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Tile layer | CartoDB light tiles (`https://{s}.basemaps.cartocdn.com/light_all/...`) (`damp_mould_heatmap_interactive.html`) | OpenStreetMap tiles (`src/pages/HeatmapPage.tsx`) | Different | Base map color/style differs (reported by user). | Switch to the CartoDB light tile layer. |
| Map background | `#e9eef0` background for `#map` (`docs/heatmap-design.css`) | No map background set (`src/index.css`) | Different | Background tone may differ while tiles load. | Add `.leaflet-container { background: #e9eef0; }`. |
| Heatmap radius/blur | radius 18, blur 22, maxZoom 16 (`damp_mould_heatmap_interactive.html`) | radius 25, blur 15, maxZoom 17 (`src/components/HeatmapLayer.tsx`) | Different | Heatmap softness and spread differ. | Update heatmap options to match HTML. |
| Heatmap gradient stops | Stops at 0.2/0.4/0.6/0.8/1.0 (`damp_mould_heatmap_interactive.html`) | Stops at 0.0/0.25/0.5/0.75/1.0 (`src/components/HeatmapLayer.tsx`) | Different | Color distribution differs. | Use the same stop values as HTML. |
| Heatmap max intensity | No `max` set (`damp_mould_heatmap_interactive.html`) | `max: 10` (`src/components/HeatmapLayer.tsx`) | Different | Heatmap intensity scaling differs. | Remove or align `max` with HTML logic. |
| Marker radius | `min(5 + visit_count * 2, 20)` (`damp_mould_heatmap_interactive.html`) | `min(6 + log2(visit) * 3, 16)` (`src/components/MarkerLayer.tsx`) | Different | Marker size scaling differs. | Use linear scaling from HTML. |
| Marker stroke | Stroke color `#f8fafb`, weight 1 (`damp_mould_heatmap_interactive.html`) | Stroke `#fff`, weight 2 (`src/components/MarkerLayer.tsx`) | Different | Edge weight and color differ. | Match stroke color and weight. |
| Marker opacity | `fillOpacity: 0.82` (`damp_mould_heatmap_interactive.html`) | `fillOpacity: 0.8` (`src/components/MarkerLayer.tsx`) | Different | Slight opacity mismatch. | Match 0.82 if needed. |
| Cluster radius | `maxClusterRadius: 50` (`damp_mould_heatmap_interactive.html`) | `maxClusterRadius: 80` (`src/components/ClusterLayer.tsx`) | Different | Cluster density differs. | Use 50 to match HTML. |
| Cluster sizing | Thresholds >20 and >50, fixed size 40 (`damp_mould_heatmap_interactive.html`) | Thresholds >=10 and >=100, sizes 40/45/50 (`src/components/ClusterLayer.tsx`) | Different | Cluster sizes and thresholds differ. | Align to HTML thresholds and size. |
| Cluster styling | CSS classes `marker-cluster-*` (`damp_mould_heatmap_interactive.html`) | Custom inline HTML (`src/components/ClusterLayer.tsx`) | Different | Appearance differs. | Use CSS classes and HTML structure from HTML. |
| Zoom control placement | Offset to the right of controls panel (`docs/heatmap-design.css`) | Default top-left (`src/pages/HeatmapPage.tsx`) | Different | Zoom control position differs. | Add CSS positioning rules from HTML. |
| Zoom control styling | Custom button styling (`docs/heatmap-design.css`) | Default Leaflet styling (`src/index.css`) | Different | Zoom buttons look different. | Port zoom control CSS to `src/index.css`. |
| Popup auto-pan | Custom padding so popups avoid panels (`damp_mould_heatmap_interactive.html`) | Default Leaflet popup behavior (`src/components/MarkerLayer.tsx`) | Missing | Popups can be hidden by panels. | Implement `popupopen` handler with padding logic from HTML. |
| Loading overlay | Full-screen overlay with spinner (`damp_mould_heatmap_interactive.html`) | Small inline "Loading properties..." text (`src/pages/HeatmapPage.tsx`) | Different | Loading UX differs. | Replace with full-screen overlay per HTML. |

## Heatmap popup comparison
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Popup close button | Custom close button in banner (`damp_mould_heatmap_interactive.html`) | Default close hidden, no custom close (`src/index.css`, `src/components/MarkerLayer.tsx`) | Missing | Users must click map to close. | Add close button and handler in popup header. |
| Popup header title | "Property Details" (`damp_mould_heatmap_interactive.html`) | "Recurring Issue" or "Single Visit" (`src/components/MarkerLayer.tsx`) | Different | Title text mismatch. | Update header title to match HTML. |
| Badge text | "Multiple Visits" / "Single Visit" (`damp_mould_heatmap_interactive.html`) | "Multi-Visit" / "Single Visit" (`src/components/MarkerLayer.tsx`) | Different | Badge label mismatch. | Update badge text. |
| Highlight color | Single uses `#0b4d4f` (`docs/heatmap-design.css`) | Single uses `#0f5d5e` (`src/components/MarkerLayer.tsx`) | Different | Highlight tone differs. | Use `#0b4d4f` for single visit. |
| Icons | Inline SVG icons from HTML (`damp_mould_heatmap_interactive.html`) | Lucide icons (`src/components/MarkerLayer.tsx`) | Different | Icon style differs. | Use the HTML SVGs or custom icon components to match. |
| Status footer | Not present in HTML markup | Status footer added (`src/components/MarkerLayer.tsx`) | Added | Extra content not in HTML. | Remove if matching HTML is required. |
| Popup base styling | 14px radius, large shadow (`damp_mould_heatmap_interactive.html`) | Same styles in `src/index.css` | Same | Popup shell styling matches. | No change. |

## Responsive behavior comparison
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Mobile header stacking | Header stacks and stats bar spans full width <768 (`docs/heatmap-design.css`) | No explicit responsive header rules (`src/components/Header.tsx`) | Different | Mobile layout differs. | Add breakpoints to match HTML header layout. |
| Mobile toggle icons | Menu + grid icons (`damp_mould_heatmap_interactive.html`) | Sliders + bar chart icons (`src/pages/HeatmapPage.tsx`) | Different | Iconography differs. | Replace icons with HTML equivalents. |
| Mobile overlay behavior | Overlay visible <768, transparent for 480-767 (`docs/heatmap-design.css`) | Overlay only <640 and always dark (`src/pages/HeatmapPage.tsx`) | Different | Overlay behavior differs from HTML. | Match HTML overlay rules per breakpoint. |
| Mobile zoom control placement | Moves to left 70px on mobile (`docs/heatmap-design.css`) | Default placement (`src/pages/HeatmapPage.tsx`) | Different | Zoom controls are not repositioned. | Add mobile positioning CSS rules. |
| Panel slide animations | 0.3s ease (`docs/heatmap-design.css`) | 0.3s ease-out (`src/pages/HeatmapPage.tsx`) | Partial | Slight easing mismatch. | Change to `ease` to match HTML. |

## Data and behavior gaps
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Property count on map | Full dataset (9,870) from DB (`tasks/prd-damp-mould-heatmap.md`) | Supabase query with default limit 1000 (`src/hooks/useProperties.ts`) | Different | Only 1000 properties returned by default. | Add pagination or `.range(0, 9999)` and iterate until all rows are fetched. |
| Outcode stats with snapshots | Should update when snapshot changes (`tasks/prd-damp-mould-heatmap.md`) | `useOutcodeStats` always uses current import (`src/hooks/useOutcodeStats.ts`) | Missing | Area list and dropdown do not change for historical snapshots. | Add `importId` param to `useOutcodeStats` and pass selected snapshot. |
| Snapshot selector placement | In stats header (PRD wireframe) | In controls panel (`src/pages/HeatmapPage.tsx`) | Different | Placement mismatch. | Move selector to header area. |
| Historical banner CTA | "View Current" button expected (`tasks/prd-damp-mould-heatmap.md`) | None (`src/pages/HeatmapPage.tsx`) | Missing | No quick return action. | Add button to clear selected import. |
| Top areas click-through | Click navigates to filtered heatmap (`tasks/prd-damp-mould-heatmap.md`) | Navigates with query param, not read by HeatmapPage (`src/components/TopAreasChart.tsx`, `src/pages/HeatmapPage.tsx`) | Missing | Filter does not apply on navigation. | Read query param in HeatmapPage and set `selectedArea`. |
| Search highlight | PRD says highlight or isolate (`tasks/prd-damp-mould-heatmap.md`) | Filters list only (`src/hooks/useProperties.ts`) | Partial | No explicit highlighting. | Add highlight styling to markers or list results. |

## Dashboard comparison (PRD vs React)
| Area/feature | Expected (PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Welcome copy | "Welcome back, Victor" + "Here's your current overview" (`tasks/prd-damp-mould-heatmap.md`) | Different subtitle text (`src/pages/DashboardPage.tsx`) | Different | Copy does not match PRD wireframe. | Update copy text. |
| Card radius/shadow | 14px radius, large shadow (`tasks/prd-damp-mould-heatmap.md`) | Default card radius 12px and small shadow (`src/components/ui/card.tsx`, `src/pages/DashboardPage.tsx`) | Different | Card shape and depth differ. | Override card radius and shadow to match design tokens. |
| Problem areas layout | Top 5 chart left, two cards stacked right (wireframe) | Top 5 chart above, two cards in a 2-column row (`src/pages/DashboardPage.tsx`) | Different | Layout differs from PRD. | Rebuild layout to match wireframe proportions. |
| Quick actions row | Three equal-width buttons in a row (wireframe) | Flex wrap with auto width (`src/components/QuickActionsRow.tsx`) | Different | Buttons may not align as a uniform row. | Use fixed width or `flex-1` to create equal columns. |

## Import page comparison (PRD vs React)
| Area/feature | Expected (PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Import history columns | Date, filename, record count, uploaded by (`tasks/prd-damp-mould-heatmap.md`) | Date, filename, records, status (`src/pages/ImportPage.tsx`) | Different | Missing "uploaded by" column. | Add uploaded_by to query and table. |
| Error copy | "No 'Address' column found in file" (`tasks/prd-damp-mould-heatmap.md`) | "No Address column found in file" (`src/lib/importProcessor.ts`) | Different | Error text mismatch. | Update message string to match PRD. |

## Global typography and palette
| Area/feature | Expected (HTML/PRD) | Current (React) | Status | Gap detail | Fix approach |
| --- | --- | --- | --- | --- | --- |
| Body font | Manrope for body/UI (`damp_mould_heatmap_interactive.html`) | Manrope not imported; body uses default font (`src/index.css`, `index.html`) | Different | Typography does not match. | Import Manrope in `index.html` and set `body` font-family. |
| Display font | Fraunces for headings (`damp_mould_heatmap_interactive.html`) | Fraunces loaded, used only in brand (`src/components/Header.tsx`) | Partial | Other headings do not explicitly use Fraunces. | Apply Fraunces to headings where required. |
| Palette alignment | Teal/coral palette from HTML/PRD | Teal/coral used in map/dash components (`src/pages/HeatmapPage.tsx`, `src/components/*`) | Same | Matches HTML/PRD palette. | No change unless AGENTS palette is chosen. |

## Notes on solution approach
- Many layout and styling gaps can be resolved by porting CSS blocks from `docs/heatmap-design.css` into Tailwind classes or `src/index.css`. This is mostly a direct copy-and-adapt task.
- Map behavior gaps (auto-pan padding, map resize on header height, popup close buttons) need React-specific logic using `useMap` and event handlers. This is not a pure copy/paste.
- Data gaps (1000 record limit, snapshot-aware outcode stats, top-area navigation) need backend query changes and state wiring, not just styling.
