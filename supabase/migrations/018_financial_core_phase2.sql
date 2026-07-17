-- ============================================================
-- GaitFlow ERP — Migration 018: Financial Core Phase 2
-- Motor de Automatizaciones + Núcleo Financiero Completo
-- ============================================================

-- ── 1. FINANCIAL ACCOUNTS — Cuentas financieras ──────────────────────────────

CREATE TABLE IF NOT EXISTS financial_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'cash'
                  CHECK (type IN ('cash','bank','digital_wallet','credit','investment','other')),
  currency        TEXT NOT NULL DEFAULT 'COP',
  bank_name       TEXT,
  account_number  TEXT,               -- últimos 4 dígitos solamente
  is_default      BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  initial_balance NUMERIC(14,2) DEFAULT 0 CHECK (initial_balance >= 0),
  icon            TEXT DEFAULT '🏦',
  color           TEXT DEFAULT '#6366F1',
  notes           TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Solo puede haber una cuenta default por organización
CREATE UNIQUE INDEX IF NOT EXISTS idx_fa_one_default
  ON financial_accounts (organization_id)
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_fa_org ON financial_accounts (organization_id);

ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fa_org_isolation" ON financial_accounts
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_financial_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fa_updated_at
  BEFORE UPDATE ON financial_accounts
  FOR EACH ROW EXECUTE FUNCTION update_financial_accounts_updated_at();

-- ── 2. FINANCIAL PAYMENT METHODS — Métodos de pago configurables ──────────────

CREATE TABLE IF NOT EXISTS financial_payment_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'cash'
                  CHECK (type IN ('cash','bank_transfer','card','check','digital_wallet','crypto','other')),
  account_id      UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  icon            TEXT DEFAULT '💳',
  is_active       BOOLEAN DEFAULT TRUE,
  is_system       BOOLEAN DEFAULT FALSE,   -- los predefinidos no se pueden borrar
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fpm_org ON financial_payment_methods (organization_id);

ALTER TABLE financial_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fpm_org_isolation" ON financial_payment_methods
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

CREATE OR REPLACE FUNCTION update_financial_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fpm_updated_at
  BEFORE UPDATE ON financial_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_financial_payment_methods_updated_at();

-- ── 3. AUTOMATION RULES — Motor de automatizaciones cross-módulo ──────────────
-- No se llama "financial_rules" porque en el futuro manejará CRM, Vault,
-- Marketplace, Notificaciones, Tasks, Emails y más.

CREATE TABLE IF NOT EXISTS automation_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  is_enabled          BOOLEAN DEFAULT TRUE,
  is_system           BOOLEAN DEFAULT FALSE,  -- predefinidas: se pueden desactivar pero no borrar
  priority            INTEGER DEFAULT 0,       -- orden de ejecución cuando múltiples reglas aplican

  -- ── TRIGGER: ¿cuándo se activa? ──────────────────────────────────────────
  trigger_module      TEXT NOT NULL,
  -- 'health' | 'nutrition' | 'marketplace' | 'breeding' | 'competitions'
  -- | 'locations' | 'crm' | 'vault' | 'tasks' | 'financial'
  trigger_event       TEXT NOT NULL,
  -- 'create' | 'update' | 'complete' | 'cancel' | 'status_change' | 'payment_received'
  trigger_conditions  JSONB DEFAULT '{}',
  -- Ejemplos:
  -- { "field": "cost", "operator": "gt", "value": 0 }      → solo si hay costo
  -- { "field": "status", "operator": "eq", "value": "sold" } → solo si venta completada
  -- {}  → siempre aplica

  -- ── ACTION: ¿qué hace? ────────────────────────────────────────────────────
  action_type         TEXT NOT NULL,
  -- 'create_transaction' | 'create_invoice' | 'send_notification'
  -- | 'create_task' | 'create_activity' | 'update_contact' | 'trigger_webhook'
  action_config       JSONB NOT NULL DEFAULT '{}',
  -- Para 'create_transaction':
  -- { "type": "expense", "category_id": "uuid", "cost_center_id": "uuid",
  --   "account_id": "uuid", "description_template": "Consulta — {{horse_name}}",
  --   "amount_source": "from_record", "amount_field": "cost",
  --   "status": "completed", "currency": "COP" }
  --
  -- Para 'send_notification':
  -- { "title_template": "Gasto registrado", "body_template": "${{amount}} — {{description}}", "kind": "financial" }
  --
  -- Para 'create_task':
  -- { "title_template": "Revisar {{horse_name}} post-consulta", "priority": "medium", "due_days": 3 }

  -- ── Métricas de ejecución ─────────────────────────────────────────────────
  execution_count     INTEGER DEFAULT 0,
  last_executed_at    TIMESTAMPTZ,
  last_error          TEXT,               -- último error si hubo fallo

  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_org ON automation_rules (organization_id);
CREATE INDEX IF NOT EXISTS idx_ar_trigger ON automation_rules (trigger_module, trigger_event);
CREATE INDEX IF NOT EXISTS idx_ar_enabled ON automation_rules (organization_id, is_enabled) WHERE is_enabled = TRUE;

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar_org_isolation" ON automation_rules
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ar_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_automation_rules_updated_at();

-- ── 4. FINANCIAL SETTINGS — Configuración financiera por organización ─────────

CREATE TABLE IF NOT EXISTS financial_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Moneda
  default_currency        TEXT NOT NULL DEFAULT 'COP',
  supported_currencies    TEXT[] DEFAULT ARRAY['COP'],

  -- Numeración de facturas
  invoice_prefix          TEXT DEFAULT 'GF',
  invoice_sequence        INTEGER DEFAULT 1,

  -- Impuestos
  default_tax_rate        NUMERIC(5,2) DEFAULT 0,
  tax_name                TEXT DEFAULT 'IVA',
  tax_included_in_price   BOOLEAN DEFAULT FALSE,

  -- Datos fiscales / tributarios (NIT, razón social, régimen, etc.)
  fiscal_info             JSONB DEFAULT '{}',
  -- Ejemplo: { "nit": "900123456-7", "razon_social": "Hacienda El Nogal S.A.S",
  --            "regimen": "responsable_iva", "direccion": "...", "ciudad": "Medellín" }

  -- Configuración regional
  regional_settings       JSONB DEFAULT '{"date_format":"DD/MM/YYYY","thousands_separator":".","decimal_separator":","}',

  -- Año fiscal
  fiscal_year_start       TEXT DEFAULT '01-01',   -- MM-DD

  -- Recordatorios de pago (días antes del vencimiento)
  payment_reminder_days   INTEGER[] DEFAULT ARRAY[3, 7, 15],

  -- Dashboard configurable (qué KPIs mostrar y en qué orden)
  dashboard_config        JSONB DEFAULT '{"kpis":["income_month","expense_month","balance","pending","overdue","total_transactions"],"chart_months":6,"show_cost_centers":true}',

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fs_org ON financial_settings (organization_id);

ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fs_org_isolation" ON financial_settings
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

CREATE OR REPLACE FUNCTION update_financial_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fs_updated_at
  BEFORE UPDATE ON financial_settings
  FOR EACH ROW EXECUTE FUNCTION update_financial_settings_updated_at();

-- ── 5. BUDGETS — Arquitectura de presupuestos (sin UI en Fase 2) ──────────────

CREATE TABLE IF NOT EXISTS budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'monthly'
                  CHECK (type IN ('monthly','quarterly','annual','custom')),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('draft','active','closed','archived')),
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id       UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  category_id     UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  cost_center_id  UUID REFERENCES financial_cost_centers(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount          NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
  -- El monto ejecutado se calcula dinámicamente desde financial_transactions
  -- Nunca se almacena el ejecutado (única fuente de verdad = transacciones)
);

CREATE INDEX IF NOT EXISTS idx_budgets_org ON budgets (organization_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items (budget_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_org_isolation" ON budgets
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_items_org_isolation" ON budget_items
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ── 6. RECURRING TRANSACTIONS — Transacciones recurrentes (arquitectura) ──────

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  category_id     UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  cost_center_id  UUID REFERENCES financial_cost_centers(id) ON DELETE SET NULL,
  account_id      UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'COP',
  payment_method  TEXT,

  -- Recurrencia
  frequency       TEXT NOT NULL DEFAULT 'monthly'
                  CHECK (frequency IN ('daily','weekly','biweekly','monthly','quarterly','annual')),
  start_date      DATE NOT NULL,
  end_date        DATE,                   -- NULL = sin fin
  next_due_date   DATE,
  last_executed   DATE,
  execution_count INTEGER DEFAULT 0,

  is_active       BOOLEAN DEFAULT TRUE,
  auto_create     BOOLEAN DEFAULT TRUE,   -- crear automáticamente o solo recordatorio
  tags            TEXT[],
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rt_org ON recurring_transactions (organization_id);
CREATE INDEX IF NOT EXISTS idx_rt_next_due ON recurring_transactions (next_due_date) WHERE is_active = TRUE;

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rt_org_isolation" ON recurring_transactions
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ── 7. FINANCIAL ASSETS — Activos (arquitectura para crecimiento) ─────────────

CREATE TABLE IF NOT EXISTS financial_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT 'equipment'
                      CHECK (category IN ('machinery','vehicle','trailer','equipment','infrastructure','livestock','other')),
  description         TEXT,
  purchase_date       DATE,
  purchase_value      NUMERIC(14,2),
  current_value       NUMERIC(14,2),      -- valor actual (ajustado por depreciación)
  depreciation_rate   NUMERIC(5,2),       -- % anual de depreciación
  depreciation_method TEXT DEFAULT 'straight_line'
                      CHECK (depreciation_method IN ('straight_line','declining_balance','none')),
  serial_number       TEXT,
  location            TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','maintenance','disposed','sold')),
  insurance_info      JSONB DEFAULT '{}',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fassets_org ON financial_assets (organization_id);

ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fassets_org_isolation" ON financial_assets
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ── 8. FINANCIAL LIABILITIES — Pasivos (arquitectura para crecimiento) ────────

CREATE TABLE IF NOT EXISTS financial_liabilities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT 'loan'
                      CHECK (category IN ('loan','credit_line','leasing','mortgage','supplier_credit','other')),
  description         TEXT,
  creditor_name       TEXT,
  creditor_contact    TEXT,
  original_amount     NUMERIC(14,2) NOT NULL,
  current_balance     NUMERIC(14,2),      -- saldo pendiente
  interest_rate       NUMERIC(5,2),       -- % anual
  start_date          DATE,
  due_date            DATE,
  monthly_payment     NUMERIC(14,2),
  payment_day         INTEGER,            -- día del mes en que vence el pago
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paid_off','defaulted','restructured')),
  collateral          TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fliab_org ON financial_liabilities (organization_id);

ALTER TABLE financial_liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fliab_org_isolation" ON financial_liabilities
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ── 9. ALTER TABLE contacts — Actores financieros ────────────────────────────

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS financial_roles  TEXT[] DEFAULT '{}',
  -- 'cliente' | 'proveedor' | 'veterinario' | 'herrero'
  -- | 'laboratorio' | 'transportador' | 'empleado' | 'contador'
  ADD COLUMN IF NOT EXISTS tax_id           TEXT,        -- NIT o cédula tributaria
  ADD COLUMN IF NOT EXISTS payment_terms    INTEGER DEFAULT 30,  -- días de plazo
  ADD COLUMN IF NOT EXISTS credit_limit     NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS bank_info        JSONB DEFAULT '{}';
  -- { "bank": "Bancolombia", "account_type": "corriente",
  --   "account_number": "****1234", "account_holder": "..." }

-- ── 10. ALTER TABLE financial_transactions — Vincular a cuentas ───────────────

ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS account_id         UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method_id  UUID REFERENCES financial_payment_methods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ft_account ON financial_transactions (account_id) WHERE account_id IS NOT NULL;

-- ── 11. SEED — Centros de costo del sistema ──────────────────────────────────
-- Función para sembrar centros de costo predefinidos por organización

CREATE OR REPLACE FUNCTION seed_financial_cost_centers(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM financial_cost_centers
  WHERE organization_id = p_org_id;

  IF existing_count > 0 THEN RETURN; END IF;

  INSERT INTO financial_cost_centers (organization_id, name, description, type, sort_order, is_active) VALUES
    (p_org_id, 'Administración General', 'Gastos administrativos y operativos generales', 'admin', 1, true),
    (p_org_id, 'Reproducción', 'Montas, inseminaciones, gestaciones y genética', 'breeding', 2, true),
    (p_org_id, 'Entrenamiento', 'Entrenadores, pistas y preparación deportiva', 'training', 3, true),
    (p_org_id, 'Competencias y Ferias', 'Inscripciones, viajes y participación en eventos', 'competitions', 4, true),
    (p_org_id, 'Alimentación y Nutrición', 'Alimentos, suplementos y planes nutricionales', 'general', 5, true),
    (p_org_id, 'Veterinaria y Sanidad', 'Consultas, medicamentos y salud animal', 'general', 6, true),
    (p_org_id, 'Mantenimiento e Infraestructura', 'Instalaciones, equipos y mejoras físicas', 'maintenance', 7, true),
    (p_org_id, 'Marketing y Ventas', 'Publicidad, marketplace y promoción', 'marketing', 8, true);
END;
$$ LANGUAGE plpgsql;

-- ── 12. SEED — Cuentas financieras predefinidas por organización ──────────────

CREATE OR REPLACE FUNCTION seed_financial_accounts(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM financial_accounts
  WHERE organization_id = p_org_id;

  IF existing_count > 0 THEN RETURN; END IF;

  INSERT INTO financial_accounts (organization_id, name, type, currency, icon, color, is_default, sort_order) VALUES
    (p_org_id, 'Caja General',   'cash',           'COP', '💵', '#10B981', TRUE,  1),
    (p_org_id, 'Caja Menor',     'cash',           'COP', '💰', '#F59E0B', FALSE, 2),
    (p_org_id, 'Bancolombia',    'bank',           'COP', '🏦', '#FCD116', FALSE, 3),
    (p_org_id, 'Davivienda',     'bank',           'COP', '🏦', '#EF4444', FALSE, 4),
    (p_org_id, 'Nequi',          'digital_wallet', 'COP', '📱', '#8B5CF6', FALSE, 5);
END;
$$ LANGUAGE plpgsql;

-- ── 13. SEED — Métodos de pago predefinidos por organización ─────────────────

CREATE OR REPLACE FUNCTION seed_financial_payment_methods(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM financial_payment_methods
  WHERE organization_id = p_org_id;

  IF existing_count > 0 THEN RETURN; END IF;

  INSERT INTO financial_payment_methods (organization_id, name, type, icon, is_system, sort_order) VALUES
    (p_org_id, 'Efectivo',                 'cash',           '💵', TRUE, 1),
    (p_org_id, 'Transferencia Bancaria',   'bank_transfer',  '🏦', TRUE, 2),
    (p_org_id, 'Tarjeta Débito/Crédito',   'card',           '💳', TRUE, 3),
    (p_org_id, 'Nequi',                    'digital_wallet', '📱', TRUE, 4),
    (p_org_id, 'Daviplata',                'digital_wallet', '📲', TRUE, 5),
    (p_org_id, 'Cheque',                   'check',          '📄', TRUE, 6),
    (p_org_id, 'Otro',                     'other',          '💱', TRUE, 99);
END;
$$ LANGUAGE plpgsql;

-- ── 14. SEED — Reglas de automatización del sistema ──────────────────────────

CREATE OR REPLACE FUNCTION seed_automation_rules(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  existing_count INTEGER;
  vet_cat_id UUID;
  food_cat_id UUID;
  repro_cat_id UUID;
  comp_cat_id UUID;
  sale_cat_id UUID;
  pension_cat_id UUID;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM automation_rules
  WHERE organization_id = p_org_id AND is_system = TRUE;

  IF existing_count > 0 THEN RETURN; END IF;

  -- Obtener IDs de categorías del sistema
  SELECT id INTO vet_cat_id    FROM financial_categories WHERE organization_id = p_org_id AND name = 'Veterinaria y Sanidad' LIMIT 1;
  SELECT id INTO food_cat_id   FROM financial_categories WHERE organization_id = p_org_id AND name = 'Alimentación' LIMIT 1;
  SELECT id INTO repro_cat_id  FROM financial_categories WHERE organization_id = p_org_id AND name = 'Servicios Reproductivos' LIMIT 1;
  SELECT id INTO comp_cat_id   FROM financial_categories WHERE organization_id = p_org_id AND name = 'Competencias y Ferias' LIMIT 1;
  SELECT id INTO sale_cat_id   FROM financial_categories WHERE organization_id = p_org_id AND name = 'Venta de Animales' LIMIT 1;
  SELECT id INTO pension_cat_id FROM financial_categories WHERE organization_id = p_org_id AND name = 'Pensión / Alojamiento' LIMIT 1;

  INSERT INTO automation_rules
    (organization_id, name, description, is_enabled, is_system,
     trigger_module, trigger_event, trigger_conditions,
     action_type, action_config, priority)
  VALUES
  -- Regla 1: Consulta veterinaria → gasto
  (p_org_id,
   'Gasto Veterinario Automático',
   'Al registrar una consulta o procedimiento veterinario, genera automáticamente el gasto correspondiente en el Centro Financiero.',
   TRUE, TRUE,
   'health', 'create', '{"field":"cost","operator":"gt","value":0}',
   'create_transaction',
   jsonb_build_object(
     'type', 'expense',
     'category_id', vet_cat_id,
     'description_template', 'Atención veterinaria — {{horse_name}}',
     'amount_source', 'from_record',
     'amount_field', 'cost',
     'status', 'completed',
     'currency', 'COP'
   ),
   10),

  -- Regla 2: Entrega de alimento → gasto
  (p_org_id,
   'Gasto de Alimentación Automático',
   'Al confirmar una entrega de alimento o suplemento, registra automáticamente el gasto en Alimentación.',
   TRUE, TRUE,
   'nutrition', 'delivery_confirmed', '{}',
   'create_transaction',
   jsonb_build_object(
     'type', 'expense',
     'category_id', food_cat_id,
     'description_template', 'Suministro de alimento — {{horse_name}}',
     'amount_source', 'from_record',
     'amount_field', 'total_cost',
     'status', 'completed',
     'currency', 'COP'
   ),
   10),

  -- Regla 3: Venta en Marketplace → ingreso
  (p_org_id,
   'Ingreso por Venta en Marketplace',
   'Cuando una venta en el Marketplace es marcada como completada, registra automáticamente el ingreso.',
   TRUE, TRUE,
   'marketplace', 'sale_complete', '{}',
   'create_transaction',
   jsonb_build_object(
     'type', 'income',
     'category_id', sale_cat_id,
     'description_template', 'Venta — {{horse_name}}',
     'amount_source', 'from_record',
     'amount_field', 'price',
     'status', 'pending',
     'currency', 'COP'
   ),
   10),

  -- Regla 4: Servicio reproductivo → ingreso
  (p_org_id,
   'Ingreso por Servicio Reproductivo',
   'Al confirmar una monta o servicio de reproducción, genera el ingreso correspondiente.',
   TRUE, TRUE,
   'breeding', 'service_confirmed', '{}',
   'create_transaction',
   jsonb_build_object(
     'type', 'income',
     'category_id', repro_cat_id,
     'description_template', 'Servicio reproductivo — {{horse_name}}',
     'amount_source', 'from_record',
     'amount_field', 'service_cost',
     'status', 'pending',
     'currency', 'COP'
   ),
   10),

  -- Regla 5: Inscripción a competencia → gasto
  (p_org_id,
   'Gasto de Inscripción a Competencia',
   'Al registrar la inscripción de un ejemplar a una competencia o feria, crea el gasto correspondiente.',
   TRUE, TRUE,
   'competitions', 'registration_created', '{"field":"prize","operator":"exists"}',
   'create_transaction',
   jsonb_build_object(
     'type', 'expense',
     'category_id', comp_cat_id,
     'description_template', 'Inscripción competencia — {{horse_name}} · {{event}}',
     'amount_source', 'fixed',
     'amount_fixed', 0,
     'status', 'pending',
     'currency', 'COP'
   ),
   10);

EXCEPTION WHEN OTHERS THEN
  -- No fallar si las categorías no existen aún
  RAISE NOTICE 'seed_automation_rules: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ── 15. SEED — Configuración financiera inicial ───────────────────────────────

CREATE OR REPLACE FUNCTION seed_financial_settings(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM financial_settings
  WHERE organization_id = p_org_id;

  IF existing_count > 0 THEN RETURN; END IF;

  INSERT INTO financial_settings (organization_id) VALUES (p_org_id);
END;
$$ LANGUAGE plpgsql;

-- ── 16. FUNCIÓN MAESTRA — Inicializar Fase 2 para una organización ────────────

CREATE OR REPLACE FUNCTION init_financial_core_phase2(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM seed_financial_accounts(p_org_id);
  PERFORM seed_financial_payment_methods(p_org_id);
  PERFORM seed_financial_cost_centers(p_org_id);
  PERFORM seed_financial_categories(p_org_id);   -- ya existe de la migración 017
  PERFORM seed_automation_rules(p_org_id);
  PERFORM seed_financial_settings(p_org_id);
END;
$$ LANGUAGE plpgsql;

-- ── 17. EJECUTAR SEED para organizaciones existentes ─────────────────────────

DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    PERFORM init_financial_core_phase2(org.id);
  END LOOP;
END;
$$;

-- ── 18. ÍNDICES ADICIONALES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contacts_financial_roles ON contacts USING GIN (financial_roles);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets (organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_rt_active ON recurring_transactions (organization_id, next_due_date) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_assets_org ON financial_assets (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_liab_org ON financial_liabilities (organization_id, status);

-- ── FIN DE MIGRACIÓN ─────────────────────────────────────────────────────────
-- Tablas creadas: financial_accounts, financial_payment_methods, automation_rules,
--                 financial_settings, budgets, budget_items, recurring_transactions,
--                 financial_assets, financial_liabilities
-- Tablas alteradas: contacts, financial_transactions
-- Funciones: seed_financial_accounts, seed_financial_payment_methods,
--            seed_financial_cost_centers, seed_automation_rules,
--            seed_financial_settings, init_financial_core_phase2
