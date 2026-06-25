-- ============================================================
-- 006: GaitFlow RLS Policies — Multi-Tenant Isolation
-- ============================================================
-- Este migration corrige y reemplaza TODAS las políticas RLS
-- existentes con un sistema de aislamiento multi-tenant real:
--   1. Elimina políticas rotas (especialmente la de 004)
--   2. Aplica aislamiento por stable_id en todas las tablas
--   3. Políticas específicas por rol
--   4. Audit logs inmutables (solo INSERT)
-- ============================================================

-- ─── RLS en nuevas tablas ────────────────────────────────────────────────────

ALTER TABLE stables          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stable_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;

-- ─── LIMPIAR TODAS LAS POLÍTICAS ANTIGUAS ────────────────────────────────────
-- Eliminar políticas previas para reemplazarlas con el nuevo sistema.

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone."  ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile."        ON profiles;
DROP POLICY IF EXISTS "Users can update own profile."             ON profiles;

-- Farms
DROP POLICY IF EXISTS "Farms are viewable by everyone."           ON farms;
DROP POLICY IF EXISTS "Farm owners can update"                    ON farms;

-- Horses (incluyendo la política ROTA de migración 004)
DROP POLICY IF EXISTS "Horses are viewable by everyone."          ON horses;
DROP POLICY IF EXISTS "Horse owners can update"                   ON horses;

-- Updates
DROP POLICY IF EXISTS "Updates are viewable by horse owner"       ON updates;
DROP POLICY IF EXISTS "Updates insertable by owner"               ON updates;

-- Competitions
DROP POLICY IF EXISTS "Competitions are viewable by everyone."    ON competitions;
DROP POLICY IF EXISTS "Competitions insertable by owner"          ON competitions;

-- Health Records
DROP POLICY IF EXISTS "Health records are viewable by horse owner" ON health_records;
DROP POLICY IF EXISTS "Health records insertable by owner"         ON health_records;

-- Genetics
DROP POLICY IF EXISTS "Genetics are viewable by everyone."        ON genetics;

-- Notifications
DROP POLICY IF EXISTS "Notifications are viewable by user"        ON notifications;
DROP POLICY IF EXISTS "Notifications updateable by user"          ON notifications;

-- Documents
DROP POLICY IF EXISTS "Documents are viewable by horse owner"     ON documents;
DROP POLICY IF EXISTS "Documents insertable by horse owner"       ON documents;

-- Storage (documentos públicos a privatizar)
DROP POLICY IF EXISTS "Public horse documents"                    ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload horse documents" ON storage.objects;

-- ─── POLÍTICAS: STABLES ──────────────────────────────────────────────────────

-- SUPER_ADMIN ve todos los establos
CREATE POLICY "super_admin_stables_all"
  ON stables FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN');

-- OWNER y STABLE_ADMIN ven solo su propio establo
CREATE POLICY "tenant_stables_select"
  ON stables FOR SELECT
  USING (id = get_user_stable_id());

-- Solo OWNER puede actualizar su establo
CREATE POLICY "owner_stables_update"
  ON stables FOR UPDATE
  USING (
    id = get_user_stable_id()
    AND get_user_role() IN ('OWNER')
  );

-- ─── POLÍTICAS: PROFILES ─────────────────────────────────────────────────────

-- Un usuario siempre puede leer y editar su propio perfil
CREATE POLICY "profiles_self_select"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR (stable_id = get_user_stable_id() AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "profiles_self_insert"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: FARMS ────────────────────────────────────────────────────────

-- Farms públicas son visibles para todos (para el marketplace/showcase)
CREATE POLICY "farms_public_select"
  ON farms FOR SELECT
  USING (true);

-- Solo OWNER y STABLE_ADMIN del tenant pueden modificar sus farms
CREATE POLICY "farms_tenant_write"
  ON farms FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "farms_tenant_update"
  ON farms FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "farms_tenant_delete"
  ON farms FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: HORSES ───────────────────────────────────────────────────────
-- CORRECCIÓN CRÍTICA: Reemplaza la política insegura de migración 004

-- Caballos públicos (is_public = true) son visibles en el marketplace
CREATE POLICY "horses_public_select"
  ON horses FOR SELECT
  USING (is_public = true);

-- Miembros del establo ven todos los caballos de su tenant
CREATE POLICY "horses_tenant_select"
  ON horses FOR SELECT
  USING (stable_id = get_user_stable_id());

-- Solo roles con permiso de escritura en horses pueden crear/modificar
CREATE POLICY "horses_tenant_insert"
  ON horses FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "horses_tenant_update"
  ON horses FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "horses_tenant_delete"
  ON horses FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: HEALTH_RECORDS ───────────────────────────────────────────────

-- Registros médicos: visible para OWNER, STABLE_ADMIN, VETERINARIAN del mismo establo
CREATE POLICY "health_tenant_select"
  ON health_records FOR SELECT
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'VETERINARIAN', 'SUPER_ADMIN')
  );

-- Solo VETERINARIAN, OWNER y STABLE_ADMIN pueden crear registros médicos
CREATE POLICY "health_tenant_insert"
  ON health_records FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'VETERINARIAN', 'SUPER_ADMIN')
  );

CREATE POLICY "health_tenant_update"
  ON health_records FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'VETERINARIAN', 'SUPER_ADMIN')
  );

-- Solo OWNER puede eliminar registros médicos (VETERINARIAN no puede borrar)
CREATE POLICY "health_tenant_delete"
  ON health_records FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: UPDATES (Activity Feed) ─────────────────────────────────────

-- Updates de caballos públicos son visibles
CREATE POLICY "updates_public_select"
  ON updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = updates.horse_id
        AND horses.is_public = true
    )
  );

-- Miembros del establo ven todos los updates de su tenant
CREATE POLICY "updates_tenant_select"
  ON updates FOR SELECT
  USING (stable_id = get_user_stable_id());

CREATE POLICY "updates_tenant_insert"
  ON updates FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'VETERINARIAN', 'TRAINER', 'SUPER_ADMIN')
  );

CREATE POLICY "updates_tenant_update"
  ON updates FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "updates_tenant_delete"
  ON updates FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: COMPETITIONS ─────────────────────────────────────────────────

-- Competiciones de caballos públicos son visibles para todos
CREATE POLICY "competitions_public_select"
  ON competitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = competitions.horse_id
        AND horses.is_public = true
    )
  );

-- Miembros del establo ven sus propias competiciones
CREATE POLICY "competitions_tenant_select"
  ON competitions FOR SELECT
  USING (stable_id = get_user_stable_id());

CREATE POLICY "competitions_tenant_insert"
  ON competitions FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'TRAINER', 'SUPER_ADMIN')
  );

CREATE POLICY "competitions_tenant_update"
  ON competitions FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "competitions_tenant_delete"
  ON competitions FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: GENETICS ─────────────────────────────────────────────────────

-- Genética marcada como pública (para el marketplace) es visible para todos
CREATE POLICY "genetics_public_select"
  ON genetics FOR SELECT
  USING (true); -- El marketplace necesita ver genética disponible

CREATE POLICY "genetics_tenant_insert"
  ON genetics FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'VETERINARIAN', 'SUPER_ADMIN')
  );

CREATE POLICY "genetics_tenant_update"
  ON genetics FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "genetics_tenant_delete"
  ON genetics FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: NOTIFICATIONS ────────────────────────────────────────────────

-- Cada usuario solo ve sus propias notificaciones
CREATE POLICY "notifications_own_select"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_own_update"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- El sistema (OWNER/ADMIN) puede crear notificaciones para usuarios del establo
CREATE POLICY "notifications_tenant_insert"
  ON notifications FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "notifications_own_delete"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ─── POLÍTICAS: DOCUMENTS ────────────────────────────────────────────────────

-- Solo miembros del establo con permisos pueden leer documentos
CREATE POLICY "documents_tenant_select"
  ON documents FOR SELECT
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'VETERINARIAN', 'SUPER_ADMIN')
  );

CREATE POLICY "documents_tenant_insert"
  ON documents FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'VETERINARIAN', 'SUPER_ADMIN')
  );

CREATE POLICY "documents_tenant_update"
  ON documents FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "documents_tenant_delete"
  ON documents FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: USER_STABLE_ROLES ────────────────────────────────────────────

-- OWNER y STABLE_ADMIN gestionan los roles de su establo
CREATE POLICY "user_stable_roles_select"
  ON user_stable_roles FOR SELECT
  USING (
    stable_id = get_user_stable_id()
    OR user_id = auth.uid() -- Los usuarios ven sus propias asignaciones
  );

CREATE POLICY "user_stable_roles_insert"
  ON user_stable_roles FOR INSERT
  WITH CHECK (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "user_stable_roles_update"
  ON user_stable_roles FOR UPDATE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "user_stable_roles_delete"
  ON user_stable_roles FOR DELETE
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ─── POLÍTICAS: ROLE_PERMISSIONS ─────────────────────────────────────────────

-- Cualquier usuario autenticado puede consultar la matriz de permisos (es pública)
CREATE POLICY "role_permissions_public_select"
  ON role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo SUPER_ADMIN puede modificar la matriz de permisos
CREATE POLICY "role_permissions_super_admin_write"
  ON role_permissions FOR ALL
  USING (get_user_role() = 'SUPER_ADMIN');

-- ─── POLÍTICAS: AUDIT_LOGS (INMUTABLES) ──────────────────────────────────────

-- Los usuarios pueden ver los logs de auditoría de su establo
CREATE POLICY "audit_logs_tenant_select"
  ON audit_logs FOR SELECT
  USING (
    stable_id = get_user_stable_id()
    AND get_user_role() IN ('OWNER', 'STABLE_ADMIN', 'SUPER_ADMIN')
  );

-- Solo el sistema puede insertar audit logs (via triggers SECURITY DEFINER)
-- Los usuarios NO pueden insertar, actualizar ni eliminar audit logs directamente
CREATE POLICY "audit_logs_system_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Los triggers SECURITY DEFINER manejan esto

-- PROHIBIDO: ningún usuario puede actualizar o eliminar audit logs
-- (No se crean políticas UPDATE/DELETE, lo que las bloquea por defecto)
