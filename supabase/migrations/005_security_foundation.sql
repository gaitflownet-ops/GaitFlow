-- ============================================================
-- 005: GaitFlow Security Foundation — Multi-Tenant Architecture
-- ============================================================
-- Este migration establece la base de seguridad empresarial:
--   1. Tabla stables (tenant central)
--   2. ENUM user_role (roles RBAC)
--   3. Tablas user_stable_roles y role_permissions
--   4. Tabla audit_logs (inmutable)
--   5. Columna stable_id en todas las tablas existentes
--   6. Funciones helper de seguridad
--   7. Triggers de auditoría automática
-- ============================================================

-- ─── 1. TABLA STABLES (Tenant Central) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS stables (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'starter'
                   CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'suspended', 'cancelled')),
  owner_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email    TEXT,
  contact_phone    TEXT,
  address          TEXT,
  logo_url         TEXT,
  primary_color    TEXT DEFAULT '#B8963E',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en stables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stables_updated_at
  BEFORE UPDATE ON stables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 2. ENUM USER_ROLE ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',   -- Personal interno GaitFlow, acceso total a la plataforma
    'OWNER',         -- Dueño del establo, acceso total a su tenant
    'STABLE_ADMIN',  -- Administrador operacional del establo
    'VETERINARIAN',  -- Registros médicos y salud equina
    'TRAINER',       -- Entrenamiento y caballos asignados
    'GROOM',         -- Tareas diarias y alimentación
    'FARRIER',       -- Cuidado de pezuñas
    'DENTIST'        -- Historial dental
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. TABLA USER_STABLE_ROLES (Asignación de Roles por Establo) ────────────

CREATE TABLE IF NOT EXISTS user_stable_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stable_id   UUID NOT NULL REFERENCES stables(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'GROOM',
  granted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, stable_id)
);

CREATE INDEX IF NOT EXISTS idx_user_stable_roles_user_id   ON user_stable_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stable_roles_stable_id ON user_stable_roles(stable_id);

-- ─── 4. TABLA ROLE_PERMISSIONS (Matriz de Permisos por Módulo) ───────────────

CREATE TABLE IF NOT EXISTS role_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role        user_role NOT NULL,
  module      TEXT NOT NULL,  -- 'horses', 'health', 'tasks', 'financial', 'documents', etc.
  action      TEXT NOT NULL,  -- 'read', 'create', 'update', 'delete'
  is_allowed  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, module, action)
);

-- Insertar la matriz de permisos completa
INSERT INTO role_permissions (role, module, action, is_allowed) VALUES
  -- SUPER_ADMIN — Acceso total
  ('SUPER_ADMIN', 'horses',      'read',   true),
  ('SUPER_ADMIN', 'horses',      'create', true),
  ('SUPER_ADMIN', 'horses',      'update', true),
  ('SUPER_ADMIN', 'horses',      'delete', true),
  ('SUPER_ADMIN', 'health',      'read',   true),
  ('SUPER_ADMIN', 'health',      'create', true),
  ('SUPER_ADMIN', 'health',      'update', true),
  ('SUPER_ADMIN', 'health',      'delete', true),
  ('SUPER_ADMIN', 'tasks',       'read',   true),
  ('SUPER_ADMIN', 'tasks',       'create', true),
  ('SUPER_ADMIN', 'tasks',       'update', true),
  ('SUPER_ADMIN', 'tasks',       'delete', true),
  ('SUPER_ADMIN', 'financial',   'read',   true),
  ('SUPER_ADMIN', 'financial',   'create', true),
  ('SUPER_ADMIN', 'financial',   'update', true),
  ('SUPER_ADMIN', 'financial',   'delete', true),
  ('SUPER_ADMIN', 'documents',   'read',   true),
  ('SUPER_ADMIN', 'documents',   'create', true),
  ('SUPER_ADMIN', 'documents',   'update', true),
  ('SUPER_ADMIN', 'documents',   'delete', true),
  ('SUPER_ADMIN', 'marketplace', 'read',   true),
  ('SUPER_ADMIN', 'marketplace', 'create', true),
  ('SUPER_ADMIN', 'marketplace', 'update', true),
  ('SUPER_ADMIN', 'marketplace', 'delete', true),
  ('SUPER_ADMIN', 'breeding',    'read',   true),
  ('SUPER_ADMIN', 'breeding',    'create', true),
  ('SUPER_ADMIN', 'breeding',    'update', true),
  ('SUPER_ADMIN', 'breeding',    'delete', true),
  ('SUPER_ADMIN', 'users',       'read',   true),
  ('SUPER_ADMIN', 'users',       'create', true),
  ('SUPER_ADMIN', 'users',       'update', true),
  ('SUPER_ADMIN', 'users',       'delete', true),

  -- OWNER — Acceso total a su propio establo
  ('OWNER', 'horses',      'read',   true),
  ('OWNER', 'horses',      'create', true),
  ('OWNER', 'horses',      'update', true),
  ('OWNER', 'horses',      'delete', true),
  ('OWNER', 'health',      'read',   true),
  ('OWNER', 'health',      'create', true),
  ('OWNER', 'health',      'update', true),
  ('OWNER', 'health',      'delete', true),
  ('OWNER', 'tasks',       'read',   true),
  ('OWNER', 'tasks',       'create', true),
  ('OWNER', 'tasks',       'update', true),
  ('OWNER', 'tasks',       'delete', true),
  ('OWNER', 'financial',   'read',   true),
  ('OWNER', 'financial',   'create', true),
  ('OWNER', 'financial',   'update', true),
  ('OWNER', 'financial',   'delete', true),
  ('OWNER', 'documents',   'read',   true),
  ('OWNER', 'documents',   'create', true),
  ('OWNER', 'documents',   'update', true),
  ('OWNER', 'documents',   'delete', true),
  ('OWNER', 'marketplace', 'read',   true),
  ('OWNER', 'marketplace', 'create', true),
  ('OWNER', 'marketplace', 'update', true),
  ('OWNER', 'marketplace', 'delete', true),
  ('OWNER', 'breeding',    'read',   true),
  ('OWNER', 'breeding',    'create', true),
  ('OWNER', 'breeding',    'update', true),
  ('OWNER', 'breeding',    'delete', true),
  ('OWNER', 'users',       'read',   true),
  ('OWNER', 'users',       'create', true),
  ('OWNER', 'users',       'update', true),
  ('OWNER', 'users',       'delete', true),

  -- STABLE_ADMIN — Gestión operacional, sin billing/subscription
  ('STABLE_ADMIN', 'horses',      'read',   true),
  ('STABLE_ADMIN', 'horses',      'create', true),
  ('STABLE_ADMIN', 'horses',      'update', true),
  ('STABLE_ADMIN', 'horses',      'delete', true),
  ('STABLE_ADMIN', 'health',      'read',   true),
  ('STABLE_ADMIN', 'health',      'create', true),
  ('STABLE_ADMIN', 'health',      'update', true),
  ('STABLE_ADMIN', 'health',      'delete', true),
  ('STABLE_ADMIN', 'tasks',       'read',   true),
  ('STABLE_ADMIN', 'tasks',       'create', true),
  ('STABLE_ADMIN', 'tasks',       'update', true),
  ('STABLE_ADMIN', 'tasks',       'delete', true),
  ('STABLE_ADMIN', 'financial',   'read',   true),
  ('STABLE_ADMIN', 'financial',   'create', true),
  ('STABLE_ADMIN', 'financial',   'update', false), -- No puede modificar facturación
  ('STABLE_ADMIN', 'financial',   'delete', false),
  ('STABLE_ADMIN', 'documents',   'read',   true),
  ('STABLE_ADMIN', 'documents',   'create', true),
  ('STABLE_ADMIN', 'documents',   'update', true),
  ('STABLE_ADMIN', 'documents',   'delete', true),
  ('STABLE_ADMIN', 'marketplace', 'read',   true),
  ('STABLE_ADMIN', 'marketplace', 'create', true),
  ('STABLE_ADMIN', 'marketplace', 'update', true),
  ('STABLE_ADMIN', 'marketplace', 'delete', false),
  ('STABLE_ADMIN', 'breeding',    'read',   true),
  ('STABLE_ADMIN', 'breeding',    'create', true),
  ('STABLE_ADMIN', 'breeding',    'update', true),
  ('STABLE_ADMIN', 'breeding',    'delete', false),
  ('STABLE_ADMIN', 'users',       'read',   true),
  ('STABLE_ADMIN', 'users',       'create', true),
  ('STABLE_ADMIN', 'users',       'update', true),
  ('STABLE_ADMIN', 'users',       'delete', false),

  -- VETERINARIAN — Solo médico, sin finanzas ni mercado
  ('VETERINARIAN', 'horses',      'read',   true),
  ('VETERINARIAN', 'horses',      'create', false),
  ('VETERINARIAN', 'horses',      'update', false),
  ('VETERINARIAN', 'horses',      'delete', false),
  ('VETERINARIAN', 'health',      'read',   true),
  ('VETERINARIAN', 'health',      'create', true),
  ('VETERINARIAN', 'health',      'update', true),
  ('VETERINARIAN', 'health',      'delete', false),
  ('VETERINARIAN', 'tasks',       'read',   true),
  ('VETERINARIAN', 'tasks',       'create', false),
  ('VETERINARIAN', 'tasks',       'update', true),  -- Puede marcar sus tareas
  ('VETERINARIAN', 'tasks',       'delete', false),
  ('VETERINARIAN', 'financial',   'read',   false),
  ('VETERINARIAN', 'financial',   'create', false),
  ('VETERINARIAN', 'financial',   'update', false),
  ('VETERINARIAN', 'financial',   'delete', false),
  ('VETERINARIAN', 'documents',   'read',   true),
  ('VETERINARIAN', 'documents',   'create', true),
  ('VETERINARIAN', 'documents',   'update', false),
  ('VETERINARIAN', 'documents',   'delete', false),
  ('VETERINARIAN', 'marketplace', 'read',   false),
  ('VETERINARIAN', 'marketplace', 'create', false),
  ('VETERINARIAN', 'marketplace', 'update', false),
  ('VETERINARIAN', 'marketplace', 'delete', false),
  ('VETERINARIAN', 'breeding',    'read',   true),
  ('VETERINARIAN', 'breeding',    'create', true),
  ('VETERINARIAN', 'breeding',    'update', true),
  ('VETERINARIAN', 'breeding',    'delete', false),
  ('VETERINARIAN', 'users',       'read',   false),
  ('VETERINARIAN', 'users',       'create', false),
  ('VETERINARIAN', 'users',       'update', false),
  ('VETERINARIAN', 'users',       'delete', false),

  -- TRAINER — Entrenamiento, sin finanzas ni cría
  ('TRAINER', 'horses',      'read',   true),
  ('TRAINER', 'horses',      'create', false),
  ('TRAINER', 'horses',      'update', false),
  ('TRAINER', 'horses',      'delete', false),
  ('TRAINER', 'health',      'read',   true),
  ('TRAINER', 'health',      'create', false),
  ('TRAINER', 'health',      'update', false),
  ('TRAINER', 'health',      'delete', false),
  ('TRAINER', 'tasks',       'read',   true),
  ('TRAINER', 'tasks',       'create', false),
  ('TRAINER', 'tasks',       'update', true),  -- Actualiza estado de tareas propias
  ('TRAINER', 'tasks',       'delete', false),
  ('TRAINER', 'financial',   'read',   false),
  ('TRAINER', 'financial',   'create', false),
  ('TRAINER', 'financial',   'update', false),
  ('TRAINER', 'financial',   'delete', false),
  ('TRAINER', 'documents',   'read',   false),
  ('TRAINER', 'documents',   'create', false),
  ('TRAINER', 'documents',   'update', false),
  ('TRAINER', 'documents',   'delete', false),
  ('TRAINER', 'marketplace', 'read',   false),
  ('TRAINER', 'marketplace', 'create', false),
  ('TRAINER', 'marketplace', 'update', false),
  ('TRAINER', 'marketplace', 'delete', false),
  ('TRAINER', 'breeding',    'read',   false),
  ('TRAINER', 'breeding',    'create', false),
  ('TRAINER', 'breeding',    'update', false),
  ('TRAINER', 'breeding',    'delete', false),
  ('TRAINER', 'users',       'read',   false),
  ('TRAINER', 'users',       'create', false),
  ('TRAINER', 'users',       'update', false),
  ('TRAINER', 'users',       'delete', false),

  -- GROOM — Tareas diarias, solo lectura en caballos
  ('GROOM', 'horses',      'read',   true),
  ('GROOM', 'horses',      'create', false),
  ('GROOM', 'horses',      'update', false),
  ('GROOM', 'horses',      'delete', false),
  ('GROOM', 'health',      'read',   false),
  ('GROOM', 'health',      'create', false),
  ('GROOM', 'health',      'update', false),
  ('GROOM', 'health',      'delete', false),
  ('GROOM', 'tasks',       'read',   true),
  ('GROOM', 'tasks',       'create', false),
  ('GROOM', 'tasks',       'update', true),  -- Marca tareas como completadas
  ('GROOM', 'tasks',       'delete', false),
  ('GROOM', 'financial',   'read',   false),
  ('GROOM', 'financial',   'create', false),
  ('GROOM', 'financial',   'update', false),
  ('GROOM', 'financial',   'delete', false),
  ('GROOM', 'documents',   'read',   false),
  ('GROOM', 'documents',   'create', false),
  ('GROOM', 'documents',   'update', false),
  ('GROOM', 'documents',   'delete', false),
  ('GROOM', 'marketplace', 'read',   false),
  ('GROOM', 'marketplace', 'create', false),
  ('GROOM', 'marketplace', 'update', false),
  ('GROOM', 'marketplace', 'delete', false),
  ('GROOM', 'breeding',    'read',   false),
  ('GROOM', 'breeding',    'create', false),
  ('GROOM', 'breeding',    'update', false),
  ('GROOM', 'breeding',    'delete', false),
  ('GROOM', 'users',       'read',   false),
  ('GROOM', 'users',       'create', false),
  ('GROOM', 'users',       'update', false),
  ('GROOM', 'users',       'delete', false),

  -- FARRIER — Solo pezuñas y citas asignadas
  ('FARRIER', 'horses',      'read',   true),
  ('FARRIER', 'horses',      'create', false),
  ('FARRIER', 'horses',      'update', false),
  ('FARRIER', 'horses',      'delete', false),
  ('FARRIER', 'health',      'read',   true),   -- Solo registros de pezuñas
  ('FARRIER', 'health',      'create', true),
  ('FARRIER', 'health',      'update', true),
  ('FARRIER', 'health',      'delete', false),
  ('FARRIER', 'tasks',       'read',   true),
  ('FARRIER', 'tasks',       'create', false),
  ('FARRIER', 'tasks',       'update', true),
  ('FARRIER', 'tasks',       'delete', false),
  ('FARRIER', 'financial',   'read',   false),
  ('FARRIER', 'financial',   'create', false),
  ('FARRIER', 'financial',   'update', false),
  ('FARRIER', 'financial',   'delete', false),
  ('FARRIER', 'documents',   'read',   false),
  ('FARRIER', 'documents',   'create', false),
  ('FARRIER', 'documents',   'update', false),
  ('FARRIER', 'documents',   'delete', false),
  ('FARRIER', 'marketplace', 'read',   false),
  ('FARRIER', 'marketplace', 'create', false),
  ('FARRIER', 'marketplace', 'update', false),
  ('FARRIER', 'marketplace', 'delete', false),
  ('FARRIER', 'breeding',    'read',   false),
  ('FARRIER', 'breeding',    'create', false),
  ('FARRIER', 'breeding',    'update', false),
  ('FARRIER', 'breeding',    'delete', false),
  ('FARRIER', 'users',       'read',   false),
  ('FARRIER', 'users',       'create', false),
  ('FARRIER', 'users',       'update', false),
  ('FARRIER', 'users',       'delete', false),

  -- DENTIST — Solo historial dental y citas
  ('DENTIST', 'horses',      'read',   true),
  ('DENTIST', 'horses',      'create', false),
  ('DENTIST', 'horses',      'update', false),
  ('DENTIST', 'horses',      'delete', false),
  ('DENTIST', 'health',      'read',   true),   -- Solo registros dentales
  ('DENTIST', 'health',      'create', true),
  ('DENTIST', 'health',      'update', true),
  ('DENTIST', 'health',      'delete', false),
  ('DENTIST', 'tasks',       'read',   true),
  ('DENTIST', 'tasks',       'create', false),
  ('DENTIST', 'tasks',       'update', true),
  ('DENTIST', 'tasks',       'delete', false),
  ('DENTIST', 'financial',   'read',   false),
  ('DENTIST', 'financial',   'create', false),
  ('DENTIST', 'financial',   'update', false),
  ('DENTIST', 'financial',   'delete', false),
  ('DENTIST', 'documents',   'read',   false),
  ('DENTIST', 'documents',   'create', false),
  ('DENTIST', 'documents',   'update', false),
  ('DENTIST', 'documents',   'delete', false),
  ('DENTIST', 'marketplace', 'read',   false),
  ('DENTIST', 'marketplace', 'create', false),
  ('DENTIST', 'marketplace', 'update', false),
  ('DENTIST', 'marketplace', 'delete', false),
  ('DENTIST', 'breeding',    'read',   false),
  ('DENTIST', 'breeding',    'create', false),
  ('DENTIST', 'breeding',    'update', false),
  ('DENTIST', 'breeding',    'delete', false),
  ('DENTIST', 'users',       'read',   false),
  ('DENTIST', 'users',       'create', false),
  ('DENTIST', 'users',       'update', false),
  ('DENTIST', 'users',       'delete', false)

ON CONFLICT (role, module, action) DO NOTHING;

-- ─── 5. TABLA AUDIT_LOGS (Inmutable — solo INSERT) ───────────────────────────
-- Totalmente idempotente: soporta cualquier estado previo de la tabla

CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Añadir cada columna defensivamente
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN action      TEXT;            EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN entity_type TEXT;            EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN stable_id   UUID REFERENCES stables(id) ON DELETE SET NULL;    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN entity_id   UUID;            EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN old_data    JSONB;           EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN new_data    JSONB;           EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN ip_address  INET;            EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit_logs ADD COLUMN user_agent  TEXT;            EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Crear índices solo si la columna ya existe
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_id')
  THEN CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id); END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='stable_id')
  THEN CREATE INDEX IF NOT EXISTS idx_audit_logs_stable_id ON audit_logs(stable_id); END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='entity_type')
  THEN CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type); END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);


-- ─── 6. AÑADIR stable_id A TABLAS EXISTENTES ─────────────────────────────────

-- Profiles: añadir stable_id (el establo al que pertenece el perfil por defecto)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_role user_role NOT NULL DEFAULT 'OWNER',
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Horses
ALTER TABLE horses
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE;

-- Health Records
ALTER TABLE health_records
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE;

-- Updates
ALTER TABLE updates
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE;

-- Competitions
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE;

-- Documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sha256_hash TEXT,
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'private'
                            CHECK (access_level IN ('private', 'shared', 'public')),
  ADD COLUMN IF NOT EXISTS linked_contact_id UUID;

-- Genetics
ALTER TABLE genetics
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Notifications (ya tiene user_id, añadir stable_id)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE;

-- Farms: añadir stable_id para vincular a tenant
ALTER TABLE farms
  ADD COLUMN IF NOT EXISTS stable_id UUID REFERENCES stables(id) ON DELETE CASCADE;

-- ─── 7. ÍNDICES DE RENDIMIENTO PARA stable_id ────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_horses_stable_id        ON horses(stable_id);
CREATE INDEX IF NOT EXISTS idx_health_records_stable_id ON health_records(stable_id);
CREATE INDEX IF NOT EXISTS idx_updates_stable_id       ON updates(stable_id);
CREATE INDEX IF NOT EXISTS idx_competitions_stable_id  ON competitions(stable_id);
CREATE INDEX IF NOT EXISTS idx_documents_stable_id     ON documents(stable_id);
CREATE INDEX IF NOT EXISTS idx_genetics_stable_id      ON genetics(stable_id);
CREATE INDEX IF NOT EXISTS idx_notifications_stable_id ON notifications(stable_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stable_id      ON profiles(stable_id);

-- ─── 8. FUNCIÓN HELPER: get_user_stable_id() ─────────────────────────────────
-- Devuelve el stable_id del usuario autenticado actual.
-- Usada por las políticas RLS para filtrar datos.

CREATE OR REPLACE FUNCTION get_user_stable_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT stable_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ─── 9. FUNCIÓN HELPER: get_user_role() ──────────────────────────────────────
-- Devuelve el rol del usuario autenticado en su establo.

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT user_role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ─── 10. FUNCIÓN HELPER: user_has_permission() ───────────────────────────────
-- Verifica si el usuario actual tiene un permiso específico.

CREATE OR REPLACE FUNCTION user_has_permission(p_module TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_allowed FROM role_permissions
     WHERE role = get_user_role()
       AND module = p_module
       AND action = p_action
     LIMIT 1),
    false
  );
$$;

-- ─── 11. TRIGGER DE AUDITORÍA AUTOMÁTICA ────────────────────────────────────
-- Adaptado al esquema real de audit_logs existente en la BD:
-- (id, user_id, organization_id, action, table_name, record_id, previous_value, new_value, created_at)
-- + columna stable_id que añadimos vía ALTER TABLE

-- Añadir stable_id a audit_logs existente (referenciando stables)
DO $$ BEGIN
  ALTER TABLE audit_logs ADD COLUMN stable_id UUID REFERENCES stables(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_stable_id ON audit_logs(stable_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_stable_id UUID;
  v_record_id TEXT;
BEGIN
  -- Intentar obtener stable_id del registro afectado
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_stable_id := (OLD.stable_id)::UUID;
      v_record_id := OLD.id::TEXT;
    ELSE
      v_stable_id := (NEW.stable_id)::UUID;
      v_record_id := NEW.id::TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_stable_id := get_user_stable_id();
    v_record_id := NULL;
  END;

  -- Usar las columnas reales de la tabla audit_logs existente
  INSERT INTO audit_logs (
    user_id,
    -- organization_id omitido: tiene FK a tabla 'organizations' ajena a este sistema
    stable_id,         -- columna nueva que añadimos (referencia a stables)
    action,
    table_name,        -- nombre real de la columna en la tabla existente
    record_id,
    previous_value,    -- nombre real de la columna (era old_data)
    new_value          -- nombre real de la columna (era new_data)
  ) VALUES (
    auth.uid(),
    v_stable_id,
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Aplicar trigger de auditoría a tablas críticas (idempotente)
DROP TRIGGER IF EXISTS audit_horses             ON horses;
DROP TRIGGER IF EXISTS audit_health_records     ON health_records;
DROP TRIGGER IF EXISTS audit_documents          ON documents;
DROP TRIGGER IF EXISTS audit_user_stable_roles  ON user_stable_roles;

CREATE TRIGGER audit_horses
  AFTER INSERT OR UPDATE OR DELETE ON horses
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_health_records
  AFTER INSERT OR UPDATE OR DELETE ON health_records
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_user_stable_roles
  AFTER INSERT OR UPDATE OR DELETE ON user_stable_roles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- ─── 12. DATOS DE ESTABLO INICIAL para datos del seed ───────────────────────
-- Insertar un establo demo para que los datos existentes del seed tengan un tenant.

INSERT INTO stables (id, name, slug, subscription_plan, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Live Oak Stables (Demo)',
  'live-oak-stables-demo',
  'professional',
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- Asignar stable_id del demo a todos los registros existentes que no lo tengan
UPDATE horses        SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
UPDATE health_records SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
UPDATE updates       SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
UPDATE competitions  SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
UPDATE documents     SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
UPDATE genetics      SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
UPDATE notifications SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
UPDATE farms         SET stable_id = '00000000-0000-0000-0000-000000000001' WHERE stable_id IS NULL;
