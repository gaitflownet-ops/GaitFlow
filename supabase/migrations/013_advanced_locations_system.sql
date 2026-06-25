-- Migration: 013_advanced_locations_system.sql
-- Purpose: Extend Locations module for advanced physical space operations (Paddocks, quarantine, transports, CCC competitions)

-- 1. Extend locations table with paddock and boarding costs fields
ALTER TABLE locations ADD COLUMN IF NOT EXISTS daily_boarding_cost NUMERIC DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS area_hectares NUMERIC;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS grass_type TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS rotation_status TEXT DEFAULT 'Resting'; -- 'Grazing' | 'Resting' | 'Maintenance'

-- 2. Create ccc_location_movements table for tracking location history
CREATE TABLE IF NOT EXISTS ccc_location_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  previous_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  new_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  stall_unit_id UUID REFERENCES stall_units(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_date TIMESTAMPTZ,
  responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create ccc_quarantine_records table for quarantine workflows
CREATE TABLE IF NOT EXISTS ccc_quarantine_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_date TIMESTAMPTZ,
  reason TEXT NOT NULL, -- 'New Intake' | 'Sickness' | 'Preventive'
  responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT DEFAULT 'Active' NOT NULL, -- 'Active' | 'Released'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create ccc_transports table for transportation tracking
CREATE TABLE IF NOT EXISTS ccc_transports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reason TEXT,
  carrier_name TEXT,
  cost NUMERIC DEFAULT 0 NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  notes TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create ccc_competition_locations table for fairs & shows tracking
CREATE TABLE IF NOT EXISTS ccc_competition_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'Registered' NOT NULL, -- 'Registered' | 'Competing' | 'Completed'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS) on all new tables
ALTER TABLE ccc_location_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccc_quarantine_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccc_transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccc_competition_locations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies using get_user_orgs()
DROP POLICY IF EXISTS "Movements select policy" ON ccc_location_movements;
DROP POLICY IF EXISTS "Movements all policy" ON ccc_location_movements;
CREATE POLICY "Movements select policy" ON ccc_location_movements FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Movements all policy" ON ccc_location_movements FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

DROP POLICY IF EXISTS "Quarantine select policy" ON ccc_quarantine_records;
DROP POLICY IF EXISTS "Quarantine all policy" ON ccc_quarantine_records;
CREATE POLICY "Quarantine select policy" ON ccc_quarantine_records FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Quarantine all policy" ON ccc_quarantine_records FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

DROP POLICY IF EXISTS "Transports select policy" ON ccc_transports;
DROP POLICY IF EXISTS "Transports all policy" ON ccc_transports;
CREATE POLICY "Transports select policy" ON ccc_transports FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Transports all policy" ON ccc_transports FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

DROP POLICY IF EXISTS "Competition locations select policy" ON ccc_competition_locations;
DROP POLICY IF EXISTS "Competition locations all policy" ON ccc_competition_locations;
CREATE POLICY "Competition locations select policy" ON ccc_competition_locations FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Competition locations all policy" ON ccc_competition_locations FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

-- 8. Enable Organization ID Triggers
DROP TRIGGER IF EXISTS set_org_id_trigger ON ccc_location_movements;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON ccc_location_movements FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_org_id_trigger ON ccc_quarantine_records;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON ccc_quarantine_records FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_org_id_trigger ON ccc_transports;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON ccc_transports FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_org_id_trigger ON ccc_competition_locations;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON ccc_competition_locations FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 9. Enable Audit Triggers
DROP TRIGGER IF EXISTS audit_trigger ON ccc_location_movements;
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON ccc_location_movements FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_trigger ON ccc_quarantine_records;
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON ccc_quarantine_records FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_trigger ON ccc_transports;
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON ccc_transports FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_trigger ON ccc_competition_locations;
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON ccc_competition_locations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
