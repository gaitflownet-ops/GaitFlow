-- Restore profiles RLS policies that were dropped in 015_fix_multi_tenant_isolation.sql

-- Permitir que un usuario inserte su propio perfil al registrarse
CREATE POLICY "profiles_self_insert"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Permitir que un usuario actualice su propio perfil, o que los administradores de su organizacin lo actualicen
CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid() OR organization_id = ANY(public.get_user_orgs())
  );
