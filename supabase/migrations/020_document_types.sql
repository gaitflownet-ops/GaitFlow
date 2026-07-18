-- ============================================================
-- GaitFlow ERP — Migration 020: Document Types & Template Fields
-- Añade tipo de documento a facturas y campos extendidos a plantillas
-- ============================================================

-- Añadir tipo de documento a la tabla invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'invoice'
  CHECK (document_type IN ('invoice', 'debit_note', 'credit_note', 'quote'));

-- Añadir condición de pago
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_condition TEXT DEFAULT 'immediate'
  CHECK (payment_condition IN ('immediate', '15_days', '30_days', '60_days', 'custom'));

-- Extender plantilla de factura con campos adicionales
ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS tax_regime TEXT DEFAULT 'no_vat_responsible';
ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'GF';
ALTER TABLE invoice_templates ADD COLUMN IF NOT EXISTS legal_text TEXT;
