-- Migration: 014_ccc_work_teams_and_shifts.sql
-- Purpose: Extend Work Teams for CCC Operations, shift tracking, and coverage logs.

-- 1. Alter organization_members to add availability status
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'Available';

-- 2. Extend teams table for CCC temporary events
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS event_notes TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_type TEXT;

-- 3. Create ccc_work_shifts table
CREATE TABLE IF NOT EXISTS public.ccc_work_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'Active',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create ccc_daily_coverage_logs table
CREATE TABLE IF NOT EXISTS public.ccc_daily_coverage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  shift_id UUID REFERENCES public.ccc_work_shifts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities_completed TEXT[],
  horses_checked INTEGER DEFAULT 0,
  feeding_confirmed BOOLEAN DEFAULT false,
  water_available BOOLEAN DEFAULT false,
  observations TEXT,
  behavior_notes TEXT,
  body_condition_notes TEXT,
  health_alerts TEXT,
  incidents TEXT,
  logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS)
ALTER TABLE public.ccc_work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccc_daily_coverage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant select policy" ON public.ccc_work_shifts;
DROP POLICY IF EXISTS "Tenant all policy" ON public.ccc_work_shifts;
CREATE POLICY "Tenant select policy" ON public.ccc_work_shifts FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Tenant all policy" ON public.ccc_work_shifts FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

DROP POLICY IF EXISTS "Tenant select policy" ON public.ccc_daily_coverage_logs;
DROP POLICY IF EXISTS "Tenant all policy" ON public.ccc_daily_coverage_logs;
CREATE POLICY "Tenant select policy" ON public.ccc_daily_coverage_logs FOR SELECT USING (organization_id = ANY(public.get_user_orgs()));
CREATE POLICY "Tenant all policy" ON public.ccc_daily_coverage_logs FOR ALL USING (organization_id = ANY(public.get_user_orgs()));

-- 6. Add organization_id triggers
DROP TRIGGER IF EXISTS set_org_id_trigger ON public.ccc_work_shifts;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.ccc_work_shifts FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_org_id_trigger ON public.ccc_daily_coverage_logs;
CREATE TRIGGER set_org_id_trigger BEFORE INSERT ON public.ccc_daily_coverage_logs FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
