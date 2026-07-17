-- ============================================================
-- GaitFlow ERP — Migration 019: Professional Invoicing System
-- Facturación electrónica, plantillas, ítems y cartera
-- ============================================================

-- ── 1. INVOICE TEMPLATES — Plantillas personalizables ────────────────────────

CREATE TABLE IF NOT EXISTS invoice_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Apariencia
  logo_url        TEXT,
  primary_color   TEXT DEFAULT '#111827',
  layout_style    TEXT DEFAULT 'modern' CHECK (layout_style IN ('modern', 'classic', 'minimal')),
  
  -- Textos predeterminados
  default_notes   TEXT,
  default_terms   TEXT,
  footer_text     TEXT,
  
  -- Info Fiscal de la empresa
  company_name    TEXT,
  tax_id          TEXT,       -- NIT / RUT
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_templates_org_isolation" ON invoice_templates
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 2. INVOICES — Cabecera de la factura ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id          UUID REFERENCES contacts(id) ON DELETE RESTRICT NOT NULL, -- El cliente
  
  invoice_number      TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft' 
                      CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'void')),
                      
  issue_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE NOT NULL,
  
  subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  total               NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_due         NUMERIC(14,2) NOT NULL DEFAULT 0,
  
  currency            TEXT DEFAULT 'COP',  -- COP o USD
  exchange_rate       NUMERIC(10,4),       -- Tasa de cambio si aplica
  
  notes               TEXT,
  terms               TEXT,
  
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar números de factura duplicados en la misma organización
  UNIQUE (organization_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON invoices (contact_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_org_isolation" ON invoices
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 3. INVOICE ITEMS — Líneas de detalle ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  product_name        TEXT NOT NULL,
  description         TEXT,
  quantity            NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price          NUMERIC(14,2) NOT NULL,
  tax_rate            NUMERIC(5,2) DEFAULT 0,
  
  total               NUMERIC(14,2) NOT NULL,
  
  horse_id            UUID REFERENCES horses(id) ON DELETE SET NULL, -- Si el cargo está vinculado a un caballo
  sort_order          INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON invoice_items (invoice_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
-- RLS: Se asume acceso si se tiene acceso a la factura (a través de la organización)
CREATE POLICY "invoice_items_org_isolation" ON invoice_items
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE organization_id = ANY(get_user_orgs()))
  )
  WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE organization_id = ANY(get_user_orgs()))
  );


-- ── 4. INVOICE PAYMENTS — Abonos y pagos parciales ───────────────────────────

CREATE TABLE IF NOT EXISTS invoice_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  transaction_id      UUID REFERENCES financial_transactions(id) ON DELETE RESTRICT, -- Opcional, pero recomendado para contabilidad
  
  amount_applied      NUMERIC(14,2) NOT NULL CHECK (amount_applied > 0),
  payment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method      TEXT,
  notes               TEXT,
  
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_inv ON invoice_payments (invoice_id);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_payments_org_isolation" ON invoice_payments
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE organization_id = ANY(get_user_orgs()))
  )
  WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE organization_id = ANY(get_user_orgs()))
  );


-- ── 5. TRIGGERS: Actualización automática de Saldos y Estados ────────────────

-- Función para actualizar el balance_due de la factura al recibir un pago
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_total_paid NUMERIC(14,2);
  v_invoice_total NUMERIC(14,2);
  v_new_status TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_invoice_id := NEW.invoice_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_invoice_id := NEW.invoice_id;
  END IF;

  -- Calcular total de pagos
  SELECT COALESCE(SUM(amount_applied), 0) INTO v_total_paid
  FROM invoice_payments
  WHERE invoice_id = v_invoice_id;

  -- Obtener total de la factura
  SELECT total INTO v_invoice_total
  FROM invoices
  WHERE id = v_invoice_id;

  -- Calcular nuevo estado
  IF v_total_paid >= v_invoice_total THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    -- No hay pagos. Verificar si está vencida
    IF (SELECT due_date FROM invoices WHERE id = v_invoice_id) < CURRENT_DATE THEN
      v_new_status := 'overdue';
    ELSE
      -- Dejar en sent o draft, tomamos 'sent' si ya no es draft
      SELECT CASE WHEN status = 'draft' THEN 'draft' ELSE 'sent' END INTO v_new_status
      FROM invoices WHERE id = v_invoice_id;
    END IF;
  END IF;

  -- Actualizar factura
  UPDATE invoices
  SET balance_due = v_invoice_total - v_total_paid,
      status = v_new_status,
      updated_at = NOW()
  WHERE id = v_invoice_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_balance ON invoice_payments;
CREATE TRIGGER trigger_update_invoice_balance
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_balance();
