-- ============================================================
-- GaitFlow ERP — Migration 035: Anticipos y Saldos a Favor de Clientes
-- Customer Advances & Pre-payments Management
-- ============================================================

-- ── 1. TABLA DE ANTICIPOS DE CLIENTES (CUSTOMER ADVANCES) ───────────────────
CREATE TABLE IF NOT EXISTS customer_advances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  amount            NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  balance_available NUMERIC(15,2) NOT NULL CHECK (balance_available >= 0),
  payment_method    TEXT DEFAULT 'bank_transfer',
  reference_number  TEXT,
  notes             TEXT,
  date              DATE DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_advance_balance CHECK (balance_available <= amount)
);

ALTER TABLE customer_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_advances_org_isolation" ON customer_advances
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 2. FUNCIÓN PARA APLICAR ANTICIPO COMO ABONO A FACTURA ────────────────────
CREATE OR REPLACE FUNCTION fn_apply_customer_advance_to_invoice(
  p_advance_id UUID,
  p_invoice_id UUID,
  p_amount     NUMERIC(15,2)
)
RETURNS UUID AS $$
DECLARE
  v_advance   RECORD;
  v_invoice   RECORD;
  v_payment_id UUID;
BEGIN
  -- 1. Validar anticipo
  SELECT * INTO v_advance FROM customer_advances WHERE id = p_advance_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anticipo no encontrado.';
  END IF;

  IF v_advance.balance_available < p_amount THEN
    RAISE EXCEPTION 'El anticipo sólo dispone de % COP disponibles para aplicar.', v_advance.balance_available;
  END IF;

  -- 2. Validar factura
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Factura no encontrada.';
  END IF;

  IF v_invoice.balance_due < p_amount THEN
    RAISE EXCEPTION 'El abono supera el saldo pendiente de la factura (% COP).', v_invoice.balance_due;
  END IF;

  -- 3. Descontar saldo del anticipo
  UPDATE customer_advances
  SET balance_available = balance_available - p_amount
  WHERE id = p_advance_id;

  -- 4. Registrar pago en la factura (disparará los triggers ACID contables)
  INSERT INTO invoice_payments (
    invoice_id,
    amount,
    payment_method,
    payment_date,
    notes
  ) VALUES (
    p_invoice_id,
    p_amount,
    'customer_advance',
    CURRENT_DATE,
    'Abono aplicado desde anticipo #' || SUBSTRING(p_advance_id::TEXT, 1, 8) || ' (' || COALESCE(v_advance.reference_number, 'N/A') || ')'
  ) RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
