-- ============================================================
-- 015: MULTI-TENANT ISOLATION FIX
-- ============================================================
-- Propósito: 
-- 1. Eliminar sistema paralelo de 'stable_id' que crea conflictos
-- 2. Limpiar usuarios duplicados en organizaciones que no les pertenecen
-- 3. Reescribir políticas usando estrictamente organization_id
-- ============================================================

-- 1. CORREGIR get_user_orgs() para que solo devuelva LA organización principal del usuario, 
-- a menos que el sistema de invitaciones lo haya agregado explícitamente a otra.
-- Para prevenir el bug donde un dueño ve las orgs de otros, vamos a priorizar
-- la organización asignada en su tabla de profiles.
CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    -- Su propia organización principal
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND organization_id IS NOT NULL
    UNION
    -- O organizaciones donde fue invitado y aceptado explícitamente
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role != 'Owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- 2. LIMPIAR USUARIOS CRUZADOS EN user_roles y organization_members
-- Un usuario solo debe ser "Owner" de la organización principal en su perfil.
-- Si hay un registro donde es Owner de OTRA organización que no es la de su perfil, se elimina.

DELETE FROM public.user_roles 
WHERE role = 'Owner' 
AND organization_id != (SELECT organization_id FROM public.profiles WHERE id = public.user_roles.user_id);

DELETE FROM public.organization_members 
WHERE role = 'Owner' 
AND organization_id != (SELECT organization_id FROM public.profiles WHERE id = public.organization_members.user_id);


-- 3. ELIMINAR LAS POLÍTICAS DE MIGRACIÓN 006 (Basadas en stable_id)
-- Estas políticas son las que permitían ver todo usando OR logic.
DROP POLICY IF EXISTS "tenant_stables_select" ON stables;
DROP POLICY IF EXISTS "owner_stables_update" ON stables;
DROP POLICY IF EXISTS "profiles_self_select" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "farms_tenant_write" ON farms;
DROP POLICY IF EXISTS "farms_tenant_update" ON farms;
DROP POLICY IF EXISTS "farms_tenant_delete" ON farms;
DROP POLICY IF EXISTS "horses_tenant_select" ON horses;
DROP POLICY IF EXISTS "horses_tenant_insert" ON horses;
DROP POLICY IF EXISTS "horses_tenant_update" ON horses;
DROP POLICY IF EXISTS "horses_tenant_delete" ON horses;
DROP POLICY IF EXISTS "health_tenant_select" ON health_records;
DROP POLICY IF EXISTS "health_tenant_insert" ON health_records;
DROP POLICY IF EXISTS "health_tenant_update" ON health_records;
DROP POLICY IF EXISTS "health_tenant_delete" ON health_records;
DROP POLICY IF EXISTS "updates_tenant_select" ON updates;
DROP POLICY IF EXISTS "updates_tenant_insert" ON updates;
DROP POLICY IF EXISTS "competitions_tenant_select" ON competitions;
DROP POLICY IF EXISTS "competitions_tenant_insert" ON competitions;
DROP POLICY IF EXISTS "genetics_tenant_select" ON genetics;
DROP POLICY IF EXISTS "genetics_tenant_insert" ON genetics;
DROP POLICY IF EXISTS "notifications_tenant_select" ON notifications;
DROP POLICY IF EXISTS "notifications_tenant_update" ON notifications;
DROP POLICY IF EXISTS "documents_tenant_select" ON documents;
DROP POLICY IF EXISTS "documents_tenant_insert" ON documents;

-- Eliminar políticas MUY abiertas (USING true)
DROP POLICY IF EXISTS "farms_public_select" ON farms;
DROP POLICY IF EXISTS "genetics_public_select" ON genetics;
DROP POLICY IF EXISTS "horses_public_select" ON horses;
DROP POLICY IF EXISTS "Audit logs select policy" ON audit_logs;

-- Corregir la política de invitaciones de la migración 20260620041217
DROP POLICY IF EXISTS "Cualquiera puede ver invitaciones por token" ON invitations;
DROP POLICY IF EXISTS "Usuarios pueden aceptar su propia invitación" ON invitations;


-- 4. REASEGURAR LAS POLÍTICAS RLS (Multi-Tenant Estricto por organization_id)

-- Invitations: Solo puedes ver las invitaciones pendientes de TU organización, 
-- O si tienes el token exacto (el frontend buscará por token en el backend via Edge Function en el futuro,
-- pero por ahora para que no exponga toda la lista, lo atamos al email del usuario).
CREATE POLICY "invitations_tenant_select" ON invitations FOR SELECT 
USING (
  organization_id = ANY(public.get_user_orgs()) 
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "invitations_self_update" ON invitations FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Perfiles (Profiles): Un usuario puede ver su perfil, y los perfiles de la gente en su organización
DROP POLICY IF EXISTS "Profiles select policy" ON profiles;
CREATE POLICY "Profiles select policy" ON profiles FOR SELECT 
USING (
  id = auth.uid() OR organization_id = ANY(public.get_user_orgs())
);

-- Aplicar la política restrictiva de organization_id a todas las tablas del sistema
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
    -- Eliminar las creadas en migración 007
    EXECUTE format('DROP POLICY IF EXISTS "Tenant select policy" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Tenant all policy" ON %I', t);
    
    -- Crear políticas estrictas
    EXECUTE format('CREATE POLICY "Tenant select policy" ON %I FOR SELECT USING (organization_id = ANY(public.get_user_orgs()))', t);
    EXECUTE format('CREATE POLICY "Tenant all policy" ON %I FOR ALL USING (organization_id = ANY(public.get_user_orgs()))', t);
  END LOOP;
END $$;
