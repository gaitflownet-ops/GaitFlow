-- Migration: 011_section_e_advanced_nutrition.sql
-- Purpose: Create advanced CCC nutrition & wellness engine

-- 1. Feed Suppliers
CREATE TABLE IF NOT EXISTS feed_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  contact_info TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Feed Inventory
CREATE TABLE IF NOT EXISTS feed_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Forage' | 'Concentrate' | 'Supplement' | 'Other'
  current_stock_kg NUMERIC DEFAULT 0,
  cost_per_kg NUMERIC DEFAULT 0,
  reorder_point_kg NUMERIC DEFAULT 0,
  supplier_id UUID REFERENCES feed_suppliers(id) ON DELETE SET NULL,
  last_restock_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Nutrition Plans
CREATE TABLE IF NOT EXISTS ccc_nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'Maintenance' | 'Training' | 'Competition' | 'Breeding' | 'Pregnancy' | 'Growth' | 'Recovery'
  status TEXT DEFAULT 'Draft', -- 'Draft' | 'Pending Approval' | 'Active' | 'Historical'
  start_date DATE,
  end_date DATE,
  general_observations TEXT,
  restrictions TEXT,
  allergies TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Nutrition Items (within a plan)
CREATE TABLE IF NOT EXISTS ccc_nutrition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES ccc_nutrition_plans(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Forage' | 'Concentrate' | 'Supplement'
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- 'kg' | 'g' | 'coco' | 'scoop' | 'bucket' | 'portion'
  conversion_to_kg NUMERIC DEFAULT 1, -- multiplier to get kg
  schedule TEXT NOT NULL, -- 'Morning' | 'Midday' | 'Afternoon' | 'Night' | 'Free Choice'
  inventory_id UUID REFERENCES feed_inventory(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES feed_suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Wellness Records (BCS, Coat, Energy)
CREATE TABLE IF NOT EXISTS ccc_wellness_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  body_condition_score NUMERIC CHECK (body_condition_score >= 1 AND body_condition_score <= 9),
  weight_estimate_kg NUMERIC,
  muscle_condition TEXT,
  coat_quality TEXT,
  energy_level TEXT,
  appetite TEXT,
  general_observations TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Water Management
CREATE TABLE IF NOT EXISTS ccc_water_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_availability TEXT, -- 'Full' | 'Half' | 'Low' | 'Empty'
  cleaning_check BOOLEAN DEFAULT false,
  observations TEXT,
  checked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- Enable Row Level Security and Policies
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'feed_suppliers', 'feed_inventory', 'ccc_nutrition_plans',
    'ccc_wellness_records', 'ccc_water_management'
  ];
BEGIN
  FOR t IN SELECT unnest(tables) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant select policy" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant all policy" ON %I', t);
    EXECUTE format('CREATE POLICY "Tenant select policy" ON %I FOR SELECT USING (organization_id = ANY(public.get_user_orgs()))', t);
    EXECUTE format('CREATE POLICY "Tenant all policy" ON %I FOR ALL USING (organization_id = ANY(public.get_user_orgs()))', t);
  END LOOP;
END $$;

-- Policy for nutrition items (depends on plan's org)
ALTER TABLE ccc_nutrition_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Items tenant select policy" ON ccc_nutrition_items;
DROP POLICY IF EXISTS "Items tenant all policy" ON ccc_nutrition_items;

CREATE POLICY "Items tenant select policy" ON ccc_nutrition_items
  FOR SELECT USING (
    plan_id IN (SELECT id FROM ccc_nutrition_plans WHERE organization_id = ANY(public.get_user_orgs()))
  );

CREATE POLICY "Items tenant all policy" ON ccc_nutrition_items
  FOR ALL USING (
    plan_id IN (SELECT id FROM ccc_nutrition_plans WHERE organization_id = ANY(public.get_user_orgs()))
  );

-- ────────────────────────────────────────────────────────────
-- Audit Triggers
-- ────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_nutrition_plans ON ccc_nutrition_plans;
CREATE TRIGGER audit_nutrition_plans AFTER INSERT OR UPDATE OR DELETE ON ccc_nutrition_plans FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_wellness ON ccc_wellness_records;
CREATE TRIGGER audit_wellness AFTER INSERT OR UPDATE OR DELETE ON ccc_wellness_records FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_inventory ON feed_inventory;
CREATE TRIGGER audit_inventory AFTER INSERT OR UPDATE OR DELETE ON feed_inventory FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
