-- Migration 032: Marketplace Luxury Update

-- 1. Add birth_date to horses for dynamic age calculation (months/years)
ALTER TABLE horses
  ADD COLUMN IF NOT EXISTS birth_date date;

-- 2. Add promotions and pricing structure to listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS original_price numeric(15,2),
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false;

-- 3. Update defaults for currency to COP
ALTER TABLE listings 
  ALTER COLUMN currency SET DEFAULT 'COP';

ALTER TABLE sale_closings
  ALTER COLUMN currency SET DEFAULT 'COP';

-- 4. Add inquiry subtypes and status extensions
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS target_price numeric(15,2),
  ADD COLUMN IF NOT EXISTS target_currency varchar(3) DEFAULT 'COP';
