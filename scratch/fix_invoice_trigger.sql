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
      -- because payments are tracked separately. We only set status to cancelled.
      UPDATE financial_transactions 
      SET status = 'cancelled'
      WHERE invoice_id = NEW.id AND status = 'pending';
    END IF;
  ELSE
    -- If it's draft or void, cancel any pending transaction
    UPDATE financial_transactions 
    SET status = 'cancelled'
    WHERE invoice_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
