-- Tighten insert permissions so authenticated users can only create imports for
-- themselves and only attach child records to imports they own.

-- ============================================================================
-- IMPORTS INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "imports_insert_policy" ON imports;

CREATE POLICY "imports_insert_policy" ON imports
    FOR INSERT
    TO authenticated
    WITH CHECK (uploaded_by = auth.uid());

-- ============================================================================
-- PROPERTIES INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "properties_insert_policy" ON properties;

CREATE POLICY "properties_insert_policy" ON properties
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM imports
            WHERE imports.id = properties.import_id
              AND imports.uploaded_by = auth.uid()
        )
    );

-- ============================================================================
-- OUTCODE_STATS INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "outcode_stats_insert_policy" ON outcode_stats;

CREATE POLICY "outcode_stats_insert_policy" ON outcode_stats
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM imports
            WHERE imports.id = outcode_stats.import_id
              AND imports.uploaded_by = auth.uid()
        )
    );

-- ============================================================================
-- IMPORTS UPDATE GUARDRAILS
-- ============================================================================

-- The app needs authenticated users to flip the shared `is_current` flag during
-- import swaps, including for rows they do not own. Guard the broader update
-- policy by preventing non-owners from changing import metadata or status.
-- Compare the whole row rather than naming columns so this stays safe even if
-- local databases are missing newer columns like `status`.

CREATE OR REPLACE FUNCTION public.enforce_import_update_guardrails()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by THEN
        RAISE EXCEPTION 'uploaded_by cannot be changed';
    END IF;

    IF OLD.uploaded_by IS DISTINCT FROM auth.uid() THEN
        IF (to_jsonb(NEW) - 'is_current') IS DISTINCT FROM (to_jsonb(OLD) - 'is_current') THEN
            RAISE EXCEPTION 'You can only change is_current on imports you do not own';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_import_update_guardrails ON imports;

CREATE TRIGGER trg_enforce_import_update_guardrails
    BEFORE UPDATE ON imports
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_import_update_guardrails();
