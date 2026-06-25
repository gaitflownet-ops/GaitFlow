-- Migration: 009_create_organization_members_and_permissions.sql
-- Purpose: Add multi-tenant SaaS organization membership, role permissions, contact interactions, and breeding mares

-- 1. Alter organizations table to ensure all requested fields exist
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Starter';

-- Copy values from subscription_plan to plan if needed
UPDATE public.organizations SET plan = COALESCE(subscription_plan, 'Starter') WHERE plan IS NULL;

-- 2. Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Viewer', -- 'Owner' | 'Stable Manager' | 'Veterinarian' | 'Trainer' | 'Rider' | 'Caretaker' | 'Accountant' | 'Viewer'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Copy existing user roles into organization_members
INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
SELECT organization_id, user_id, role, created_at
FROM public.user_roles
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 3. Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  module TEXT NOT NULL, -- 'horses', 'breeding', 'crm', 'financials', 'locations', 'tasks', 'health', 'marketplace'
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, module, organization_id)
);

-- 4. Create contact_interactions table for CRM history
CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'Call' | 'Email' | 'Meeting' | 'Note'
  summary TEXT NOT NULL,
  details TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Alter listings table to add title
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS title TEXT;

-- 6. Create mares table for Breeding module
CREATE TABLE IF NOT EXISTS public.mares (
  horse_id UUID PRIMARY KEY REFERENCES public.horses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Sport Mare', -- 'Donor Mare' | 'Recipient Mare' | 'Sport Mare'
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS and apply tenant policies to new tables
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mares ENABLE ROW LEVEL SECURITY;

-- Dynamic functions check to ensure get_user_orgs works on both user_roles and organization_members
CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop policies to recreate
DROP POLICY IF EXISTS "Tenant select policy" ON public.organization_members;
DROP POLICY IF EXISTS "Tenant all policy" ON public.organization_members;
CREATE POLICY "Tenant select policy" ON public.organization_members FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Tenant all policy" ON public.organization_members FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

DROP POLICY IF EXISTS "Tenant select policy" ON public.permissions;
DROP POLICY IF EXISTS "Tenant all policy" ON public.permissions;
CREATE POLICY "Tenant select policy" ON public.permissions FOR SELECT USING (organization_id = ANY(public.get_user_orgs()) OR organization_id IS NULL);
CREATE POLICY "Tenant all policy" ON public.permissions FOR ALL USING (organization_id = ANY(public.get_user_orgs()) OR organization_id IS NULL);

DROP POLICY IF EXISTS "Tenant select policy" ON public.contact_interactions;
DROP POLICY IF EXISTS "Tenant all policy" ON public.contact_interactions;
CREATE POLICY "Tenant select policy" ON public.contact_interactions FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Tenant all policy" ON public.contact_interactions FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

DROP POLICY IF EXISTS "Tenant select policy" ON public.mares;
DROP POLICY IF EXISTS "Tenant all policy" ON public.mares;
CREATE POLICY "Tenant select policy" ON public.mares FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Tenant all policy" ON public.mares FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

-- 8. Add triggers to automatically populate organization_id
DROP TRIGGER IF EXISTS set_org_id_trigger ON public.organization_members;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_org_id_trigger ON public.permissions;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_org_id_trigger ON public.contact_interactions;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.contact_interactions FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_org_id_trigger ON public.mares;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.mares FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 9. Seed default permissions for global roles (organization_id = NULL indicates global defaults)
INSERT INTO public.permissions (role, module, can_view, can_create, can_edit, can_delete, organization_id) VALUES
-- Owner: Everything
('Owner', 'horses', true, true, true, true, NULL),
('Owner', 'breeding', true, true, true, true, NULL),
('Owner', 'crm', true, true, true, true, NULL),
('Owner', 'financials', true, true, true, true, NULL),
('Owner', 'locations', true, true, true, true, NULL),
('Owner', 'tasks', true, true, true, true, NULL),
('Owner', 'health', true, true, true, true, NULL),
('Owner', 'marketplace', true, true, true, true, NULL),

-- Stable Manager: Everything except financials details (view only) and full setting deletes
('Stable Manager', 'horses', true, true, true, true, NULL),
('Stable Manager', 'breeding', true, true, true, true, NULL),
('Stable Manager', 'crm', true, true, true, true, NULL),
('Stable Manager', 'financials', true, false, false, false, NULL),
('Stable Manager', 'locations', true, true, true, true, NULL),
('Stable Manager', 'tasks', true, true, true, true, NULL),
('Stable Manager', 'health', true, true, true, true, NULL),
('Stable Manager', 'marketplace', true, true, true, true, NULL),

-- Veterinarian: Health and Horses, view others
('Veterinarian', 'horses', true, false, true, false, NULL),
('Veterinarian', 'breeding', true, true, true, false, NULL),
('Veterinarian', 'crm', true, false, false, false, NULL),
('Veterinarian', 'financials', false, false, false, false, NULL),
('Veterinarian', 'locations', true, false, false, false, NULL),
('Veterinarian', 'tasks', true, true, true, true, NULL),
('Veterinarian', 'health', true, true, true, true, NULL),
('Veterinarian', 'marketplace', true, false, false, false, NULL),

-- Trainer: Horses, tasks, locations, view breeding
('Trainer', 'horses', true, false, true, false, NULL),
('Trainer', 'breeding', true, false, false, false, NULL),
('Trainer', 'crm', true, false, false, false, NULL),
('Trainer', 'financials', false, false, false, false, NULL),
('Trainer', 'locations', true, true, true, false, NULL),
('Trainer', 'tasks', true, true, true, true, NULL),
('Trainer', 'health', true, false, false, false, NULL),
('Trainer', 'marketplace', true, false, false, false, NULL),

-- Rider: view horses, view tasks, view locations
('Rider', 'horses', true, false, false, false, NULL),
('Rider', 'breeding', false, false, false, false, NULL),
('Rider', 'crm', false, false, false, false, NULL),
('Rider', 'financials', false, false, false, false, NULL),
('Rider', 'locations', true, false, false, false, NULL),
('Rider', 'tasks', true, false, true, false, NULL), -- Can complete tasks
('Rider', 'health', false, false, false, false, NULL),
('Rider', 'marketplace', true, false, false, false, NULL),

-- Caretaker: view horses, complete tasks
('Caretaker', 'horses', true, false, false, false, NULL),
('Caretaker', 'breeding', false, false, false, false, NULL),
('Caretaker', 'crm', false, false, false, false, NULL),
('Caretaker', 'financials', false, false, false, false, NULL),
('Caretaker', 'locations', true, false, false, false, NULL),
('Caretaker', 'tasks', true, false, true, false, NULL), -- Can complete tasks
('Caretaker', 'health', false, false, false, false, NULL),
('Caretaker', 'marketplace', false, false, false, false, NULL),

-- Accountant: Financials and CRM view, view horses
('Accountant', 'horses', true, false, false, false, NULL),
('Accountant', 'breeding', false, false, false, false, NULL),
('Accountant', 'crm', true, true, true, false, NULL),
('Accountant', 'financials', true, true, true, true, NULL),
('Accountant', 'locations', false, false, false, false, NULL),
('Accountant', 'tasks', false, false, false, false, NULL),
('Accountant', 'health', false, false, false, false, NULL),
('Accountant', 'marketplace', true, false, false, false, NULL),

-- Viewer: view horses
('Viewer', 'horses', true, false, false, false, NULL),
('Viewer', 'breeding', false, false, false, false, NULL),
('Viewer', 'crm', false, false, false, false, NULL),
('Viewer', 'financials', false, false, false, false, NULL),
('Viewer', 'locations', false, false, false, false, NULL),
('Viewer', 'tasks', false, false, false, false, NULL),
('Viewer', 'health', false, false, false, false, NULL),
('Viewer', 'marketplace', true, false, false, false, NULL)
ON CONFLICT (role, module, organization_id) DO NOTHING;

-- 10. Update profiles trigger function to also insert into organization_members
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

  -- 3. Grant Owner Role in user_roles
  INSERT INTO public.user_roles (user_id, organization_id, role, permissions)
  VALUES (NEW.id, new_org_id, 'Owner', '["*"]'::jsonb)
  ON CONFLICT (user_id, organization_id) DO NOTHING;

  -- 4. Grant Owner Role in organization_members
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'Owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
