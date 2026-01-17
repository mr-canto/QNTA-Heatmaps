# Southwark Damp & Mould Heatmap

## Project Overview

An interactive borough-wide heatmap for Southwark Council that visualises damp and mould property visit data. The tool enables housing teams to identify areas and blocks with the highest levels of repair activity, providing data-driven insights to inform future investment planning and resource allocation.


## Target Audience

- **Southwark Council Housing Teams** - For identifying priority areas requiring attention
- **Investment Planning Teams** - For data-driven budget allocation decisions
- **Property Management Teams** - For understanding visit patterns across the borough
- **Senior Leadership** - For strategic oversight of damp and mould issues


## High-Level Tech / Architecture

| Component | Technology |
|-----------|------------|
| Map Engine | Leaflet.js 1.9.4 |
| Heatmap Layer | Leaflet.heat plugin |
| Marker Clustering | Leaflet.markercluster |
| Data Format | Embedded JSON (pre-processed from Excel) |
| Deployment | Single HTML file (self-contained, offline-capable) |
| Data Source | D&M raw data Pre AL.xlsx |

**Architecture:** Self-contained single-page application with no server dependencies. All property data is embedded directly in the HTML file, allowing for easy distribution and offline access. The map centres on Southwark borough with appropriate zoom constraints.
