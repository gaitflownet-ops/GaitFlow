-- Fix the ignored columns from 019 because tables already existed

-- Añadir columnas a invoices si no existen
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,4);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms TEXT;

-- Añadir columnas a invoice_items si no existen
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount_pct NUMERIC(5,2) DEFAULT 0;
