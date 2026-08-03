-- ============================================================
-- GaitFlow ERP — Migration 029: Financial Integrity & ACID Triggers
-- Resuelve hallazgos [ARQ-001], [SEC-001], [SEC-002] de Auditoría Enterprise
-- ============================================================

-- ── 1. TABLA DE PERÍODOS CONTABLES (FISCAL PERIOD LOCKS) ────────────────────
CREATE TABLE IF NOT EXISTS financial_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  is_closed       BOOLEAN DEFAULT FALSE,
  closed_by       UUID REFERENCES auth.users(id),
  closed_at       TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_fp_org_ym ON financial_periods(organization_id, year, month);

ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_org_isolation" ON financial_periods
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 2. TRIGGER DE BLOQUEO FISCAL EN LIBRO MAYOR ([SEC-001] & [SEC-002]) ────────
CREATE OR REPLACE FUNCTION trg_check_fiscal_period_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_date DATE;
  v_org_id UUID;
  v_year INT;
  v_month INT;
  v_closed BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_date := OLD.date;
    v_org_id := OLD.organization_id;
    
    -- [SEC-002]: No se pueden eliminar transacciones conciliadas (reconciled)
    IF OLD.status = 'reconciled' THEN
      RAISE EXCEPTION 'EXCEPCIÓN CONTABLE [SEC-002]: No se puede eliminar una transacción conciliada (ID: %). Debe emitirse un asiento de reversión o nota crédito.', OLD.id;
    END IF;
  ELSE
    v_date := NEW.date;
    v_org_id := NEW.organization_id;
  END IF;

  v_year := EXTRACT(YEAR FROM v_date);
  v_month := EXTRACT(MONTH FROM v_date);

  SELECT is_closed INTO v_closed
  FROM financial_periods
  WHERE organization_id = v_org_id
    AND year = v_year
    AND month = v_month
  LIMIT 1;

  IF v_closed = TRUE THEN
    RAISE EXCEPTION 'EXCEPCIÓN FISCAL [SEC-001]: El período contable (%/%) se encuentra CERRADO por auditoría para la organización. No se permiten mutaciones ni borrados en este período.', v_month, v_year;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_fiscal_period_lock ON financial_transactions;
CREATE TRIGGER trg_enforce_fiscal_period_lock
  BEFORE INSERT OR UPDATE OR DELETE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION trg_check_fiscal_period_lock();


-- ── 3. TRIGGER ACID DE ABONOS A FACTURA ([ARQ-001]) ──────────────────────────
-- Inserta atómicamente la transacción en el libro mayor sin depender del frontend
CREATE OR REPLACE FUNCTION trg_invoice_payment_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice RECORD;
  v_default_account_id UUID;
  v_trans_type TEXT;
  v_exists UUID;
BEGIN
  -- Verificar que la factura existe y traer detalles
  SELECT organization_id, document_type, contact_id, cost_center_id, invoice_number
  INTO v_invoice
  FROM invoices
  WHERE id = NEW.invoice_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Evitar duplicidad si ya existe una transacción ligada a este invoice_payment
  SELECT id INTO v_exists
  FROM financial_transactions
  WHERE source_ref_id = NEW.id
    AND source_ref_type = 'invoice_payment'
  LIMIT 1;

  IF v_exists IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener cuenta bancaria/caja default
  SELECT id INTO v_default_account_id
  FROM financial_accounts
  WHERE organization_id = v_invoice.organization_id
    AND is_default = TRUE
    AND is_active = TRUE
  LIMIT 1;

  -- Tipo de movimiento: Facturas y Notas Débito son ingresos; Notas Crédito son egresos
  IF v_invoice.document_type IN ('invoice', 'debit_note') THEN
    v_trans_type := 'income';
  ELSE
    v_trans_type := 'expense';
  END IF;

  INSERT INTO financial_transactions (
    organization_id,
    type,
    account_id,
    cost_center_id,
    amount,
    currency,
    description,
    date,
    status,
    contact_id,
    invoice_id,
    source_module,
    source_ref_id,
    source_ref_type
  ) VALUES (
    v_invoice.organization_id,
    v_trans_type,
    v_default_account_id,
    v_invoice.cost_center_id,
    NEW.amount_applied,
    'COP',
    'Pago / Abono automático a factura ' || v_invoice.invoice_number,
    NEW.payment_date,
    'completed',
    v_invoice.contact_id,
    NEW.invoice_id,
    'invoicing',
    NEW.id,
    'invoice_payment'
  );

  -- Notificar evento en system_events_queue (Event Bus)
  INSERT INTO system_events_queue (
    organization_id,
    module,
    event_name,
    payload,
    status
  ) VALUES (
    v_invoice.organization_id,
    'financial',
    'invoice.payment.applied',
    jsonb_build_object(
      'invoice_id', NEW.invoice_id,
      'invoice_number', v_invoice.invoice_number,
      'amount', NEW.amount_applied,
      'payment_id', NEW.id
    ),
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_invoice_payment_insert ON invoice_payments;
CREATE TRIGGER trg_invoice_payment_insert
  AFTER INSERT ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION trg_invoice_payment_to_ledger();
