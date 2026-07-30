-- ============================================================
-- GaitFlow ERP — Migration 036: Catálogo de Cuentas PUC / NIIF
-- Chart of Accounts & Double-Entry Journal (Debe / Haber)
-- ============================================================

-- ── 1. TABLA PLAN ÚNICO DE CUENTAS (CHART OF ACCOUNTS - PUC / NIIF) ──────────
CREATE TABLE IF NOT EXISTS financial_chart_of_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,          -- Código NIIF/PUC (e.g., '1110', '4135', '5105')
  name            TEXT NOT NULL,          -- Nombre de la cuenta (e.g., 'Bancos', 'Servicios Ecuestres', 'Nómina')
  account_type    TEXT NOT NULL CHECK (
    account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')
  ),
  is_active       BOOLEAN DEFAULT TRUE,
  parent_code     TEXT,                   -- Código padre en jerarquía NIIF
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_org_puc_code UNIQUE(organization_id, code)
);

ALTER TABLE financial_chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chart_of_accounts_org_isolation" ON financial_chart_of_accounts
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 2. TABLA LIBRO DIARIO DE PARTIDA DOBLE (JOURNAL ENTRIES - DEBE/HABER) ────
CREATE TABLE IF NOT EXISTS financial_journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_number    TEXT NOT NULL,          -- Comprobante diario (e.g., 'AS-2026-0001')
  entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  description     TEXT NOT NULL,
  reference_id    UUID,                   -- Factura, Pago o Transacción de origen
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE financial_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entries_org_isolation" ON financial_journal_entries
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 3. LÍNEAS DE ASIENTO CONTABLE (DEBIT / CREDIT - DEBE / HABER) ────────────
CREATE TABLE IF NOT EXISTS financial_journal_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES financial_journal_entries(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES financial_chart_of_accounts(id) ON DELETE RESTRICT,
  debit_amount     NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount    NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  description      TEXT,
  horse_id         UUID REFERENCES horses(id),
  cost_center_id   UUID REFERENCES financial_cost_centers(id),
  CONSTRAINT chk_debit_or_credit CHECK (debit_amount > 0 OR credit_amount > 0)
);

ALTER TABLE financial_journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_lines_org_isolation" ON financial_journal_lines
  USING (
    journal_entry_id IN (
      SELECT id FROM financial_journal_entries WHERE organization_id = ANY(get_user_orgs())
    )
  )
  WITH CHECK (
    journal_entry_id IN (
      SELECT id FROM financial_journal_entries WHERE organization_id = ANY(get_user_orgs())
    )
  );


-- ── 4. DATOS SEMILLA (CATÁLOGO NIIF / PUC BÁSICO PARA CRIADEROS) ─────────────
INSERT INTO financial_chart_of_accounts (organization_id, code, name, account_type)
SELECT 
  id AS organization_id,
  code,
  name,
  account_type
FROM organizations
CROSS JOIN (
  VALUES 
    ('1110', 'Bancos y Caja (Activo Corriente)', 'asset'),
    ('1305', 'Cuentas por Cobrar Clientes (Cartera)', 'asset'),
    ('1410', 'Inventario Biológico - Caballos (NIIF 41)', 'asset'),
    ('2205', 'Proveedores Nacionales e Importaciones', 'liability'),
    ('2408', 'Impuesto sobre las Ventas por Pagar (IVA)', 'liability'),
    ('3105', 'Capital Social y Aportes del Criadero', 'equity'),
    ('4135', 'Ingresos por Servicios Ecuestres y Saltos', 'revenue'),
    ('5105', 'Gastos Operativos - Nómina y Personal', 'expense'),
    ('5110', 'Gastos Operativos - Alimentación y Forraje', 'expense'),
    ('5115', 'Gastos Operativos - Veterinaria y Reproducción', 'expense')
) AS default_puc(code, name, account_type)
ON CONFLICT (organization_id, code) DO NOTHING;
