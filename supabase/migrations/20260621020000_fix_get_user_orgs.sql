-- Migration: 20260621020000_fix_get_user_orgs.sql
-- Purpose: Include profiles.organization_id in get_user_orgs() to prevent RLS lockouts for existing users.

CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND organization_id IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
