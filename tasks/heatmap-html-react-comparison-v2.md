# Heatmap HTML vs React Comparison

## Scope and sources
- Source of truth: `damp_mould_heatmap_interactive.html`, `docs/heatmap-design.css`, `tasks/prd-damp-mould-heatmap.md`, `AGENTS.md`
- Current implementation (key files): `src/pages/HeatmapPage.tsx`, `src/components/HeatmapStatsHeader.tsx`, `src/components/AreaStatsPanel.tsx`, `src/components/MarkerLayer.tsx`, `src/components/ClusterLayer.tsx`, `src/components/HeatmapLayer.tsx`, `src/components/Header.tsx`, `src/index.css`, `src/pages/DashboardPage.tsx`, `src/pages/ImportPage.tsx`, `src/hooks/useProperties.ts`, `src/hooks/useOutcodeStats.ts`, `src/components/TopAreasChart.tsx`
- Method: static file comparison only (no runtime rendering)

## Source conflicts that need a decision
+--------------+-----------------+----------------+---------------+------------------+
| Area         | HTML/ CSS       | PRD            | AGENTS. md    | Status/ Notes    |
+--------------+-----------------+----------------+---------------+------------------+
| Brand/ titl  | "Southwark Damp | Header says    | N/ A          | Conflict: decide |
| e text       | & Mould         | "QNTA Heatmap" |               | whether the      |
|              | Heatmap" in     | ( `tasks/ prd- |               | heatmap page     |
|              | header ( `damp_ | damp- mould-   |               | title should     |
|              | m               |                |               |                  |
|              | ould_ heatmap_  | heatmap. md`)  |               | match HTML or    |
|              | in              |                |               |                  |
|              | teractive.      |                |               | the global app   |
|              | html`           |                |               |                  |
|              | )               |                |               | branding.        |
| Heatmap      | Total Work      | Total          | N/ A          | Conflict: HTML   |
| stat         | Orders,         | properties,    |               | vs PRD on which  |
| labels       | Properties,     | single,  multi |               | metrics appear   |
|              | Multi- Visit (  | ( `tasks/ prd- |               | in the header    |
|              | `d              |                |               |                  |
|              | amp_ mould_     | damp- mould-   |               | stats.           |
|              | heatm           |                |               |                  |
|              | ap_             | heatmap. md`)  |               |                  |
|              | interactive.    |                |               |                  |
|              | html`)          |                |               |                  |
| Legend       | Low,  Medium,   | Low - > High   | N/ A          | Conflict: number |
| labels       | High ( `damp_   | ( `tasks/ prd- |               | of legend        |
|              | mou             |                |               |                  |
|              | ld_ heatmap_    | damp- mould-   |               | labels.          |
|              | inte            |                |               |                  |
|              | ractive. html`) | heatmap. md`)  |               |                  |
| Color        | Teal/ coral     | Teal/ coral    | Deep blue     | Conflict:        |
| palette      | palette (       | palette        | primary,      | instructions vs  |
|              | `damp_          |                | blue          |                  |
|              | mould_ heatmap_ | ( `tasks/ prd- | single,  red  | PRD/ HTML.       |
|              | i               |                |               | Decide           |
|              | nteractive.     | damp- mould-   | multi         | which palette is |
|              | html            |                |               |                  |
|              | `,              | heatmap. md`)  | ( `AGENTS.    | authoritative.   |
|              |                 |                | md`)          |                  |
|              | `docs/ heatmap- |                |               |                  |
|              | design. css`)   |                |               |                  |
| Outcode      | Includes SE19,  | Includes same  | Shorter list  | Conflict: AGENTS |
| mapping      | SE26,  SE27,    | extended list  | ( `AGENTS.    | list is shorter  |
|              |                 |                | md`)          |                  |
|              | SE6,  DA14,     | ( `tasks/ prd- |               | than PRD/ HTML.  |
|              | SE4             |                |               |                  |
|              | ( `damp_ mould_ | damp- mould-   |               |                  |
|              | he              |                |               |                  |
|              | atmap_          | heatmap. md`)  |               |                  |
|              | interacti       |                |               |                  |
|              | ve. html`)      |                |               |                  |
+--------------+-----------------+----------------+---------------+------------------+

## Heatmap page comparison (header, layout, panels)
+--------------+--------------+--------------+--------------+--------------+--------------+
| Area/        | Expected     | Current      | Status       | Gap detail   | Fix approach |
| feature      |              |              |              |              |              |
|              | ( HTML/ PRD) | ( React)     |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+
| Heatmap page | "Southwark   | "QNTA        | Different    | Heatmap-     | Add a        |
| title        | Damp & Mould | Heatmap"     |              | specific     | heatmap page |
|              | Heatmap"     | global       |              | title text   | title/       |
|              |              |              |              |              | subtit       |
|              | header title | header only  |              | is missing   | le block,    |
|              |              |              |              |              | or           |
|              | ( `damp_     | ( `src/      |              | and global   | replace      |
|              | mould        | compon       |              |              |              |
|              | _ heatmap_   | ents/        |              | brand        | brand text   |
|              | int          | Header.      |              |              |              |
|              | eractive.    | tsx`)        |              | differs.     | when on      |
|              | htm          |              |              |              |              |
|              | l`)          |              |              |              | `/ heatmap`. |
|              |              |              |              |              | Needs a      |
|              |              |              |              |              | product      |
|              |              |              |              |              | decision due |
|              |              |              |              |              | to source    |
|              |              |              |              |              | conflict.    |
| Header       | Date range   | No subtitle  | Missing      | Date range   | Add a        |
| subtitle     | text in      | ( `src/      |              | line is      | subtitle     |
|              |              | compon       |              |              |              |
|              | header (     | ents/        |              | absent.      | area and     |
|              | `dam         | Header.      |              |              |              |
|              | p_ mould_    | tsx`)        |              |              | compute date |
|              | heat         |              |              |              |              |
|              | map_         |              |              |              | range from   |
|              | interact     |              |              |              |              |
|              | ive. html`)  |              |              |              | current      |
|              |              |              |              |              | snapshot     |
|              |              |              |              |              | metadata.    |
| Header       | Shadow,      | Single       | Different    | Visual       | Port header  |
| styling      | border-      | radial       |              | weight and   | CSS from     |
|              | bottom,      | overlay,  no |              | spacing do   | HTML into    |
|              | dual         |              |              |              |              |
|              | radial       | shadow/      |              | not match.   | Tailwind or  |
|              |              | borde        |              |              |              |
|              | overlay,     | r,  padding  |              |              | add a CSS    |
|              | padding 16px | 24px ( `src/ |              |              | class in `sr |
|              |              | c            |              |              |              |
|              | 28px (       | omponents/   |              |              | c/ index.    |
|              | `docs/       | He           |              |              | css`         |
|              | heatmap-     | ader. tsx`)  |              |              | .            |
|              | design.      |              |              |              |              |
|              | css`)        |              |              |              |              |
| Header       | Stacks on    | No           | Different    | Mobile       | Add          |
| responsive   | <768px with  | responsive   |              | layout       | responsive   |
| layout       | stats bar    | header rules |              | differs from | styles for   |
|              | full width ( | ( `src/      |              | HTML ( no    | header and   |
|              |              | compon       |              |              |              |
|              | `docs/       | ents/        |              | stacking     | nav to match |
|              | heatma       | Header.      |              |              |              |
|              | p-           | tsx`)        |              | rules) .     | HTML         |
|              | design.      |              |              |              | breakpoints. |
|              | css`)        |              |              |              |              |
| Heatmap      | Stats inside | Separate bar | Different    | Stats are in | Move stats   |
| stats        | header,      | overlay at   |              | a different  | into the     |
| location     | right-       | top of map,  |              | container    | header or    |
|              | aligned (    | centered (   |              | and          | align        |
|              | `da          | `s           |              |              |              |
|              | mp_ mould_   | rc/          |              | alignment.   | placement to |
|              | hea          | component    |              |              |              |
|              | tmap_        | s/           |              |              | HTML.        |
|              | interac      | HeatmapSta   |              |              |              |
|              | tive. html`) | tsHeader.    |              |              |              |
|              |              | tsx          |              |              |              |
|              |              | `)           |              |              |              |
| Heatmap      | Total Work   | Properties / | Different    | Labels and   | Decide which |
| stats labels | Orders /     | Single Visit |              | metric set   | set to use;  |
|              | Properties / | /  Multi     |              | do not match | update       |
|              | Multi- Visit | Visit (      |              | HTML.        | labels and   |
|              |              | `src/        |              |              |              |
|              | ( `damp_     | components/  |              |              | data source  |
|              | mould        | H            |              |              |              |
|              | _ heatmap_   | eatmapStatsH |              |              | accordingly. |
|              | int          |              |              |              |              |
|              | eractive.    | eader. tsx`) |              |              |              |
|              | htm          |              |              |              |              |
|              | l`)          |              |              |              |              |
| Heatmap      | Static       | Derived from | Different    | HTML shows   | Align to     |
| stats data   | summary      | filtered     |              | global       | HTML or keep |
|              | values from  | `properties` |              | summary;     | PRD          |
|              | `mapData.    | list ( `src/ |              | React shows  | behavior; if |
|              | sum          | c            |              |              |              |
|              | mary` (      | omponents/   |              | filtered     | keeping PRD, |
|              | `damp        | He           |              |              |              |
|              | _ mould_     | atmapStatsHe |              | counts.      | update HTML  |
|              | heatm        |              |              |              |              |
|              | ap_          | ader. tsx`)  |              |              | expectations |
|              | interacti    |              |              |              |              |
|              | ve. html`)   |              |              |              | in design    |
|              |              |              |              |              | notes.       |
| Stats bar    | `justify-    | `justify-    | Different    | Metrics      | Change flex  |
| alignment    | content:     | center` (    |              | centered     | alignment to |
|              |              | `sr          |              |              |              |
|              | flex- end` ( | c/           |              | instead of   | `justify-    |
|              | `            | components   |              |              |              |
|              | docs/        | /            |              | right-       | end` and     |
|              | heatmap      | HeatmapStat  |              |              |              |
|              | -            | sHeader.     |              | aligned.     | adjust       |
|              |              | tsx`         |              |              |              |
|              | design.      | )            |              |              | spacing.     |
|              | css`)        |              |              |              |              |
| Banner for   | PRD expects  | Banner       | Partial      | Missing      | Add CTA to   |
| historical   | banner with  | present but  |              | button and   | clear `selec |
| snapshot     | "View        | no CTA (     |              | placement    | tedImportId` |
|              |              | `src         |              |              |              |
|              | Current"     | / pages/     |              | logic.       | and position |
|              |              | Heatm        |              |              |              |
|              | action       | apPage.      |              |              | below        |
|              |              | tsx`)        |              |              |              |
|              | ( `tasks/    |              |              |              | header.      |
|              | prd-         |              |              |              |              |
|              | damp- mould- |              |              |              |              |
|              | heatmap.     |              |              |              |              |
|              | md`)         |              |              |              |              |
| Banner       | Banner and   | HTML has no  | Different    | React banner | Add top      |
| stacking     | stats        | banner       |              | can overlap  | offset for   |
|              | overlap risk |              |              | stats bar.   | stats when   |
|              | ( both       |              |              |              | banner is    |
|              | `top- 0`     |              |              |              | visible.     |
|              | with         |              |              |              |              |
|              | different    |              |              |              |              |
|              | z- index)  ( |              |              |              |              |
|              | `s           |              |              |              |              |
|              | rc/ pages/   |              |              |              |              |
|              | Hea          |              |              |              |              |
|              | tmapPage.    |              |              |              |              |
|              | tsx          |              |              |              |              |
|              | `)           |              |              |              |              |
| Map          | HTML uses JS | Fixed `h-    | Different    | Does not     | Apply CSS    |
|              |              | [ca          |              |              |              |
| container    | to set       | lc( 100vh-   |              | account for  | variables    |
|              |              | 72p          |              |              |              |
| offset       | `margin-     | x) ]` with   |              | variable     | and resize   |
|              | top`         | no           |              |              |              |
|              | and height   | dynamic      |              | header/      | logic ( port |
|              |              |              |              | stats        |              |
|              | based on     | offsets (    |              | height.      | `setLayoutMe |
|              |              | `sr          |              |              |              |
|              | header (     | c/ pages/    |              |              | trics` into  |
|              | `dam         | Heat         |              |              |              |
|              | p_ mould_    | mapPage.     |              |              | React) .     |
|              | heat         | tsx`         |              |              |              |
|              | map_         | )            |              |              |              |
|              | interact     |              |              |              |              |
|              | ive. html`)  |              |              |              |              |
| Panels top   | Top offset   | Uses `calc(  | Partial      | Works for a  | Update       |
|              |              | 7            |              |              |              |
| offset       | is header    | 2px+18px) `  |              | fixed header | offset to    |
|              |              | (            |              |              |              |
|              | height +     | `src/ pages/ |              | only; does   | include      |
|              |              | H            |              |              |              |
|              | 18px (       | eatmapPage.  |              | not account  | stats bar    |
|              | `docs/       | t            |              |              |              |
|              | heatmap-     | sx`)         |              | for stats    | height or    |
|              | design.      |              |              | bar height.  | place stats  |
|              | css`)        |              |              |              |              |
|              |              |              |              |              | in header.   |
| Controls     | Left 24px,   | Left 24px,   | Same         | Matches HTML | No change.   |
| panel size/  | width 280px, | width 280px, |              | on desktop.  |              |
| p            |              |              |              |              |              |
| osition      | padding 16px | padding 16px |              |              |              |
|              | ( `docs/     | ( `src/      |              |              |              |
|              | heatm        | pages/       |              |              |              |
|              | ap-          | HeatmapPage. |              |              |              |
|              | design.      | tsx`)        |              |              |              |
|              | css`)        |              |              |              |              |
| Info panel s | Right 24px,  | Right 24px,  | Same         | Matches HTML | No change.   |
| ize/         | width 280px, | width 280px, |              | on desktop.  |              |
| position     |              |              |              |              |              |
|              | padding 16px | padding 16px |              |              |              |
|              | ( `docs/     | ( `src/      |              |              |              |
|              | heatm        | pages/       |              |              |              |
|              | ap-          | HeatmapPage. |              |              |              |
|              | design.      | tsx`)        |              |              |              |
|              | css`)        |              |              |              |              |
| Panel        | White        | Same styling | Same         | Matches      | No change.   |
| styling      | background,  | in controls/ |              | HTML.        |              |
|              | 1px border,  | info/ legend |              |              |              |
|              | 14px radius, | ( `src/      |              |              |              |
|              |              | pages/       |              |              |              |
|              | large shadow | HeatmapPage. |              |              |              |
|              | ( `docs/     | tsx`)        |              |              |              |
|              | heatm        |              |              |              |              |
|              | ap-          |              |              |              |              |
|              | design.      |              |              |              |              |
|              | css`)        |              |              |              |              |
| Info panel   | "Visits by   | "Areas by    | Different    | Title text   | Rename to    |
| title        | Area" (      | Visit Count" |              | mismatch.    | match HTML.  |
|              | `damp        |              |              |              |              |
|              | _ mould_     | ( `src/      |              |              |              |
|              | heatm        | pages/       |              |              |              |
|              | ap_          | HeatmapPage. |              |              |              |
|              | interacti    |              |              |              |              |
|              | ve. html`)   | tsx`)        |              |              |              |
| Info panel   | "Scroll for  | No scroll    | Missing      | UX cue       | Port scroll- |
| scroll       | more" lip    | indicator (  |              | missing.     | lip markup   |
|              |              | `            |              |              |              |
| indicator    | appears when | src/         |              |              | and scroll   |
|              |              | componen     |              |              |              |
|              | list scrolls | ts/          |              |              | handler from |
|              |              | AreaStats    |              |              |              |
|              | ( `damp_     | Panel. tsx`) |              |              | HTML.        |
|              | mould        |              |              |              |              |
|              | _ heatmap_   |              |              |              |              |
|              | int          |              |              |              |              |
|              | eractive.    |              |              |              |              |
|              | htm          |              |              |              |              |
|              | l`)          |              |              |              |              |
| Info panel   | Uses CSS     | Fixed `calc( | Partial      | Fixed        | Compute      |
| height       | variables    | 100vh- 72px- |              | numbers may  | legend       |
|              |              | 1            |              |              |              |
|              | based on     | 8px- 120px-  |              | not match    | height with  |
|              |              | 24           |              |              |              |
|              | actual       | px- 16px) `  |              | actual       | a ref or CSS |
|              |              | ( `          |              |              |              |
|              | legend       | src/ pages/  |              | legend       | var similar  |
|              |              | He           |              |              |              |
|              | height (     | atmapPage.   |              | height.      | to HTML.     |
|              | `doc         | ts           |              |              |              |
|              | s/ heatmap-  | x`)          |              |              |              |
|              | design.      |              |              |              |              |
|              | css`)        |              |              |              |              |
| Legend title | "Visit       | "Heat        | Different    | Title        | Update       |
|              | Intensity" ( | Intensity" ( |              | mismatch.    | legend       |
|              | `damp_       | `src/ pages/ |              |              | title.       |
|              | mould_       | H            |              |              |              |
|              | heatmap_     | eatmapPage.  |              |              |              |
|              | inte         | t            |              |              |              |
|              | ractive.     | sx`)         |              |              |              |
|              | html         |              |              |              |              |
|              | `)           |              |              |              |              |
| Legend       | Low /        | Low /  High  | Different    | Missing      | Add the      |
|              | Medium       | (            |              |              |              |
| labels       | /  High (    | `src/ pages/ |              | medium       | middle label |
|              | `dam         | H            |              |              |              |
|              | p_ mould_    | eatmapPage.  |              | label.       | and adjust   |
|              | heat         | t            |              |              |              |
|              | map_         | sx`)         |              |              | spacing.     |
|              | interact     |              |              |              |              |
|              | ive. html`)  |              |              |              |              |
| Legend       | Explicit 5   | CSS gradient | Different    | Color        | Use inline   |
| gradient     | stops at 0.  | with         |              | distribution | `style` with |
|              | 2            |              |              |              |              |
| stops        | / 0. 4/ 0.   | implicit     |              | likely       | exact        |
|              | 6/ 0. 8      |              |              |              |              |
|              | / 1 ( `damp_ | `via`        |              | different.   | gradient     |
|              | mo           |              |              |              |              |
|              | uld_         | spacing (    |              |              | stops or add |
|              | heatmap_     | `sr          |              |              |              |
|              | interactive. | c/ pages/    |              |              | CSS class.   |
|              |              | Heat         |              |              |              |
|              | html`)       | mapPage.     |              |              |              |
|              |              | tsx`         |              |              |              |
|              |              | )            |              |              |              |
| Legend       | 12px at      | 14px via     | Different    | Slight       | Adjust       |
| tablet       | <=1024px (   | `p- 3. 5` (  |              | spacing      | tablet       |
|              | `d           | `sr          |              |              |              |
| padding      | ocs/         | c/ pages/    |              | mismatch on  | padding to   |
|              | heatmap-     | Heat         |              |              |              |
|              | design.      | mapPage.     |              | tablet.      | 12px.        |
|              | css`)        | tsx`         |              |              |              |
|              |              | )            |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+

## Heatmap controls comparison (left panel)
+--------------+--------------+--------------+--------------+--------------+--------------+
| Area/        | Expected     | Current      | Status       | Gap detail   | Fix approach |
| feature      |              |              |              |              |              |
|              | ( HTML/ PRD) | ( React)     |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+
| Control      | View Mode -  | View Mode -  | Different    | Order        | Reorder to   |
|              | >            | >            |              |              |              |
| order        | Filter by    | Visit Type   |              | differs and  | match HTML;  |
|              | Area - >     | - > Min      |              | extra        | if keeping   |
|              | Filter by    | Visits - >   |              | sections     | new          |
|              | Visits - >   | Area Filter  |              | inserted.    | features,    |
|              | Number of    | - > Search - |              |              | place them   |
|              |              | >            |              |              |              |
|              | Visits (     | Snapshot - > |              |              | after the    |
|              | `dam         |              |              |              |              |
|              | p_ mould_    | Export (     |              |              | HTML         |
|              | heat         | `src         |              |              |              |
|              | map_         | / pages/     |              |              | sections.    |
|              | interact     | Heatm        |              |              |              |
|              | ive. html`)  | apPage.      |              |              |              |
|              |              | tsx`)        |              |              |              |
| View mode    | Text- only   | Buttons with | Different    | Icons change | Remove icons |
| buttons      | toggles (    | icons (      |              | spacing and  | or add       |
|              | `da          | `src/        |              |              |              |
|              | mp_ mould_   | pages/       |              | layout.      | custom       |
|              | hea          | Heatma       |              |              |              |
|              | tmap_        | pPage. tsx`) |              |              | styling to   |
|              | interac      |              |              |              |              |
|              | tive. html`) |              |              |              | match HTML.  |
| View mode    | Heatmap /    | Heatmap /    | Same         | Labels       | No change.   |
| labels       | Markers /    | Markers /    |              | match.       |              |
|              | Clusters (   | Clusters (   |              |              |              |
|              | `d           | `s           |              |              |              |
|              | amp_ mould_  | rc/ pages/   |              |              |              |
|              | he           | Hea          |              |              |              |
|              | atmap_       | tmapPage.    |              |              |              |
|              | intera       | tsx          |              |              |              |
|              | ctive.       | `)           |              |              |              |
|              | html`)       |              |              |              |              |
| Area filter  | "Filter by   | "Area        | Different    | Label text   | Rename to    |
| label        | Area" (      | Filter" (    |              | mismatch.    | match HTML.  |
|              | `damp        | `sr          |              |              |              |
|              | _ mould_     | c/ pages/    |              |              |              |
|              | heatm        | Heat         |              |              |              |
|              | ap_          | mapPage.     |              |              |              |
|              | interacti    | tsx`         |              |              |              |
|              | ve. html`)   | )            |              |              |              |
| Area         | Native       | Shadcn       | Different    | Visual and   | Style        |
| dropdown UI  | select with  | `Select` (   |              | interaction  | `Select` to  |
|              |              | `s           |              |              |              |
|              | custom arrow | rc/ pages/   |              | differences. | mimic HTML   |
|              |              | Hea          |              |              |              |
|              | ( `damp_     | tmapPage.    |              |              | or swap to   |
|              | mould        | tsx          |              |              |              |
|              | _ heatmap_   | `)           |              |              | native       |
|              | int          |              |              |              |              |
|              | eractive.    |              |              |              | select with  |
|              | htm          |              |              |              |              |
|              | l`)          |              |              |              | CSS from     |
|              |              |              |              |              | HTML.        |
| Area         | "AreaName,   | "AreaName,   | Different    | Missing      | Append       |
| dropdown     | SE15 ( 123   | SE15 ( 123)  |              | "visits"     | "visits" to  |
|              |              | "            |              |              |              |
| option text  | visits) " (  | ( `src/      |              | suffix.      | match HTML.  |
|              | `d           | pages/       |              |              |              |
|              | amp_ mould_  | HeatmapPage. |              |              |              |
|              | he           |              |              |              |              |
|              | atmap_       | tsx`)        |              |              |              |
|              | intera       |              |              |              |              |
|              | ctive.       |              |              |              |              |
|              | html`)       |              |              |              |              |
| Visit filter | "Filter by   | "Visit Type" | Different    | Label        | Rename to    |
| label        | Visits" (    | ( `src/      |              | mismatch.    | match HTML.  |
|              | `da          | pages/       |              |              |              |
|              | mp_ mould_   | HeatmapPage. |              |              |              |
|              | hea          |              |              |              |              |
|              | tmap_        | tsx`)        |              |              |              |
|              | interac      |              |              |              |              |
|              | tive. html`) |              |              |              |              |
| Visit filter | All /        | All /        | Different    | "Multiple"   | Update label |
|              | Single       | Single       |              |              |              |
| labels       | /  Multiple  | /  Multi     |              | vs "Multi    | text.        |
|              | (            |              |              |              |              |
|              | `damp_       | Visit (      |              | Visit".      |              |
|              | mould_       | `src/        |              |              |              |
|              | heatmap_     | pages/       |              |              |              |
|              | inte         | Heatma       |              |              |              |
|              | ractive.     | pPage. tsx`) |              |              |              |
|              | html         |              |              |              |              |
|              | `)           |              |              |              |              |
| Min visits   | "Number of   | "Min Visits" | Different    | Label        | Rename to    |
| label        | Visits" (    | ( `src/      |              | mismatch.    | match HTML.  |
|              | `da          | pages/       |              |              |              |
|              | mp_ mould_   | HeatmapPage. |              |              |              |
|              | hea          |              |              |              |              |
|              | tmap_        | tsx`)        |              |              |              |
|              | interac      |              |              |              |              |
|              | tive. html`) |              |              |              |              |
| Slider tick  | 1 /  5 /     | 1 /  10+ (   | Different    | Missing mid  | Add the 5    |
|              | 10+          | `sr          |              |              |              |
| labels       | ( `damp_     | c/ pages/    |              | tick.        | marker.      |
|              | mould        | Heat         |              |              |              |
|              | _ heatmap_   | mapPage.     |              |              |              |
|              | int          | tsx`         |              |              |              |
|              | eractive.    | )            |              |              |              |
|              | htm          |              |              |              |              |
|              | l`)          |              |              |              |              |
| Slider       | 6px track,   | Shadcn       | Different    | Slider       | Port slider  |
| track/       | custom thumb | slider       |              | styling does | CSS or use   |
| height       |              |              |              |              |              |
|              | with border/ | default      |              | not match    | native range |
|              | shadow (     | track height |              | HTML.        | input.       |
|              | `dam         |              |              |              |              |
|              | p_ mould_    | and custom   |              |              |              |
|              | heat         |              |              |              |              |
|              | map_         | thumb sizes  |              |              |              |
|              | interact     |              |              |              |              |
|              | ive. html`)  | only ( `src/ |              |              |              |
|              |              | p            |              |              |              |
|              |              | ages/        |              |              |              |
|              |              | Heatmap      |              |              |              |
|              |              | Page. tsx`)  |              |              |              |
| Search       | Not present  | Present (    | Added        | New control  | Keep if PRD  |
|              |              | `sr          |              |              |              |
| control      | in HTML;     | c/ pages/    |              | not in HTML. | takes        |
|              |              | Heat         |              |              |              |
|              | required by  | mapPage.     |              |              | precedence;  |
|              |              | tsx`         |              |              |              |
|              | PRD          | )            |              |              | otherwise    |
|              | ( `tasks/    |              |              |              | hide or      |
|              | prd-         |              |              |              |              |
|              | damp- mould- |              |              |              | relocate.    |
|              | heatmap.     |              |              |              |              |
|              | md`)         |              |              |              |              |
| Snapshot     | PRD          | Inside       | Different    | Placement    | Move         |
| selector     | wireframe    | controls     |              | differs from | snapshot     |
| placement    | places near  | panel (      |              | PRD.         | selector to  |
|              |              | `src/        |              |              |              |
|              | stats header | pages/       |              |              | the stats    |
|              |              | Heatma       |              |              |              |
|              | ( `tasks/    | pPage. tsx`) |              |              | header.      |
|              | prd-         |              |              |              |              |
|              | damp- mould- |              |              |              |              |
|              | heatmap.     |              |              |              |              |
|              | md`)         |              |              |              |              |
| Export       | Not in HTML; | Present in   | Same         | Matches PRD, | Keep but     |
| button       | required by  | controls     | ( PRD)       | not HTML.    | style to     |
|              | PRD          | panel (      |              |              | match HTML   |
|              |              | `src/        |              |              |              |
|              | ( `tasks/    | pages/       |              |              | panel        |
|              | prd-         | Heatma       |              |              |              |
|              | damp- mould- | pPage. tsx`) |              |              | controls.    |
|              | heatmap.     |              |              |              |              |
|              | md`)         |              |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+

## Heatmap area stats list comparison (right panel)
+--------------+--------------+---------------+--------------+---------------+---------------+
| Area/ feat   | Expected     | Current       | Status       | Gap detail    | Fix approach  |
| ure          | ( HTML/ PRD) | ( React)      |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+
| Area bar     | Log scale    | Linear scale  | Different    | Relative bar  | Use log scale |
| scaling      | based on `to | ( `src/       |              | lengths do    | formula from  |
|              |              | compone       |              |               |               |
|              | tal_ visits` | nts/          |              | not match     | HTML.         |
|              |              | AreaStats     |              |               |               |
|              | ( `damp_     | Panel. tsx`)  |              | HTML.         |               |
|              | mould        |               |              |               |               |
|              | _ heatmap_   |               |              |               |               |
|              | int          |               |              |               |               |
|              | eractive.    |               |              |               |               |
|              | htm          |               |              |               |               |
|              | l`)          |               |              |               |               |
| Area item    | Area name    | Two- column   | Different    | Typography    | Match HTML    |
| layout       | with outcode | grid,         |              | and alignment | markup and    |
|              |              | outcode       |              |               |               |
|              | inline,      | separate (    |              | differ.       | CSS classes.  |
|              |              | `sr           |              |               |               |
|              | count on     | c/            |              |               |               |
|              |              | components/   |              |               |               |
|              | right (      | AreaStatsPane |              |               |               |
|              | `damp        |               |              |               |               |
|              | _ mould_     | l. tsx`)      |              |               |               |
|              | heatm        |               |              |               |               |
|              | ap_          |               |              |               |               |
|              | interacti    |               |              |               |               |
|              | ve. html`)   |               |              |               |               |
| Area item    | Subtle       | Similar       | Same         | Behavior      | No change.    |
| hover        | lift/ shadow | lift/ shadow  |              | matches.      |               |
|              |              | (             |              |               |               |
|              | ( `damp_     | `src/         |              |               |               |
|              | mould        | componen      |              |               |               |
|              | _ heatmap_   | ts/           |              |               |               |
|              | int          | AreaStatsP    |              |               |               |
|              | eractive.    | anel. tsx`)   |              |               |               |
|              | htm          |               |              |               |               |
|              | l`)          |               |              |               |               |
| Area         | `map.        | `map. flyTo`  | Different    | Zoom level    | Use zoom 14   |
|              | setView      |               |              |               |               |
| click        | ` with zoom  | with zoom 15  |              | and animation | and adjust    |
| zoom         | 14 ( `damp_  | ( `src/       |              | differ.       | animation to  |
|              | mo           | compone       |              |               |               |
|              | uld_         | nts/          |              |               | match HTML.   |
|              | heatmap_     | MapContro     |              |               |               |
|              | interactive. | ller. tsx`)   |              |               |               |
|              | html`)       |               |              |               |               |
| Scroll       | Scroll lip   | None ( `src/  | Missing      | UX indicator  | Implement     |
|              |              | co            |              |               |               |
| indicator    | with "Scroll | mponents/     |              | missing.      | scroll- lip   |
|              |              | Area          |              |               |               |
|              | for more" (  | StatsPanel.   |              |               | and           |
|              | `            | ts            |              |               |               |
|              | damp_ mould_ | x`)           |              |               | visibility    |
|              | h            |               |              |               |               |
|              | eatmap_      |               |              |               | logic.        |
|              | inter        |               |              |               |               |
|              | active.      |               |              |               |               |
|              | html`        |               |              |               |               |
|              | )            |               |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+

## Heatmap map and layer comparison
+--------------+--------------+--------------+--------------+---------------+---------------+
| Area/ featu  | Expected     | Current      | Status       | Gap detail    | Fix approach  |
| re           | ( HTML/ PRD) | ( React)     |              |               |               |
+--------------+--------------+--------------+--------------+---------------+---------------+
| Tile layer   | CartoDB      | OpenStreetMa | Different    | Base map      | Switch to the |
|              | light tiles  | p tiles (    |              | color/ style  | CartoDB light |
|              |              | `sr          |              |               |               |
|              | ( `https:/ / | c/ pages/    |              | differs       | tile layer.   |
|              | {s           | Heat         |              |               |               |
|              | }. basemaps. | mapPage.     |              | ( reported by |               |
|              | c            | tsx`         |              |               |               |
|              | artocdn.     | )            |              | user) .       |               |
|              | com/         |              |              |               |               |
|              | light_ all/  |              |              |               |               |
|              | . .          |              |              |               |               |
|              | . `)  (      |              |              |               |               |
|              | `damp_ m     |              |              |               |               |
|              | ould_        |              |              |               |               |
|              | heatmap      |              |              |               |               |
|              | _            |              |              |               |               |
|              | interactive  |              |              |               |               |
|              | . html`)     |              |              |               |               |
| Map          | `#e9eef0`    | No map       | Different    | Background    | Add           |
| background   | background   | background   |              | tone may      | `. leaflet-   |
|              | for `#map` ( | set ( `src/  |              | differ while  | container {   |
|              |              | in           |              |               |               |
|              | `docs/       | dex. css`)   |              | tiles load.   | background:   |
|              | heatma       |              |              |               |               |
|              | p-           |              |              |               | #e9eef0; }`.  |
|              | design.      |              |              |               |               |
|              | css`)        |              |              |               |               |
| Heatmap ra   | radius 18,   | radius 25,   | Different    | Heatmap       | Update        |
| dius/ blur   | blur 22,     | blur 15,     |              | softness and  | heatmap       |
|              | maxZoom 16 ( | maxZoom 17 ( |              | spread        | options to    |
|              | `damp_       | `src/        |              | differ.       | match HTML.   |
|              | mould_       | compone      |              |               |               |
|              | heatmap_     | nts/         |              |               |               |
|              | inte         | HeatmapL     |              |               |               |
|              | ractive.     | ayer. tsx`)  |              |               |               |
|              | html         |              |              |               |               |
|              | `)           |              |              |               |               |
| Heatmap      | Stops at 0.  | Stops at 0.  | Different    | Color         | Use the same  |
|              | 2            | 0            |              |               |               |
| gradient     | / 0. 4/ 0.   | / 0. 25/ 0.  |              | distribution  | stop values   |
|              | 6/ 0. 8      | 5/ 0.        |              |               |               |
| stops        | / 1. 0 (     | 75/ 1. 0 (   |              | differs.      | as HTML.      |
|              | `damp_       | `src         |              |               |               |
|              | mould_       | /            |              |               |               |
|              | heatma       | components/  |              |               |               |
|              | p_           | HeatmapLayer |              |               |               |
|              | interactiv   |              |              |               |               |
|              | e. html`)    | . tsx`)      |              |               |               |
| Heatmap      | No `max` set | `max: 10` (  | Different    | Heatmap       | Remove or     |
|              |              | `            |              |               |               |
| max          | ( `damp_     | src/         |              | intensity     | align `max`   |
|              | mould        | componen     |              |               |               |
| intensity    | _ heatmap_   | ts/          |              | scaling       | with HTML     |
|              | int          | HeatmapLa    |              |               |               |
|              | eractive.    | yer. tsx`)   |              | differs.      | logic.        |
|              | htm          |              |              |               |               |
|              | l`)          |              |              |               |               |
| Marker       | `min( 5 +    | `min( 6 +    | Different    | Marker size   | Use linear    |
| radius       | visit_ count | log2( visit) |              | scaling       | scaling from  |
|              | * 2,  20) `  | * 3,  16) `  |              | differs.      | HTML.         |
|              | ( `          | ( `          |              |               |               |
|              | damp_ mould_ | src/         |              |               |               |
|              | h            | componen     |              |               |               |
|              | eatmap_      | ts/          |              |               |               |
|              | inter        | MarkerLay    |              |               |               |
|              | active.      | er. tsx`)    |              |               |               |
|              | html`        |              |              |               |               |
|              | )            |              |              |               |               |
| Marker       | Stroke color | Stroke       | Different    | Edge weight   | Match stroke  |
| stroke       | `#f8fafb`,   | `#fff`,      |              | and color     | color and     |
|              | weight 1 (   | weight 2 (   |              | differ.       | weight.       |
|              | `d           | `s           |              |               |               |
|              | amp_ mould_  | rc/          |              |               |               |
|              | he           | component    |              |               |               |
|              | atmap_       | s/           |              |               |               |
|              | intera       | MarkerLaye   |              |               |               |
|              | ctive.       | r. tsx`)     |              |               |               |
|              | html`)       |              |              |               |               |
| Marker       | `fillOpacity | `fillOpacity | Different    | Slight        | Match 0. 82   |
|              |              |              |              |               | if            |
| opacity      | : 0. 82` (   | : 0. 8` (    |              | opacity       | needed.       |
|              | `da          | `src         |              |               |               |
|              | mp_ mould_   | /            |              | mismatch.     |               |
|              | hea          | components/  |              |               |               |
|              | tmap_        | MarkerLayer. |              |               |               |
|              | interac      |              |              |               |               |
|              | tive. html`) | tsx`)        |              |               |               |
| Cluster      | `maxClusterR | `maxClusterR | Different    | Cluster       | Use 50 to     |
| radius       | adius: 50` ( | adius: 80` ( |              | density       | match HTML.   |
|              | `damp_       | `src/        |              | differs.      |               |
|              | mould_       | compone      |              |               |               |
|              | heatmap_     | nts/         |              |               |               |
|              | inte         | ClusterL     |              |               |               |
|              | ractive.     | ayer. tsx`)  |              |               |               |
|              | html         |              |              |               |               |
|              | `)           |              |              |               |               |
| Cluster      | Thresholds   | Thresholds   | Different    | Cluster sizes | Align to HTML |
| sizing       | >20 and >50, | >=10 and     |              | and           | thresholds    |
|              | fixed size   | >=100,       |              | thresholds    | and size.     |
|              |              | sizes        |              |               |               |
|              | 40 ( `damp_  | 40/ 45/ 50 ( |              | differ.       |               |
|              | mo           | `s           |              |               |               |
|              | uld_         | rc/          |              |               |               |
|              | heatmap_     | component    |              |               |               |
|              | interactive. | s/           |              |               |               |
|              |              | ClusterLay   |              |               |               |
|              | html`)       | er. tsx`)    |              |               |               |
| Cluster      | CSS classes  | Custom       | Different    | Appearance    | Use CSS       |
| styling      | `marker-     | inline HTML  |              | differs.      | classes and   |
|              | cluster- *`  | ( `src/      |              |               | HTML          |
|              | (            | compon       |              |               |               |
|              | `damp_       | ents/        |              |               | structure     |
|              | mould_       | Cluster      |              |               |               |
|              | heatmap_     | Layer. tsx`) |              |               | from HTML.    |
|              | inte         |              |              |               |               |
|              | ractive.     |              |              |               |               |
|              | html         |              |              |               |               |
|              | `)           |              |              |               |               |
| Zoom         | Offset to    | Default top- | Different    | Zoom control  | Add CSS       |
| control      | the right of | left ( `src/ |              | position      | positioning   |
|              |              | p            |              |               |               |
| placement    | controls     | ages/        |              | differs.      | rules from    |
|              |              | Heatmap      |              |               |               |
|              | panel (      | Page. tsx`)  |              |               | HTML.         |
|              | `docs        |              |              |               |               |
|              | / heatmap-   |              |              |               |               |
|              | design.      |              |              |               |               |
|              | css`)        |              |              |               |               |
| Zoom         | Custom       | Default      | Different    | Zoom buttons  | Port zoom     |
| control      | button       | Leaflet      |              | look          | control CSS   |
| styling      | styling (    | styling (    |              | different.    | to `src/      |
|              | `do          | `sr          |              |               | index         |
|              | cs/ heatmap- | c/ index.    |              |               | . css`.       |
|              |              | css`         |              |               |               |
|              | design.      | )            |              |               |               |
|              | css`)        |              |              |               |               |
| Popup        | Custom       | Default      | Missing      | Popups can be | Implement     |
| auto- pan    | padding so   | Leaflet      |              | hidden by     | `popupopen`   |
|              | popups avoid | popup        |              | panels.       | handler with  |
|              | panels (     | behavior (   |              |               | padding logic |
|              | `dam         | `s           |              |               |               |
|              | p_ mould_    | rc/          |              |               | from HTML.    |
|              | heat         | component    |              |               |               |
|              | map_         | s/           |              |               |               |
|              | interact     | MarkerLaye   |              |               |               |
|              | ive. html`)  | r. tsx`)     |              |               |               |
| Loading      | Full- screen | Small inline | Different    | Loading UX    | Replace with  |
| overlay      | overlay with | "Loading pro |              | differs.      | full- screen  |
|              | spinner (    | perties. . . |              |               | overlay per   |
|              | `da          | "            |              |               |               |
|              | mp_ mould_   | text ( `src/ |              |               | HTML.         |
|              | hea          | p            |              |               |               |
|              | tmap_        | ages/        |              |               |               |
|              | interac      | Heatmap      |              |               |               |
|              | tive. html`) | Page. tsx`)  |              |               |               |
+--------------+--------------+--------------+--------------+---------------+---------------+

## Heatmap popup comparison
+--------------+--------------+---------------+--------------+---------------+---------------+
| Area/ feat   | Expected     | Current       | Status       | Gap detail    | Fix approach  |
| ure          | ( HTML/ PRD) | ( React)      |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+
| Popup        | Custom close | Default close | Missing      | Users must    | Add close     |
| close        | button in    | hidden,  no   |              | click map to  | button and    |
| button       | banner (     | custom close  |              | close.        | handler in    |
|              | `dam         |               |              |               |               |
|              | p_ mould_    | ( `src/       |              |               | popup header. |
|              | heat         | index. c      |              |               |               |
|              | map_         | ss`,  `src/   |              |               |               |
|              | interact     | com           |              |               |               |
|              | ive. html`)  | ponents/      |              |               |               |
|              |              | Marke         |              |               |               |
|              |              | rLayer. tsx`) |              |               |               |
| Popup        | "Property    | "Recurring    | Different    | Title text    | Update header |
| header       | Details" (   | Issue" or     |              | mismatch.     | title to      |
|              | `d           |               |              |               |               |
| title        | amp_ mould_  | "Single       |              |               | match HTML.   |
|              | he           |               |              |               |               |
|              | atmap_       | Visit" (      |              |               |               |
|              | intera       | `src/         |              |               |               |
|              | ctive.       | components/   |              |               |               |
|              | html`)       | Ma            |              |               |               |
|              |              | rkerLayer.    |              |               |               |
|              |              | tsx           |              |               |               |
|              |              | `)            |              |               |               |
| Badge        | "Multiple    | "Multi-       | Different    | Badge label   | Update badge  |
|              |              | Visit"        |              |               |               |
| text         | Visits" /    | /  "Single    |              | mismatch.     | text.         |
|              | "Single      | Visit" (      |              |               |               |
|              |              | `src/         |              |               |               |
|              | Visit" (     | components/   |              |               |               |
|              | `dam         | Ma            |              |               |               |
|              | p_ mould_    | rkerLayer.    |              |               |               |
|              | heat         | tsx           |              |               |               |
|              | map_         | `)            |              |               |               |
|              | interact     |               |              |               |               |
|              | ive. html`)  |               |              |               |               |
| Highlight    | Single uses  | Single uses   | Different    | Highlight     | Use `#0b4d4f` |
| color        | `#0b4d4f` (  | `#0f5d5e` (   |              | tone differs. | for single    |
|              | `            | `s            |              |               |               |
|              | docs/        | rc/           |              |               | visit.        |
|              | heatmap      | components    |              |               |               |
|              | -            | /             |              |               |               |
|              |              | MarkerLayer.  |              |               |               |
|              | design.      | tsx`)         |              |               |               |
|              | css`)        |               |              |               |               |
| Icons        | Inline SVG   | Lucide icons  | Different    | Icon style    | Use the HTML  |
|              | icons from   | ( `src/       |              | differs.      | SVGs or       |
|              |              | compone       |              |               |               |
|              | HTML (       | nts/          |              |               | custom icon   |
|              | `damp_       | MarkerLay     |              |               |               |
|              | mould_       | er. tsx`)     |              |               | components to |
|              | heatma       |               |              |               |               |
|              | p_           |               |              |               | match.        |
|              | interactiv   |               |              |               |               |
|              | e. html`)    |               |              |               |               |
| Status       | Not present  | Status footer | Added        | Extra content | Remove if     |
| footer       | in HTML      | added ( `src/ |              | not in HTML.  | matching HTML |
|              |              | c             |              |               |               |
|              | markup       | omponents/    |              |               | is required.  |
|              |              | Mar           |              |               |               |
|              |              | kerLayer.     |              |               |               |
|              |              | tsx`          |              |               |               |
|              |              | )             |              |               |               |
| Popup        | 14px radius, | Same styles   | Same         | Popup shell   | No change.    |
| base         | large shadow | in `src/      |              | styling       |               |
|              |              | index         |              |               |               |
| styling      | ( `damp_     | . css`        |              | matches.      |               |
|              | mould        |               |              |               |               |
|              | _ heatmap_   |               |              |               |               |
|              | int          |               |              |               |               |
|              | eractive.    |               |              |               |               |
|              | htm          |               |              |               |               |
|              | l`)          |               |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+

## Responsive behavior comparison
+--------------+--------------+--------------+--------------+--------------+--------------+
| Area/        | Expected     | Current      | Status       | Gap detail   | Fix approach |
| feature      |              |              |              |              |              |
|              | ( HTML/ PRD) | ( React)     |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+
| Mobile       | Header       | No explicit  | Different    | Mobile       | Add          |
| header       | stacks and   | responsive   |              | layout       | breakpoints  |
| stacking     | stats bar    | header rules |              | differs.     | to match     |
|              | spans full   | ( `src/      |              |              | HTML header  |
|              |              | compon       |              |              |              |
|              | width <768 ( | ents/        |              |              | layout.      |
|              |              | Header.      |              |              |              |
|              | `docs/       | tsx`)        |              |              |              |
|              | heatma       |              |              |              |              |
|              | p-           |              |              |              |              |
|              | design.      |              |              |              |              |
|              | css`)        |              |              |              |              |
| Mobile       | Menu + grid  | Sliders +    | Different    | Iconography  | Replace      |
| toggle icons | icons (      | bar chart    |              | differs.     | icons with   |
|              | `damp        |              |              |              |              |
|              | _ mould_     | icons (      |              |              | HTML         |
|              | heatm        | `src/        |              |              |              |
|              | ap_          | pages/       |              |              | equivalents. |
|              | interacti    | Heatma       |              |              |              |
|              | ve. html`)   | pPage. tsx`) |              |              |              |
| Mobile       | Overlay      | Overlay only | Different    | Overlay      | Match HTML   |
| overlay      | visible      | <640 and     |              | behavior     | overlay      |
| behavior     | <768,        | always dark  |              | differs from | rules per    |
|              | transparent  | ( `src/      |              | HTML.        | breakpoint.  |
|              |              | pages/       |              |              |              |
|              | for 480- 767 | HeatmapPage. |              |              |              |
|              | ( `docs/     | tsx`)        |              |              |              |
|              | heatm        |              |              |              |              |
|              | ap-          |              |              |              |              |
|              | design.      |              |              |              |              |
|              | css`)        |              |              |              |              |
| Mobile zoom  | Moves to     | Default      | Different    | Zoom         | Add mobile   |
| control      | left 70px on | placement (  |              | controls are | positioning  |
|              |              | `            |              |              |              |
| placement    | mobile (     | src/ pages/  |              | not repositi | CSS rules.   |
|              | `doc         | He           |              |              |              |
|              | s/ heatmap-  | atmapPage.   |              | oned.        |              |
|              |              | ts           |              |              |              |
|              | design.      | x`)          |              |              |              |
|              | css`)        |              |              |              |              |
| Panel slide  | 0. 3s ease ( | 0. 3s ease-  | Partial      | Slight       | Change to    |
|              | `            |              |              |              |              |
| animations   | docs/        | out ( `src/  |              | easing       | `ease` to    |
|              | heatmap      | pa           |              |              |              |
|              | -            | ges/         |              | mismatch.    | match HTML.  |
|              |              | HeatmapP     |              |              |              |
|              | design.      | age. tsx`)   |              |              |              |
|              | css`)        |              |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+

## Data and behavior gaps
+--------------+--------------+--------------+--------------+--------------+--------------+
| Area/        | Expected     | Current      | Status       | Gap detail   | Fix approach |
| feature      |              |              |              |              |              |
|              | ( HTML/ PRD) | ( React)     |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+
| Property     | Full dataset | Supabase     | Different    | Only 1000    | Add          |
| count on map | ( 9, 870)    | query with   |              | properties   | pagination   |
|              | from         |              |              |              |              |
|              | DB           | default      |              | returned by  | or           |
|              | ( `tasks/    | limit 1000 ( |              | default.     | `. range( 0, |
|              | prd-         |              |              |              |              |
|              | damp- mould- | `src/ hooks/ |              |              | 9999) ` and  |
|              |              | u            |              |              |              |
|              | heatmap.     | seProperties |              |              | iterate      |
|              | md`)         |              |              |              |              |
|              |              | . ts`)       |              |              | until all    |
|              |              |              |              |              | rows are     |
|              |              |              |              |              | fetched.     |
| Outcode      | Should       | `useOutcodeS | Missing      | Area list    | Add          |
| stats with   | update when  | tats` always |              | and dropdown | `importId`   |
| snapshots    | snapshot     | uses current |              | do not       | param to `us |
|              | changes      | import (     |              | change for   | eOutcodeStat |
|              |              | `src         |              |              |              |
|              | ( `tasks/    | / hooks/     |              | historical   | s` and pass  |
|              | prd-         | useOu        |              |              |              |
|              | damp- mould- | tcodeStats.  |              | snapshots.   | selected     |
|              |              | t            |              |              |              |
|              | heatmap.     | s`)          |              |              | snapshot.    |
|              | md`)         |              |              |              |              |
| Snapshot     | In stats     | In controls  | Different    | Placement    | Move         |
| selector     | header ( PRD | panel (      |              | mismatch.    | selector to  |
|              |              | `src/        |              |              |              |
| placement    | wireframe)   | pages/       |              |              | header area. |
|              |              | Heatma       |              |              |              |
|              |              | pPage. tsx`) |              |              |              |
| Historical   | "View        | None ( `src/ | Missing      | No quick     | Add button   |
|              |              | p            |              |              |              |
| banner CTA   | Current"     | ages/        |              | return       | to clear     |
|              |              | Heatmap      |              |              |              |
|              | button       | Page. tsx`)  |              | action.      | selected     |
|              | expected     |              |              |              | import.      |
|              | ( `tasks/    |              |              |              |              |
|              | prd-         |              |              |              |              |
|              | damp- mould- |              |              |              |              |
|              | heatmap.     |              |              |              |              |
|              | md`)         |              |              |              |              |
| Top areas    | Click        | Navigates    | Missing      | Filter does  | Read query   |
| click-       | navigates to | with query   |              | not apply on | param in     |
| through      | filtered     | param,  not  |              | navigation.  | HeatmapPage  |
|              | heatmap      | read by      |              |              | and set `sel |
|              | ( `tasks/    | HeatmapPage  |              |              | ectedArea`.  |
|              | prd-         |              |              |              |              |
|              | damp- mould- | ( `src/      |              |              |              |
|              |              | compon       |              |              |              |
|              | heatmap.     | ents/        |              |              |              |
|              | md`)         | TopArea      |              |              |              |
|              |              | sChart.      |              |              |              |
|              |              | tsx`,        |              |              |              |
|              |              | `src/ pages/ |              |              |              |
|              |              | H            |              |              |              |
|              |              | eatmapPage.  |              |              |              |
|              |              | t            |              |              |              |
|              |              | sx`)         |              |              |              |
| Search       | PRD says     | Filters list | Partial      | No explicit  | Add          |
| highlight    | highlight or | only ( `src/ |              | highlighting | highlight    |
|              |              | h            |              |              |              |
|              | isolate      | ooks/        |              | .            | styling to   |
|              |              | useProp      |              |              |              |
|              | ( `tasks/    | erties. ts`) |              |              | markers or   |
|              | prd-         |              |              |              |              |
|              | damp- mould- |              |              |              | list         |
|              | heatmap.     |              |              |              | results.     |
|              | md`)         |              |              |              |              |
+--------------+--------------+--------------+--------------+--------------+--------------+

## Dashboard comparison (PRD vs React)
+--------------+--------------+---------------+--------------+---------------+---------------+
| Area/ feat   | Expected     | Current       | Status       | Gap detail    | Fix approach  |
| ure          | ( PRD)       | ( React)      |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+
| Welcome      | "Welcome     | Different     | Different    | Copy does not | Update copy   |
| copy         | back,        | subtitle text |              | match PRD     | text.         |
|              | Victor" +    | ( `src/       |              | wireframe.    |               |
|              |              | pages/ D      |              |               |               |
|              | "Here's your | ashboardPage. |              |               |               |
|              | current      | tsx`)         |              |               |               |
|              | overview"    |               |              |               |               |
|              | ( `tasks/    |               |              |               |               |
|              | prd-         |               |              |               |               |
|              | damp- mould- |               |              |               |               |
|              | heatmap.     |               |              |               |               |
|              | md`)         |               |              |               |               |
| Card radi    | 14px radius, | Default card  | Different    | Card shape    | Override card |
| us/ shadow   | large shadow | radius 12px   |              | and depth     | radius and    |
|              | ( `tasks/    | and small     |              | differ.       | shadow to     |
|              | prd-         |               |              |               |               |
|              | damp- mould- | shadow (      |              |               | match design  |
|              |              | `src/         |              |               |               |
|              | heatmap.     | components/   |              |               | tokens.       |
|              | md`)         | ui            |              |               |               |
|              |              | / card. tsx`, |              |               |               |
|              |              | `             |              |               |               |
|              |              | src/ pages/   |              |               |               |
|              |              | Das           |              |               |               |
|              |              | hboardPage.   |              |               |               |
|              |              | ts            |              |               |               |
|              |              | x`)           |              |               |               |
| Problem      | Top 5 chart  | Top 5 chart   | Different    | Layout        | Rebuild       |
| areas        | left,  two   | above,  two   |              | differs from  | layout to     |
| layout       | cards        | cards in a    |              | PRD.          | match         |
|              | stacked      | 2- column row |              |               | wireframe     |
|              | right        | ( `src/       |              |               | proportions.  |
|              |              | pages/ D      |              |               |               |
|              | ( wireframe) | ashboardPage. |              |               |               |
|              |              | tsx`)         |              |               |               |
| Quick        | Three equal- | Flex wrap     | Different    | Buttons may   | Use fixed     |
| actions      | width        | with auto     |              | not align as  | width or      |
| row          | buttons in a | width ( `src/ |              | a uniform     | `flex- 1` to  |
|              |              | c             |              |               |               |
|              | row          | omponents/    |              | row.          | create equal  |
|              |              | Qui           |              |               |               |
|              | ( wireframe) | ckActionsRow. |              |               | columns.      |
|              |              | tsx`)         |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+

## Import page comparison (PRD vs React)
+--------------+--------------+--------------+--------------+---------------+--------------+
| Area/ featu  | Expected     | Current      | Status       | Gap detail    | Fix approach |
| re           | ( PRD)       | ( React)     |              |               |              |
+--------------+--------------+--------------+--------------+---------------+--------------+
| Import       | Date,        | Date,        | Different    | Missing       | Add          |
| history      | filename,    | filename,    |              | "uploaded by" | uploaded_ by |
| columns      | record       | records,     |              | column.       | to query and |
|              | count,       | status (     |              |               | table.       |
|              |              | `src         |              |               |              |
|              | uploaded by  | / pages/     |              |               |              |
|              |              | Impor        |              |               |              |
|              | ( `tasks/    | tPage. tsx`) |              |               |              |
|              | prd-         |              |              |               |              |
|              | damp- mould- |              |              |               |              |
|              | heatmap.     |              |              |               |              |
|              | md`)         |              |              |               |              |
| Error copy   | "No          | "No Address  | Different    | Error text    | Update       |
|              | 'Address'    | column found |              | mismatch.     | message      |
|              | column found | in file" (   |              |               | string to    |
|              |              | `s           |              |               |              |
|              | in file"     | rc/ lib/     |              |               | match PRD.   |
|              |              | impor        |              |               |              |
|              | ( `tasks/    | tProcessor.  |              |               |              |
|              | prd-         | t            |              |               |              |
|              | damp- mould- | s`)          |              |               |              |
|              | heatmap.     |              |              |               |              |
|              | md`)         |              |              |               |              |
+--------------+--------------+--------------+--------------+---------------+--------------+

## Global typography and palette
+--------------+--------------+---------------+--------------+---------------+---------------+
| Area/ feat   | Expected     | Current       | Status       | Gap detail    | Fix approach  |
| ure          | ( HTML/ PRD) | ( React)      |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+
| Body font    | Manrope for  | Manrope not   | Different    | Typography    | Import        |
|              | body/ UI (   | imported;     |              | does not      | Manrope in    |
|              | `da          |               |              |               |               |
|              | mp_ mould_   | body uses     |              | match.        | `index. html` |
|              | hea          |               |              |               |               |
|              | tmap_        | default font  |              |               | and set       |
|              | interac      |               |              |               |               |
|              | tive. html`) | ( `src/       |              |               | `body` font-  |
|              |              | index. c      |              |               |               |
|              |              | ss`,          |              |               | family.       |
|              |              | `index.       |              |               |               |
|              |              | html`)        |              |               |               |
| Display      | Fraunces for | Fraunces      | Partial      | Other         | Apply         |
| font         | headings (   | loaded,  used |              | headings do   | Fraunces to   |
|              | `d           |               |              |               |               |
|              | amp_ mould_  | only in brand |              | not           | headings      |
|              | he           |               |              |               |               |
|              | atmap_       | ( `src/       |              | explicitly    | where         |
|              | intera       | compone       |              |               |               |
|              | ctive.       | nts/ Header.  |              | use Fraunces. | required.     |
|              | html`)       | ts            |              |               |               |
|              |              | x`)           |              |               |               |
| Palette      | Teal/ coral  | Teal/ coral   | Same         | Matches       | No change     |
| alignment    | palette from | used in       |              | HTML/ PRD     | unless AGENTS |
|              | HTML/ PRD    | map/ dash     |              | palette.      | palette is    |
|              |              | components (  |              |               | chosen.       |
|              |              | `             |              |               |               |
|              |              | src/ pages/   |              |               |               |
|              |              | Hea           |              |               |               |
|              |              | tmapPage.     |              |               |               |
|              |              | tsx`          |              |               |               |
|              |              | ,  `src/      |              |               |               |
|              |              | compon        |              |               |               |
|              |              | ents/ *`)     |              |               |               |
+--------------+--------------+---------------+--------------+---------------+---------------+

## Notes on solution approach
- Many layout and styling gaps can be resolved by porting CSS blocks from `docs/heatmap-design.css` into Tailwind classes or `src/index.css`. This is mostly a direct copy-and-adapt task.
- Map behavior gaps (auto-pan padding, map resize on header height, popup close buttons) need React-specific logic using `useMap` and event handlers. This is not a pure copy/paste.
- Data gaps (1000 record limit, snapshot-aware outcode stats, top-area navigation) need backend query changes and state wiring, not just styling.
