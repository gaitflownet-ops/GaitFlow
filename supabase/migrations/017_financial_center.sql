-- ============================================================
-- GaitFlow · Migración 017 — Centro Financiero ERP
-- Arquitectura preparada para multi-módulo, multi-moneda,
-- costeo por caballo, auditoría y soft delete
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CENTROS DE COSTO
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_cost_centers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  type             TEXT CHECK (type IN (
                     'breeding', 'training', 'admin', 'competitions',
                     'marketing', 'maintenance', 'general', 'other'
                   )),
  parent_id        UUID REFERENCES financial_cost_centers(id) ON DELETE SET NULL,
  is_active        BOOLEAN DEFAULT TRUE,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. CATEGORÍAS FINANCIERAS CONFIGURABLES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon             TEXT,        -- emoji o slug de ícono
  color            TEXT,        -- hex color para la UI
  parent_id        UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  source_module    TEXT,        -- qué módulo puede auto-generar en esta categoría
  is_system        BOOLEAN DEFAULT FALSE,  -- no editable por usuario final
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. LIBRO MAYOR — FINANCIAL TRANSACTIONS
-- Fuente de verdad de TODOS los movimientos económicos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Tipo y clasificación
  type             TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
  category_id      UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  cost_center_id   UUID REFERENCES financial_cost_centers(id) ON DELETE SET NULL,

  -- Datos monetarios (preparado para multi-moneda futura)
  amount           NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency         TEXT NOT NULL DEFAULT 'COP',
  exchange_rate    NUMERIC(10, 6) DEFAULT 1,  -- a COP

  -- Descripción y estado
  description      TEXT,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  status           TEXT NOT NULL DEFAULT 'completed'
                     CHECK (status IN ('completed', 'pending', 'cancelled', 'reconciled')),
  payment_method   TEXT CHECK (payment_method IN (
                     'cash', 'bank_transfer', 'card', 'check',
                     'nequi', 'daviplata', 'crypto', 'other'
                   )),

  -- ── Referencias cruzadas con otros módulos ──────────────
  -- CRM
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Ejemplar (uno principal; relación N:N en tabla futura financial_transaction_horses)
  horse_id         UUID REFERENCES horses(id) ON DELETE SET NULL,

  -- Factura asociada
  invoice_id       UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Document Vault (reutilizamos el Vault, sin attachment_url duplicado)
  document_id      UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- Instalaciones/Ubicaciones (UUID sin FK para evitar dependencia circular;
  --   se tipará correctamente cuando el módulo de instalaciones madure)
  location_id      UUID,        -- references locations.id (future FK)
  location_type    TEXT,        -- 'pesebrera' | 'potrero' | 'bloque' | 'bodega' | 'oficina'

  -- Competencias (preparado para Fase futura)
  competition_id   UUID,        -- references competitions.id (future FK)

  -- Reproducción (preparado para Fase futura)
  breeding_record_id UUID,      -- references breeding_records.id (future FK)

  -- Trazabilidad de módulo origen (para integraciones automáticas)
  source_module    TEXT,        -- 'health' | 'nutrition' | 'marketplace' | 'breeding' |
                                -- 'competitions' | 'transport' | 'manual'
  source_ref_id    UUID,        -- ID del registro en el módulo origen
  source_ref_type  TEXT,        -- 'health_record' | 'nutrition_delivery' | 'sale' | etc.

  -- Metadatos
  tags             TEXT[],
  notes            TEXT,

  -- Auditoría de creación/modificación
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Soft Delete (nunca borramos movimientos financieros)
  is_deleted       BOOLEAN DEFAULT FALSE,
  deleted_at       TIMESTAMPTZ,
  deleted_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. TABLA PUENTE: transacción ↔ múltiples caballos
-- Preparada para Fase 4 (Costeo Automático por Caballo)
-- Por ahora se crea pero no se usa activamente
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_transaction_horses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID REFERENCES financial_transactions(id) ON DELETE CASCADE NOT NULL,
  horse_id         UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  -- Porcentaje del costo asignado a este caballo (suma debe ser 100 entre todos)
  allocation_pct   NUMERIC(5, 2) DEFAULT 100 CHECK (allocation_pct > 0 AND allocation_pct <= 100),
  allocation_amount NUMERIC(14, 2),  -- calculado: amount * allocation_pct / 100
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_id, horse_id)
);

-- ────────────────────────────────────────────────────────────
-- 5. LOG DE AUDITORÍA FINANCIERA
-- Registra cada modificación a una transacción
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_audit_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID REFERENCES financial_transactions(id) ON DELETE CASCADE NOT NULL,
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  changed_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_type      TEXT NOT NULL CHECK (change_type IN (
                     'create', 'update', 'delete', 'restore', 'status_change'
                   )),
  field_name       TEXT,        -- campo que cambió
  old_value        TEXT,        -- valor anterior (serializado como texto)
  new_value        TEXT,        -- valor nuevo
  metadata         JSONB,       -- contexto adicional
  changed_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 6. EVOLUCIÓN DE LA TABLA INVOICES EXISTENTE
-- Añadimos los campos que le faltan sin borrar datos
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number    TEXT,
  ADD COLUMN IF NOT EXISTS contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS horse_id          UUID REFERENCES horses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method    TEXT,
  ADD COLUMN IF NOT EXISTS subtotal          NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS tax_rate          NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount        NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount      NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS paid_amount       NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW();

-- ────────────────────────────────────────────────────────────
-- 7. ÍNDICES PARA RENDIMIENTO
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ft_org_date
  ON financial_transactions (organization_id, date DESC)
  WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_ft_org_type
  ON financial_transactions (organization_id, type)
  WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_ft_horse
  ON financial_transactions (horse_id)
  WHERE horse_id IS NOT NULL AND NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_ft_contact
  ON financial_transactions (contact_id)
  WHERE contact_id IS NOT NULL AND NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_ft_source
  ON financial_transactions (source_module, source_ref_id)
  WHERE source_module IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ft_date_status
  ON financial_transactions (organization_id, status, date DESC)
  WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_fth_horse
  ON financial_transaction_horses (horse_id);

CREATE INDEX IF NOT EXISTS idx_fc_org_type
  ON financial_categories (organization_id, type);

-- ────────────────────────────────────────────────────────────
-- 8. TRIGGERS: updated_at automático vía PostgreSQL
-- ────────────────────────────────────────────────────────────
-- Función genérica (puede ya existir en otras tablas)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ft_updated_at ON financial_transactions;
CREATE TRIGGER trg_ft_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_fcc_updated_at ON financial_cost_centers;
CREATE TRIGGER trg_fcc_updated_at
  BEFORE UPDATE ON financial_cost_centers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE financial_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_cost_centers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_audit_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transaction_horses ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento multi-tenant
CREATE POLICY "ft_isolation" ON financial_transactions
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

CREATE POLICY "fc_isolation" ON financial_categories
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

CREATE POLICY "fcc_isolation" ON financial_cost_centers
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

CREATE POLICY "fal_isolation" ON financial_audit_log
  USING (organization_id = ANY(get_user_orgs()));

CREATE POLICY "fth_isolation" ON financial_transaction_horses
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ────────────────────────────────────────────────────────────
-- 10. MIGRAR DATOS EXISTENTES DE expenses → financial_transactions
-- ────────────────────────────────────────────────────────────
-- NOTA: Esto migra los expenses existentes al libro mayor.
-- Después de verificar que todo esté bien, los expenses
-- pueden quedar como legacy sin borrarse.
INSERT INTO financial_transactions (
  organization_id, type, amount, currency, description,
  date, status, horse_id, source_module, source_ref_id,
  source_ref_type, created_at
)
SELECT
  e.organization_id,
  'expense',
  e.amount,
  'COP',
  e.category,
  COALESCE(e.date, CURRENT_DATE),
  'completed',
  e.horse_id,
  'legacy_expenses',
  e.id,
  'expense',
  COALESCE(e.created_at, NOW())
FROM expenses e
WHERE e.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM financial_transactions ft
    WHERE ft.source_ref_id = e.id AND ft.source_module = 'legacy_expenses'
  );

-- Migrar invoices de tipo Expense
INSERT INTO financial_transactions (
  organization_id, type, amount, currency, description,
  date, status, source_module, source_ref_id, source_ref_type,
  notes, created_at
)
SELECT
  i.organization_id,
  CASE WHEN i.type = 'Income' THEN 'income' ELSE 'expense' END,
  i.amount,
  COALESCE(i.currency, 'COP'),
  i.category,
  COALESCE(i.due_date::DATE, i.created_at::DATE, CURRENT_DATE),
  CASE
    WHEN i.status = 'Paid' THEN 'completed'
    WHEN i.status = 'Pending' THEN 'pending'
    ELSE 'completed'
  END,
  'legacy_invoices',
  i.id,
  'invoice',
  i.notes,
  COALESCE(i.created_at, NOW())
FROM invoices i
WHERE i.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM financial_transactions ft
    WHERE ft.source_ref_id = i.id AND ft.source_module = 'legacy_invoices'
  );

-- ────────────────────────────────────────────────────────────
-- 11. FUNCIÓN PARA SEMBRAR CATEGORÍAS POR ORGANIZACIÓN
-- Se invoca desde el frontend al primer acceso al módulo
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_financial_categories(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Solo sembrar si la org no tiene categorías aún
  IF EXISTS (SELECT 1 FROM financial_categories WHERE organization_id = p_org_id LIMIT 1) THEN
    RETURN;
  END IF;

  -- ── INGRESOS ────────────────────────────────────────────
  INSERT INTO financial_categories (organization_id, name, type, icon, color, sort_order, is_system)
  VALUES
    (p_org_id, 'Pensión / Alojamiento',      'income', '🏠', '#10B981', 1,  true),
    (p_org_id, 'Servicios Reproductivos',    'income', '🧬', '#8B5CF6', 2,  true),
    (p_org_id, 'Venta de Animales',          'income', '🐴', '#F59E0B', 3,  true),
    (p_org_id, 'Comisión de Venta',          'income', '💼', '#3B82F6', 4,  true),
    (p_org_id, 'Entrenamiento / Monta',      'income', '🎠', '#EC4899', 5,  true),
    (p_org_id, 'Competencias',               'income', '🏆', '#F97316', 6,  true),
    (p_org_id, 'Servicios Veterinarios',     'income', '🩺', '#06B6D4', 7,  true),
    (p_org_id, 'Otros Ingresos',             'income', '💰', '#6B7280', 99, true),

  -- ── GASTOS ──────────────────────────────────────────────
    (p_org_id, 'Alimentación',               'expense', '🌾', '#EF4444', 1,  true),
    (p_org_id, 'Veterinaria y Sanidad',      'expense', '🩺', '#F97316', 2,  true),
    (p_org_id, 'Herrería',                   'expense', '🔨', '#8B5CF6', 3,  true),
    (p_org_id, 'Odontología Equina',         'expense', '🦷', '#EC4899', 4,  true),
    (p_org_id, 'Reproducción',               'expense', '🧬', '#6366F1', 5,  true),
    (p_org_id, 'Competencias y Ferias',      'expense', '🏆', '#F59E0B', 6,  true),
    (p_org_id, 'Personal / Nómina',          'expense', '👥', '#10B981', 7,  true),
    (p_org_id, 'Mantenimiento',              'expense', '🔧', '#06B6D4', 8,  true),
    (p_org_id, 'Transporte',                 'expense', '🚚', '#3B82F6', 9,  true),
    (p_org_id, 'Servicios Públicos',         'expense', '💡', '#84CC16', 10, true),
    (p_org_id, 'Seguros',                    'expense', '🛡️', '#0EA5E9', 11, true),
    (p_org_id, 'Administración',             'expense', '📋', '#71717A', 12, true),
    (p_org_id, 'Medicamentos y Farmacia',    'expense', '💊', '#DC2626', 13, true),
    (p_org_id, 'Suplementos Nutricionales',  'expense', '🧪', '#D97706', 14, true),
    (p_org_id, 'Otros Gastos',               'expense', '📌', '#9CA3AF', 99, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- FIN DE LA MIGRACIÓN 017
-- ────────────────────────────────────────────────────────────
