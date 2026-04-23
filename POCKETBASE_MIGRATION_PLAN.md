# PocketBase Migration Plan

## Overview
Migrate QNTA Heatmap from Supabase to PocketBase. New project folder with data migration from existing Supabase database.

---

## ⚠️ IMPORTANT: Workflow Structure

This migration has **TWO PARTS**:

1. **MANUAL SETUP (Phases 1-2)** - Must be done by hand BEFORE running Ralph
2. **AUTOMATED CODING (Phases 3-8)** - Handled by Ralph using `prd.json`

**Do NOT run Ralph until all manual setup is complete.**

---

# PART 1: MANUAL SETUP CHECKLIST

**STATUS: COMPLETED** (2026-01-22)

## Pre-Flight Verification
All items completed:
- [x] New project folder exists at `/Users/victoracquah/Desktop/Projects/heatmap-pocketbase`
- [x] PocketBase binary v0.36.1 is at `./pocketbase/pocketbase`
- [x] PocketBase server running at http://127.0.0.1:8090
- [x] Superuser account created (admin@example.com / AdminPassword123)
- [x] Test user created (test@example.com / Password123) - User ID: `1o34galakr73068`
- [x] All 3 collections created with correct schema (imports, properties, outcode_stats)
- [x] API rules set on all collections (`@request.auth.id != ''`)
- [x] Batch API enabled in Settings (maxRequests: 500, timeout: 10s)
- [x] Performance indexes added (is_current, visit_count, total_visits)
- [x] Fresh git repo initialized
- [x] `.env` file updated with `VITE_POCKETBASE_URL=http://127.0.0.1:8090`

**All manual setup complete. Ready to run Ralph with the PRD.**

---

## Phase 1: Project Setup (MANUAL)

### 1.1 Create New Project Folder
```bash
cp -r "heatmap starter 1" "heatmap-pocketbase"
cd heatmap-pocketbase
rm -rf .git
git init
```

### 1.2 Install PocketBase Binary
- Download **PocketBase v0.35.0 or later** (v0.23+ minimum for batch API, v0.35+ recommended)
- Download macOS ARM64 binary from https://pocketbase.io/docs/
- Create folder: `pocketbase/` in project root
- Place binary at: `pocketbase/pocketbase`
- Run: `./pocketbase/pocketbase serve`
- Server starts at: http://127.0.0.1:8090
- Admin UI at: http://127.0.0.1:8090/_/
- **Enable batch API:** Dashboard > Settings > Application

### 1.3 Create PocketBase Superuser
On first run, visit http://127.0.0.1:8090/_/ and create admin account.

**Superuser Account (Admin UI Login):**
| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `AdminPassword123` |

**Note:** PocketBase is fully self-hosted. No real email required - this is just a local identifier stored in SQLite (`pb_data/data.db`). No confirmation emails are sent unless SMTP is configured. To reset password, use CLI: `./pocketbase superuser update admin@example.com newpassword`

### 1.4 Update Dependencies
```bash
npm uninstall @supabase/supabase-js
npm install pocketbase
```

### 1.5 Environment Variables
Replace `.env` contents:
```
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### 1.6 Update .gitignore
Add:
```
# PocketBase
pocketbase/pb_data/
pocketbase/pb_migrations/
```
Remove:
```
# Local Supabase
.supabase/
```

### 1.7 Remove Supabase Folder
Either delete or archive:
```bash
rm -rf supabase/
# OR
mv supabase/ _archive_supabase/
```

---

## Phase 2: PocketBase Collections (MANUAL - via Admin UI)

### 2.1 Create Test User
In Users collection (built-in):
- Email: test@example.com
- Password: Password123
- Name: Dustin Dampwell
- **Note the user ID** (15-char string like "abc123def456ghi")

### 2.2 `imports` Collection
| Field | Type | Config |
|-------|------|--------|
| uploaded_by | Relation | → users, single, required |
| uploaded_at | Date | required |
| filename | Text | required, max 500 |
| record_count | Number | min 0, default 0 |
| is_current | Bool | default false |
| status | Select | pending/processing/completed/failed, default: pending |

**Indexes:**
- `is_current` (for current import lookup)

### 2.3 `properties` Collection
| Field | Type | Config |
|-------|------|--------|
| import_id | Relation | → imports, single, required, cascade delete |
| address | Text | required |
| postcode | Text | required |
| outcode | Text | required |
| lat | Number | required |
| lon | Number | required |
| visit_count | Number | min 1, default 1 |

**Indexes** (Settings → Indexes):
- `import_id`
- `outcode`
- `visit_count` (for severity filtering)

### 2.4 `outcode_stats` Collection
| Field | Type | Config |
|-------|------|--------|
| import_id | Relation | → imports, single, required, cascade delete |
| outcode | Text | required |
| area_name | Text | required |
| total_visits | Number | min 0 |
| property_count | Number | min 0 |
| multi_visit_count | Number | min 0 |
| lat | Number | required |
| lon | Number | required |

**Indexes:**
- `import_id` (for filtering)
- `(import_id, outcode)` UNIQUE (for upserts)
- `total_visits` (for top areas sorting)

### 2.5 API Rules (all 3 collections)
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

---

# PART 2: AUTOMATED CODING (Ralph PRD)

**From this point forward, all work is handled by Ralph using `prd.json`.**

Run Ralph in the new project folder:
```bash
cd /path/to/heatmap-pocketbase
# Start Ralph with the PRD
```

---

## Phase 3: Data Migration from Supabase (PRD: US-020)

### 3.1 Export Data from Supabase
Run these queries in Supabase SQL Editor or use the dashboard export:

**Export imports:**
```sql
SELECT * FROM imports ORDER BY uploaded_at;
```

**Export properties:**
```sql
SELECT * FROM properties;
```

**Export outcode_stats:**
```sql
SELECT * FROM outcode_stats;
```

Save as JSON or CSV files.

### 3.2 Import to PocketBase
Since user IDs change (UUID → 15-char string), we need to:
1. Map old `uploaded_by` UUID to new test user ID
2. Map old `import_id` UUIDs to new PocketBase IDs

**Approach:** Create a migration script `scripts/migrate-to-pocketbase.cjs` that:
1. Reads exported Supabase data
2. Creates imports (mapping uploaded_by to new user ID)
3. Creates properties (mapping import_id to new import IDs)
4. Creates outcode_stats (mapping import_id to new import IDs)

### 3.3 Alternative: Re-upload Excel
If data migration is too complex, simply:
1. Set up collections
2. Create test user
3. Re-upload the original Excel file through the app

**Recommendation:** Include migration script in plan. It's reusable and ensures data integrity.

---

## Phase 4: File Changes - Complete List (PRD: US-001 through US-019)

### Delete These Files
| File | Reason |
|------|--------|
| `src/lib/supabase.ts` | Replaced by pocketbase.ts |
| `supabase/` folder | No longer needed |

### Create These Files
| File | Purpose |
|------|---------|
| `src/lib/pocketbase.ts` | PocketBase client singleton |
| `scripts/migrate-to-pocketbase.cjs` | Data migration script |

### Modify - Core Infrastructure
| File | Changes |
|------|---------|
| `src/types/database.types.ts` | Manual types for PocketBase RecordModel + User type |
| `src/vite-env.d.ts` | Add VITE_POCKETBASE_URL type declaration |
| `package.json` | Remove Supabase dep, add PocketBase, update name/description/scripts |
| `.gitignore` | Add pb_data/, remove .supabase/ |
| `.env` | New PocketBase URL variable |

### Modify - Authentication (4 files)
| File | Changes |
|------|---------|
| `src/context/AuthContext.tsx` | Rewrite for pb.authStore |
| `src/hooks/useAuth.tsx` | Update User type import |
| `src/hooks/useSignOut.tsx` | Use pb.authStore.clear() |
| `src/pages/LoginPage.tsx` | Use authWithPassword() |

### Modify - Data Hooks (8 files)
| File | Changes |
|------|---------|
| `src/hooks/useImports.ts` | PocketBase getFullList |
| `src/hooks/useProperties.ts` | PocketBase filters |
| `src/hooks/useOutcodeStats.ts` | PocketBase queries |
| `src/hooks/useDashboardStats.ts` | PocketBase aggregation |
| `src/hooks/useTopAreas.ts` | PocketBase getList with limit |
| `src/hooks/useMultiVisitHotspot.ts` | PocketBase queries |
| `src/hooks/useBiggestIncrease.ts` | PocketBase queries |
| `src/hooks/useExportData.ts` | PocketBase getFullList |

### Modify - Services & Utilities (3 files)
| File | Changes |
|------|---------|
| `src/lib/importService.ts` | Major rewrite - batch inserts, error handling |
| `src/lib/errorUtils.ts` | Remove "pgrst"/"rls" patterns, add PocketBase errors |
| `scripts/seed-initial-data.cjs` | Update for PocketBase - change Supabase client to PocketBase SDK |

### Update - Documentation (2 files)
| File | Changes |
|------|---------|
| `CLAUDE.md` | Replace Supabase commands/references with PocketBase equivalents. Keep all agnostic content (frontend, paths, credentials, map config, UI rules, etc.) |
| `AGENTS.md` | Keep identical to CLAUDE.md |

### Delete - Documentation (1 file)
| File | Reason |
|------|--------|
| `TEMPLATE_SETUP.md` | Not needed |

---

## Phase 5: Key Code Patterns (Reference for Ralph)

### PocketBase Client (`src/lib/pocketbase.ts`)
```typescript
import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pbUrl) {
  throw new Error('Missing VITE_POCKETBASE_URL environment variable');
}

export const pb = new PocketBase(pbUrl);
```

### Auth Patterns
```typescript
// Check if logged in
pb.authStore.isValid

// Get current user (NOTE: .model is deprecated, use .record)
pb.authStore.record

// Listen for auth changes (returns unsubscribe function)
const unsubscribe = pb.authStore.onChange((token, record) => { ... })

// Login
await pb.collection('users').authWithPassword(email, password)

// Logout
pb.authStore.clear()

// Validate/refresh token on app load
await pb.collection('users').authRefresh()
```

**Important:** Wrong credentials return status **401** (Unauthorized), not 400.

### Query Pattern Conversions
| Supabase | PocketBase |
|----------|------------|
| `.from('table').select()` | `pb.collection('table').getFullList()` |
| `.eq('field', val)` | `filter: "field = 'val'"` |
| `.gt('field', val)` | `filter: "field > val"` |
| `.gte('field', val)` | `filter: "field >= val"` |
| `.ilike('field', '%x%')` | `filter: "field ~ 'x'"` |
| `.or('a.eq.1,b.eq.2')` | `filter: "a = 1 \|\| b = 2"` |
| `.order('x', {ascending: false})` | `sort: '-x'` |
| `.limit(5)` | `pb.collection().getList(1, 5, {...})` |
| `.single()` | `pb.collection().getFirstListItem(filter)` |
| `{ data, error }` pattern | `try/catch` (PocketBase throws) |

**Important:** `getFirstListItem()` throws a **404 error** when no record matches. Always wrap in try/catch:
```typescript
let current = null;
try {
  current = await pb.collection('imports').getFirstListItem('is_current = true');
} catch (e) {
  if (e.status === 404) {
    return []; // Handle no results
  }
  throw e; // Re-throw other errors
}
```

### Error Handling Updates (`errorUtils.ts`)
Remove:
- `pgrst` checks (PostgreSQL REST)
- `rls` checks (Row Level Security)

Add:
```typescript
import { ClientResponseError } from 'pocketbase';

// In formatErrorMessage():
if (error instanceof ClientResponseError) {
  if (error.status === 401) return "Your session has expired. Please sign in again.";
  if (error.status === 403) return "You do not have permission to perform this action.";
  if (error.status === 404) return "The requested resource was not found.";
  if (error.status === 400) return "Invalid request. Please check your input.";
  if (error.status >= 500) return "Server error. Please try again later.";
}
```

### Type Definitions (`database.types.ts`)
Manual types matching PocketBase's RecordModel:
```typescript
import { RecordModel } from 'pocketbase';

export interface ImportRecord extends RecordModel {
  uploaded_by: string;
  uploaded_at: string;
  filename: string;
  record_count: number;
  is_current: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface PropertyRecord extends RecordModel {
  import_id: string;
  address: string;
  postcode: string;
  outcode: string;
  lat: number;
  lon: number;
  visit_count: number;
}

export interface OutcodeStatRecord extends RecordModel {
  import_id: string;
  outcode: string;
  area_name: string;
  total_visits: number;
  property_count: number;
  multi_visit_count: number;
  lat: number;
  lon: number;
}

// User type for auth
export interface User {
  id: string;
  email: string;
  name?: string;
  verified: boolean;
  created: string;
  updated: string;
}

// Convenience aliases
export type Import = ImportRecord;
export type Property = PropertyRecord;
export type OutcodeStat = OutcodeStatRecord;
```

### vite-env.d.ts Update
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POCKETBASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### AuthContext Token Refresh Pattern
```typescript
useEffect(() => {
  const checkAuth = async () => {
    if (pb.authStore.isValid) {
      try {
        await pb.collection('users').authRefresh();
        setUser(pb.authStore.record as User);  // Use .record, not .model (deprecated)
      } catch {
        pb.authStore.clear();
        setUser(null);
      }
    }
    setIsLoading(false);
  };

  checkAuth();

  const unsubscribe = pb.authStore.onChange((token, record) => {
    setUser(record as User | null);  // Parameter is 'record', not 'model'
  });

  return unsubscribe;  // Return directly, not wrapped in arrow function
}, []);
```

### Batch Insert Strategy (importService.ts)
PocketBase supports batch operations via `pb.createBatch()`. This must be enabled in **Dashboard > Settings > Application** before use.

```typescript
const BATCH_SIZE = 500;

for (let i = 0; i < properties.length; i += BATCH_SIZE) {
  const chunk = properties.slice(i, i + BATCH_SIZE);
  const batch = pb.createBatch();

  for (const prop of chunk) {
    batch.collection('properties').create({
      import_id: importId,
      address: prop.address,
      postcode: prop.postcode,
      outcode: prop.outcode,
      lat: prop.lat,
      lon: prop.lon,
      visit_count: prop.visitCount,
    });
  }

  await batch.send();

  // Progress callback
  onProgress?.(Math.floor((i / properties.length) * 100));
}
```

**Prerequisites:** Enable batch API in PocketBase Admin Dashboard > Settings > Application before running imports.

**Performance:** Similar to Supabase batch insert - sends multiple records in a single HTTP request per batch.

### Count Queries (useDashboardStats.ts)
PocketBase doesn't have count-only queries. Use getList with totalItems:
```typescript
const result = await pb.collection('properties').getList(1, 1, {
  filter: `import_id = "${importId}" && visit_count >= 5`,
  fields: 'id',
});
const severeCount = result.totalItems;
```

---

## Phase 5.5: SQLite Performance & Indexes

### Indexes (ALREADY CONFIGURED during manual setup)

**imports collection:**
- [x] `is_current` (frequent lookup for current import)

**properties collection:**
- [x] `import_id` (filter by import)
- [x] `outcode` (filter by area)
- [x] `visit_count` (severity range queries)

**outcode_stats collection:**
- [x] `import_id` (filtering)
- [x] `(import_id, outcode)` UNIQUE (prevents duplicates)
- [x] `total_visits` (ordering for top areas)

### SQLite Write Locking Note
SQLite uses database-level locking during writes. Heavy imports will briefly block reads. Show "Import in progress" indicator to users.

---

## Phase 6: package.json Updates (PRD: US-001)

### Changes Required
```json
{
  "name": "qnta-heatmap",
  "description": "Property visit heatmap for Southwark Council",
  "scripts": {
    // Remove these:
    "gen:types": "...",
    "gen:types:remote": "...",

    // Add these:
    "pb:serve": "./pocketbase/pocketbase serve",
    "pb:types": "npx pocketbase-typegen --db ./pocketbase/pb_data/data.db --out ./src/types/pocketbase-types.ts"
  },
  "dependencies": {
    // Remove:
    "@supabase/supabase-js": "...",

    // Add:
    "pocketbase": "^0.26.0"  // v0.22+ required for batch API
  },
  "devDependencies": {
    // Optional - for type generation:
    "pocketbase-typegen": "^1.2.x"
  }
}
```

---

## Phase 7: Execution Order (PRD Story Sequence)

### Step 1: Project Setup (MANUAL - see Part 1)
**Already completed before running Ralph.**

### Step 2: PocketBase Setup (MANUAL - see Part 1)
**Already completed before running Ralph.**

### Step 3: Core Code Changes (PRD: US-001 to US-004)
1. Create `src/lib/pocketbase.ts`
2. Update `src/types/database.types.ts` (manual types + User type)
3. Update `src/vite-env.d.ts` (env type declarations)
4. Update `src/lib/errorUtils.ts` (ClientResponseError handling)
5. Update `package.json`
6. Create `.env.example`

### Step 4: Authentication (PRD: US-005 to US-007)
1. Rewrite `src/context/AuthContext.tsx`
2. Update `src/hooks/useAuth.tsx`
3. Rewrite `src/hooks/useSignOut.tsx`
4. Update `src/pages/LoginPage.tsx`
5. **Test:** Login/logout works

### Step 5: Data Hooks (PRD: US-008 to US-015)
1. Update all 8 hooks one by one
2. **Test each one** as you go

### Step 6: Import Service (PRD: US-016)
1. Rewrite `src/lib/importService.ts`
2. **Test:** Upload Excel file works

### Step 7: Seed Script (PRD: US-017)
1. Update `scripts/seed-initial-data.cjs` for PocketBase SDK

### Step 8: Cleanup & Documentation (PRD: US-018, US-019)
1. Remove `supabase/` folder
2. Delete `TEMPLATE_SETUP.md`
3. Remove Supabase package from dependencies
4. Update `CLAUDE.md` - swap Supabase references for PocketBase
5. Update `AGENTS.md` - keep identical to CLAUDE.md

### Step 9: Data Migration (PRD: US-020)
1. Create migration script
2. Run migration from Supabase export
3. Verify data integrity

### Step 10: Final Testing (PRD: US-021)
1. Full app verification
2. Build check: `npm run build`
3. All acceptance criteria verified

---

## Phase 8: Verification Checklist (PRD: US-021)

### Authentication
- [ ] Login with test@example.com / Password123
- [ ] Session persists on page refresh
- [ ] Logout clears session
- [ ] Protected routes redirect when logged out

### Dashboard
- [ ] Dashboard loads (empty state if no data)
- [ ] Stats display correctly after data import

### Data Import
- [ ] Excel file upload works
- [ ] Progress indicators work
- [ ] Import appears in history
- [ ] Properties created correctly

### Heatmap
- [ ] Map renders with properties
- [ ] Heatmap view works
- [ ] Marker view works
- [ ] Cluster view works
- [ ] All filters work (outcode, visit type, search)

### Export
- [ ] CSV export works

### Build
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

### Edge Cases (from architect review)
- [ ] Token expiry - leave app idle, verify auto-refresh works
- [ ] Corrupted token - manually corrupt localStorage, verify graceful recovery
- [ ] Concurrent import - start import, attempt second, verify handling
- [ ] Import failure - test at each stage, verify cleanup (status = failed)
- [ ] Offline handling - disconnect during import, verify clear error message
- [ ] Large dataset - test with 5000+ properties, verify map performance

---

## Phase 9: Deployment Notes (for later)

### Local → Production Transfer
1. Copy `pocketbase` binary to server
2. Copy `pocketbase/pb_data/` folder (contains SQLite + files)
3. On server: `./pocketbase serve --http=0.0.0.0:8090`
4. Set up reverse proxy (nginx/caddy) for HTTPS
5. Update `VITE_POCKETBASE_URL` to production URL
6. Rebuild React app with production env

### Backup Strategy
- `pb_data/data.db` = entire database
- `pb_data/storage/` = uploaded files
- Simple cron job to copy these files

### No Docker Required
PocketBase is a single binary. Docker is optional if you prefer containerization.

---

## Files Summary (22 total)

**Delete (2):**
- `src/lib/supabase.ts`
- `supabase/` folder

**Create (3):**
- `src/lib/pocketbase.ts`
- `scripts/migrate-to-pocketbase.cjs`
- `.env.example` (document required env vars)

**Modify (20):**
- `src/types/database.types.ts`
- `src/vite-env.d.ts`
- `src/context/AuthContext.tsx`
- `src/hooks/useAuth.tsx`
- `src/hooks/useSignOut.tsx`
- `src/hooks/useImports.ts`
- `src/hooks/useProperties.ts`
- `src/hooks/useOutcodeStats.ts`
- `src/hooks/useDashboardStats.ts`
- `src/hooks/useTopAreas.ts`
- `src/hooks/useMultiVisitHotspot.ts`
- `src/hooks/useBiggestIncrease.ts`
- `src/hooks/useExportData.ts`
- `src/lib/importService.ts`
- `src/lib/errorUtils.ts`
- `src/pages/LoginPage.tsx`
- `scripts/seed-initial-data.cjs`
- `package.json`
- `.gitignore`
- `.env`

**Update Documentation (2):**
- `CLAUDE.md` - Swap Supabase references for PocketBase, keep agnostic content
- `AGENTS.md` - Keep identical to CLAUDE.md

**Delete (additional):**
- `TEMPLATE_SETUP.md`
- `progress.txt` (has Supabase references)

---

## Future Enhancements

### Multi-Visit Tracking for "Biggest Increase" Feature

**Current Implementation:** The "biggest increase" feature compares total visits between uploads to identify which area has seen the largest percentage increase.

**Limitation Identified:** Total visits may not accurately reflect problem severity. For example:
- 30 new visits in an area could simply mean operatives started scheduled work there (planned maintenance)
- However, 30 multi-visits (return visits to the same properties) would indicate ongoing issues that weren't resolved on the first visit

**Recommended Enhancement:** Update the "biggest increase" feature to compare multi-visit counts instead of total visits. This would provide a more meaningful metric, as multi-visits specifically indicate:
- Properties with unresolved issues
- Areas where initial fixes were unsuccessful
- Genuine problem hotspots requiring attention

**Implementation Notes:**
- The `outcode_stats` collection already tracks `multi_visit_count`
- Change would only affect `useBiggestIncrease.ts` hook
- Compare `multi_visit_count` instead of `total_visits` between imports
