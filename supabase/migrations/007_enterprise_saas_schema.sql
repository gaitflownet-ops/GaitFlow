-- Migration: 007_enterprise_saas_schema.sql
-- Purpose: Upgrade GaitFlow database to a production-ready enterprise SaaS platform (multi-tenant, security, RLS, audit logs, CRM, finance, breeding)

-- ────────────────────────────────────────────────────────────
-- 1. Organizations
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  contact_information JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  subscription_plan TEXT DEFAULT 'Starter', -- 'Starter' | 'Professional' | 'Elite'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter profiles to support organization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ────────────────────────────────────────────────────────────
-- 2. User Roles & Permissions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Viewer', -- 'Owner' | 'Stable Manager' | 'Veterinarian' | 'Trainer' | 'Rider' | 'Caretaker' | 'Accountant' | 'Viewer'
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ────────────────────────────────────────────────────────────
-- 3. Audit Logs
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. Alter existing tables to add organization_id
-- ────────────────────────────────────────────────────────────
ALTER TABLE farms ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE updates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE genetic_inventory ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE pharmaceutical_inventory ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE horse_groups ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE horse_subgroups ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ────────────────────────────────────────────────────────────
-- 5. Additional SaaS Schema Modules
-- ────────────────────────────────────────────────────────────

-- Ownership History
CREATE TABLE IF NOT EXISTS ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  percentage NUMERIC NOT NULL DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications (supporting Health section)
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  stock_quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'doses',
  min_stock_alert NUMERIC DEFAULT 5,
  cost_per_unit NUMERIC DEFAULT 0,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Events
CREATE TABLE IF NOT EXISTS medical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'vaccination' | 'deworming' | 'dental' | 'hoof_care' | 'vet_visit' | 'follow_up'
  title TEXT NOT NULL,
  notes TEXT,
  professional TEXT,
  date DATE NOT NULL,
  next_due DATE,
  medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  medication_quantity NUMERIC,
  cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Templates
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium',
  recurrence TEXT, -- 'daily' | 'weekly' | 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams & Workloads
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, profile_id)
);

CREATE TABLE IF NOT EXISTS team_horse_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, horse_id)
);

-- Stall Units
CREATE TABLE IF NOT EXISTS stall_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  stall_number TEXT NOT NULL,
  availability BOOLEAN DEFAULT true,
  horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, stall_number)
);

-- Diets (Personalized Diet diets)
CREATE TABLE IF NOT EXISTS diets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  feed_type TEXT NOT NULL,
  quantity TEXT NOT NULL,
  schedule TEXT NOT NULL, -- 'AM' | 'PM' | 'Midday' | 'AM/PM'
  supplements TEXT,
  notes TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Vault
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pedigree' | 'medical' | 'contract' | 'invoice' | 'competition' | 'other'
  file_url TEXT NOT NULL,
  file_size TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition Results (horse_results)
CREATE TABLE IF NOT EXISTS horse_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  position TEXT, -- e.g. '1st', 'Reserve'
  rider TEXT,
  trainer TEXT,
  score TEXT,
  awards TEXT,
  media TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Breeding Cycles & Pregnancies
CREATE TABLE IF NOT EXISTS breeding_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mare_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  stallion_id TEXT NOT NULL,
  method TEXT, -- 'Embryo' | 'Chilled Semen' | 'Fresh Cover'
  date DATE NOT NULL,
  status TEXT DEFAULT 'Pending', -- 'Pending' | 'Pregnant' | 'Open'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pregnancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mare_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  expected_date DATE NOT NULL,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Completed' | 'Lost'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Genetics Inventory
CREATE TABLE IF NOT EXISTS genetics_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type TEXT NOT NULL, -- 'embryos' | 'semen' | 'breeding rights' | 'purchased genetics'
  source TEXT,
  expiration_date DATE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings (Marketplace)
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'horse' | 'embryo' | 'semen' | 'breeding service'
  price NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active', -- 'Active' | 'Paused' | 'Sold'
  horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'New', -- 'New' | 'Responded' | 'Closed'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (CRM)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT NOT NULL, -- 'client' | 'buyer' | 'breeder' | 'vet' | 'supplier'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL, -- 'cash' | 'bank_transfer' | 'card' | 'check'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'Starter', -- 'Starter' | 'Professional' | 'Elite'
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active' | 'Past Due' | 'Canceled'
  renewal_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities Feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Consent Acceptances
CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- 'privacy_policy' | 'terms_of_service' | 'user_consent'
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_type, version)
);

-- ────────────────────────────────────────────────────────────
-- 6. Automated Provisioning Triggers
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- 1. Create organization
  INSERT INTO public.organizations (name, subscription_plan)
  VALUES (COALESCE(NEW.stable_name, NEW.name || ' Stable'), 'Starter')
  RETURNING id INTO new_org_id;

  -- 2. Link profile
  UPDATE public.profiles
  SET organization_id = new_org_id
  WHERE id = NEW.id;

  -- 3. Grant Owner Role
  INSERT INTO public.user_roles (user_id, organization_id, role, permissions)
  VALUES (NEW.id, new_org_id, 'Owner', '["*"]'::jsonb);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

-- Migrate existing profiles to organizations
DO $$
DECLARE
  prof RECORD;
  new_org_id UUID;
BEGIN
  FOR prof IN SELECT * FROM public.profiles WHERE organization_id IS NULL LOOP
    INSERT INTO public.organizations (name, subscription_plan)
    VALUES (COALESCE(prof.stable_name, prof.name || ' Stable'), 'Starter')
    RETURNING id INTO new_org_id;

    UPDATE public.profiles
    SET organization_id = new_org_id
    WHERE id = prof.id;

    INSERT INTO public.user_roles (user_id, organization_id, role, permissions)
    VALUES (prof.id, new_org_id, 'Owner', '["*"]'::jsonb)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 7. Audit System & Triggers
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  old_val JSONB := NULL;
  new_val JSONB := NULL;
  record_id TEXT := NULL;
  org_id UUID := NULL;
  user_id UUID := auth.uid();
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_val := to_jsonb(OLD);
    new_val := to_jsonb(NEW);
    record_id := OLD.id::text;
    BEGIN
      org_id := NEW.organization_id;
    EXCEPTION WHEN OTHERS THEN
      org_id := NULL;
    END;
  ELSIF (TG_OP = 'INSERT') THEN
    new_val := to_jsonb(NEW);
    record_id := NEW.id::text;
    BEGIN
      org_id := NEW.organization_id;
    EXCEPTION WHEN OTHERS THEN
      org_id := NULL;
    END;
  ELSIF (TG_OP = 'DELETE') THEN
    old_val := to_jsonb(OLD);
    record_id := OLD.id::text;
    BEGIN
      org_id := OLD.organization_id;
    EXCEPTION WHEN OTHERS THEN
      org_id := NULL;
    END;
  END IF;

  INSERT INTO public.audit_logs (user_id, organization_id, action, table_name, record_id, previous_value, new_value)
  VALUES (user_id, org_id, TG_OP, TG_TABLE_NAME, record_id, old_val, new_val);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers
DROP TRIGGER IF EXISTS audit_horses ON horses;
CREATE TRIGGER audit_horses AFTER INSERT OR UPDATE OR DELETE ON horses FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_tasks ON tasks;
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_health ON health_records;
CREATE TRIGGER audit_health AFTER INSERT OR UPDATE OR DELETE ON health_records FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ────────────────────────────────────────────────────────────
-- 8. Multi-Tenant Security (Row Level Security Policies)
-- ────────────────────────────────────────────────────────────

-- Organization RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own organization" ON organizations;
CREATE POLICY "Users can read their own organization" ON organizations
  FOR SELECT USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Owners can update their own organization" ON organizations;
CREATE POLICY "Owners can update their own organization" ON organizations
  FOR UPDATE USING (id IN (SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'Owner'));

-- Generic RLS helper
CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS UUID[] AS $$
  SELECT ARRAY(SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- Apply multi-tenant policies to business tables (excluding favorites, audit_logs)
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
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    
    -- Drop existing policies to avoid conflicts
    EXECUTE format('DROP POLICY IF EXISTS "Tenant select policy" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant all policy" ON %I', t);
    
    -- Create select policy
    EXECUTE format('CREATE POLICY "Tenant select policy" ON %I FOR SELECT USING (organization_id = ANY(public.get_user_orgs()))', t);
    
    -- Create write policy
    EXECUTE format('CREATE POLICY "Tenant all policy" ON %I FOR ALL USING (organization_id = ANY(public.get_user_orgs()))', t);
  END LOOP;
END $$;

-- Policies for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Favorites user policy" ON favorites;
CREATE POLICY "Favorites user policy" ON favorites FOR ALL USING (user_id = auth.uid());

-- Policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit logs select policy" ON audit_logs;
CREATE POLICY "Audit logs select policy" ON audit_logs FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));

-- Policies for legal_acceptances
ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Legal acceptances user policy" ON legal_acceptances;
CREATE POLICY "Legal acceptances user policy" ON legal_acceptances FOR ALL USING (user_id = auth.uid());
