-- Migration: Add DELETE policies and import status tracking
-- This migration adds:
-- 1. DELETE policies for authenticated users (needed for rollback on failed imports)
-- 2. Status field on imports table for better transaction tracking
-- 3. Partial unique index to prevent race conditions on is_current flag

-- ============================================================================
-- ADD STATUS FIELD TO IMPORTS TABLE
-- ============================================================================

-- Add status field to track import state
-- Values: 'pending', 'processing', 'completed', 'failed'
ALTER TABLE imports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

-- Add check constraint for valid status values
ALTER TABLE imports ADD CONSTRAINT imports_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Allow authenticated users to delete imports they own (for rollback on failure)
CREATE POLICY "imports_delete_policy" ON imports
    FOR DELETE
    TO authenticated
    USING (uploaded_by = auth.uid());

-- Allow authenticated users to delete properties for imports they own
-- This cascades automatically via ON DELETE CASCADE, but explicit policy needed for direct deletes
CREATE POLICY "properties_delete_policy" ON properties
    FOR DELETE
    TO authenticated
    USING (
        import_id IN (
            SELECT id FROM imports WHERE uploaded_by = auth.uid()
        )
    );

-- Allow authenticated users to delete outcode_stats for imports they own
CREATE POLICY "outcode_stats_delete_policy" ON outcode_stats
    FOR DELETE
    TO authenticated
    USING (
        import_id IN (
            SELECT id FROM imports WHERE uploaded_by = auth.uid()
        )
    );

-- ============================================================================
-- RACE CONDITION PREVENTION
-- ============================================================================

-- Create a partial unique index to ensure only one import can be current at a time
-- This prevents race conditions when multiple imports run concurrently
CREATE UNIQUE INDEX IF NOT EXISTS idx_imports_single_current
    ON imports (is_current)
    WHERE is_current = true AND status = 'completed';

-- ============================================================================
-- INDEX FOR STATUS QUERIES
-- ============================================================================

-- Add index for efficient status-based queries
CREATE INDEX IF NOT EXISTS idx_imports_status ON imports(status);
