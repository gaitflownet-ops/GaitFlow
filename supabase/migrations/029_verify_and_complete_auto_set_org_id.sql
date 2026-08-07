-- ============================================================
-- Migration: 029_verify_and_complete_auto_set_org_id.sql
-- Purpose: Ensure 100% dynamic coverage of BEFORE INSERT triggers for 
--          automatic organization_id assignment on ALL public tables.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Dynamically attach set_org_id_trigger to every table in public schema 
  -- that has an organization_id column (excluding the central organizations table).
  FOR r IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name = 'organization_id'
      AND table_name NOT IN ('organizations')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id_trigger ON public.%I', r.table_name);
    EXECUTE format('CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_organization_id()', r.table_name);
  END LOOP;
END $$;
