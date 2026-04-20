-- Migration: Add work_orders table for property history enrichment
-- This migration adds:
-- 1. A work_orders table that stores one imported row per work order
-- 2. Date and cost fields for richer property history displays
-- 3. Indexes and RLS policies aligned with the existing import model

-- ============================================================================
-- WORK ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    postcode TEXT NOT NULL,
    outcode TEXT NOT NULL,
    work_order_ref TEXT,
    description TEXT,
    estimated_cost NUMERIC(12, 2),
    raw_date_value TEXT,
    normalized_date DATE,
    import_row_order INTEGER NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_work_orders_import_id ON work_orders(import_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_property_id ON work_orders(property_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_property_date_order
    ON work_orders(property_id, normalized_date DESC, import_row_order DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_orders_select_policy" ON work_orders
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "work_orders_insert_policy" ON work_orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "work_orders_delete_policy" ON work_orders
    FOR DELETE
    TO authenticated
    USING (
        import_id IN (
            SELECT id FROM imports WHERE uploaded_by = auth.uid()
        )
    );
