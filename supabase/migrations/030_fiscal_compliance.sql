-- ============================================================
-- GaitFlow ERP — Migration 030: Fiscal Compliance & Resolutions
-- Soporte para Resoluciones DIAN/SAT, Retenciones (ReteFuente/ICA/IVA)
-- y vinculación de facturas en Notas Crédito / Débito
-- ============================================================

-- ── 1. TABLA DE RESOLUCIONES DE FACTURACIÓN (DIAN / SAT / SRI) ─────────────
CREATE TABLE IF NOT EXISTS invoice_resolutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  resolution_number TEXT NOT NULL,
  prefix            TEXT DEFAULT 'FE',
  start_number      INTEGER NOT NULL DEFAULT 1,
  end_number        INTEGER NOT NULL DEFAULT 10000,
  current_number    INTEGER NOT NULL DEFAULT 1,
  valid_from        DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to          DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_res_org ON invoice_resolutions(organization_id);

ALTER TABLE invoice_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_res_org_isolation" ON invoice_resolutions
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));

-- ── 2. COLUMNAS DE CUMPLIMIENTO FISCAL EN TABLA INVOICES ───────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS resolution_id UUID REFERENCES invoice_resolutions(id),
  ADD COLUMN IF NOT EXISTS retention_rate NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS retention_amount NUMERIC(14,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES invoices(id),
  ADD COLUMN IF NOT EXISTS aiu_percentage NUMERIC(5,2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_invoices_parent ON invoices(parent_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_resolution ON invoices(resolution_id);
