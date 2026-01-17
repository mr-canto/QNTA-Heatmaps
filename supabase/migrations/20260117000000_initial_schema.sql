-- Initial schema for QNTA Heatmap application
-- Creates tables for tracking damp and mould property visits

-- ============================================================================
-- TABLES
-- ============================================================================

-- imports: Stores metadata about each data import snapshot
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    filename TEXT NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    is_current BOOLEAN NOT NULL DEFAULT true
);

-- properties: Individual property records linked to imports
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    postcode TEXT NOT NULL,
    outcode TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    visit_count INTEGER NOT NULL DEFAULT 1
);

-- outcode_stats: Aggregated statistics per outcode per import
CREATE TABLE IF NOT EXISTS outcode_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
    outcode TEXT NOT NULL,
    area_name TEXT NOT NULL,
    total_visits INTEGER NOT NULL DEFAULT 0,
    property_count INTEGER NOT NULL DEFAULT 0,
    multi_visit_count INTEGER NOT NULL DEFAULT 0,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Indexes on import_id for efficient joins and filtering by snapshot
CREATE INDEX IF NOT EXISTS idx_properties_import_id ON properties(import_id);
CREATE INDEX IF NOT EXISTS idx_outcode_stats_import_id ON outcode_stats(import_id);

-- Indexes on outcode for efficient area filtering
CREATE INDEX IF NOT EXISTS idx_properties_outcode ON properties(outcode);
CREATE INDEX IF NOT EXISTS idx_outcode_stats_outcode ON outcode_stats(outcode);

-- Index for finding current import quickly
CREATE INDEX IF NOT EXISTS idx_imports_is_current ON imports(is_current) WHERE is_current = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcode_stats ENABLE ROW LEVEL SECURITY;

-- IMPORTS TABLE POLICIES
-- Authenticated users can SELECT all imports
CREATE POLICY "imports_select_policy" ON imports
    FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can INSERT new imports
CREATE POLICY "imports_insert_policy" ON imports
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can only UPDATE is_current field
-- This is enforced at the application level since Postgres RLS cannot restrict specific columns
CREATE POLICY "imports_update_policy" ON imports
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- No DELETE policy for imports (authenticated users cannot delete)

-- PROPERTIES TABLE POLICIES
-- Authenticated users can SELECT all properties
CREATE POLICY "properties_select_policy" ON properties
    FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can INSERT new properties
CREATE POLICY "properties_insert_policy" ON properties
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- No UPDATE policy for properties (authenticated users cannot update)
-- No DELETE policy for properties (authenticated users cannot delete)

-- OUTCODE_STATS TABLE POLICIES
-- Authenticated users can SELECT all outcode_stats
CREATE POLICY "outcode_stats_select_policy" ON outcode_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can INSERT new outcode_stats
CREATE POLICY "outcode_stats_insert_policy" ON outcode_stats
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- No UPDATE policy for outcode_stats (authenticated users cannot update)
-- No DELETE policy for outcode_stats (authenticated users cannot delete)
