# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QNTA Heatmap - A React web application for Southwark Council that visualizes damp and mould property visit data on an interactive map. Enables housing teams to identify problem areas and track patterns over time via historical snapshots.

## Development Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format all src files
npm run preview      # Preview production build
```

### Supabase Commands

```bash
npx supabase start           # Start local Supabase (requires Docker)
npx supabase stop            # Stop local Supabase
npm run gen:types            # Generate TypeScript types from local DB
npm run gen:types:remote     # Generate types from remote DB
```

Supabase Studio runs at http://localhost:54343 when local instance is active.

### Adding UI Components

```bash
npx shadcn@latest add <component-name>   # e.g., dialog, dropdown-menu, table
```

## Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york style)
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: React Query (server state), React Context (UI state)
- **Mapping**: Leaflet.js with leaflet.heat and leaflet.markercluster plugins
- **Charts**: Recharts
- **Icons**: Lucide React

### Path Aliases

Use `@/` for imports from src directory:
```typescript
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
```

### Key Directories

- `src/components/ui/` - shadcn/ui components
- `src/context/` - React contexts (AuthContext)
- `src/hooks/` - Custom hooks (useAuth, useSignOut)
- `src/lib/` - Utilities (supabase client, queryClient, utils)
- `src/pages/` - Page components
- `src/types/` - TypeScript types including generated database.types.ts
- `supabase/` - Supabase configuration

### Database Schema

Three main tables:
- `imports` - Import snapshots (uploaded_by, uploaded_at, filename, record_count, is_current)
- `properties` - Property data linked to imports (address, postcode, outcode, lat, lon, visit_count)
- `outcode_stats` - Aggregated statistics per outcode per import

### Authentication Flow

- All routes require authentication
- ProtectedRoute component wraps authenticated pages
- AuthContext provides user state via useAuth hook
- After login, redirect to /dashboard

## Project Conventions

### UI Requirements

- **No emojis** anywhere in the application UI
- Use shadcn/ui components for all UI elements
- Colour palette: Deep Blue (#1a237e) primary, Blue (#3949ab) single visit, Red (#ff5252) multi visit
- Single-visit properties render blue, multi-visit render red on map

### Map Configuration

- Center on Southwark: 51.4700, -0.0650
- Three view modes: Heatmap, Markers, Clusters
- Properties without valid postcodes are excluded from the database

### Outcode Area Mapping

SE15=Peckham, SE1=Borough, SE17=Walworth, SE16=Rotherhithe, SE5=Camberwell, SE22=East Dulwich, SE21=Dulwich, SE24=Herne Hill, SE11=Kennington, SE23=Forest Hill, SE14=New Cross, SE8=Deptford

### Data Import Rules

- Address column required, Postcode column optional
- Postcode extracted from Address first, Postcode column is fallback
- Geocoding via Postcodes.io API (no API key needed)
- Failed geocoding results in property exclusion

## Claude Behavior Rules

### Response Style

- Keep all responses short, concise, and in summary form. Avoid verbose explanations.

### File Sync Requirements

- `AGENTS.md` must always be kept in sync with `CLAUDE.md`. They must contain identical content.
- Whenever `CLAUDE.md` is modified, immediately update `AGENTS.md` with the same changes.
