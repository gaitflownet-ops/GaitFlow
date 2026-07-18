-- Create trigger to automatically sync invoices with financial_transactions
CREATE OR REPLACE FUNCTION sync_invoice_to_transaction()
RETURNS trigger AS $$
DECLARE
  v_tx_type text;
  v_status text;
BEGIN
  -- Determine type based on invoice document_type
  IF NEW.document_type = 'credit_note' THEN
    v_tx_type := 'expense';
  ELSE
    v_tx_type := 'income';
  END IF;

  -- Only track if it's not a draft
  IF NEW.status != 'draft' AND NEW.status != 'void' THEN
    -- If there's a pending amount (balance_due > 0), ensure there is a 'pending' transaction
    IF NEW.balance_due > 0 THEN
      -- Try to update existing pending transaction
      UPDATE financial_transactions 
      SET amount = NEW.balance_due,
          date = NEW.issue_date,
          contact_id = NEW.contact_id
      WHERE invoice_id = NEW.id AND status = 'pending';
      
      -- If none exists, create one
      IF NOT FOUND THEN
        INSERT INTO financial_transactions (
          organization_id, type, amount, currency, date, description, status, invoice_id, contact_id
        ) VALUES (
          NEW.organization_id, v_tx_type, NEW.balance_due, NEW.currency, NEW.issue_date, 'Factura ' || NEW.invoice_number, 'pending', NEW.id, NEW.contact_id
        );
      END IF;
    ELSE
      -- If balance_due is 0 (fully paid), remove any 'pending' transaction
      -- because payments are tracked separately
      UPDATE financial_transactions 
      SET status = 'cancelled', amount = 0 
      WHERE invoice_id = NEW.id AND status = 'pending';
    END IF;
  ELSE
    -- If it's draft or void, cancel any pending transaction
    UPDATE financial_transactions 
    SET status = 'cancelled', amount = 0 
    WHERE invoice_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invoice_change ON invoices;
CREATE TRIGGER on_invoice_change
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_to_transaction();


-- Create trigger to automatically insert a completed transaction for each payment
CREATE OR REPLACE FUNCTION sync_invoice_payment_to_transaction()
RETURNS trigger AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_tx_type text;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice FROM invoices WHERE id = NEW.invoice_id;
  
  IF v_invoice.document_type = 'credit_note' THEN
    v_tx_type := 'expense';
  ELSE
    v_tx_type := 'income';
  END IF;

  -- Insert a completed transaction for the payment amount
  INSERT INTO financial_transactions (
    organization_id, type, amount, currency, date, description, status, invoice_id, contact_id
  ) VALUES (
    v_invoice.organization_id, v_tx_type, NEW.amount_applied, v_invoice.currency, NEW.payment_date, 'Abono a Factura ' || COALESCE(v_invoice.invoice_number, 'borrador'), 'completed', NEW.invoice_id, v_invoice.contact_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invoice_payment_insert ON invoice_payments;
CREATE TRIGGER on_invoice_payment_insert
  AFTER INSERT ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_payment_to_transaction();
