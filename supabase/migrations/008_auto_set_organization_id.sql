-- Migration: 008_auto_set_organization_id.sql
-- Purpose: Automatically set organization_id on insert for all business tables based on the authenticated user's profile

CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'farms', 'horses', 'updates', 'competitions', 'health_records', 'locations',
    'tasks', 'nutrition_plans', 'invoices', 'breeding_records', 'genetic_inventory',
    'marketplace_listings', 'pharmaceutical_inventory', 'horse_groups', 'horse_subgroups',
    'ownership_history', 'medications', 'medical_events', 'task_templates', 'teams',
    'team_members', 'team_horse_assignments', 'stall_units', 'diets', 'documents',
    'horse_results', 'breeding_cycles', 'pregnancies', 'genetics_inventory', 'listings',
    'inquiries', 'contacts', 'expenses', 'payments', 'subscriptions', 'activities'
  ];
BEGIN
  FOR t IN SELECT unnest(tables) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id_trigger ON %I', t);
    EXECUTE format('CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION public.set_organization_id()', t);
  END LOOP;
END $$;
