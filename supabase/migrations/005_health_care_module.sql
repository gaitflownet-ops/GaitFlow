-- Migration: 005_health_care_module.sql
-- C.2 — Health & Care Module: Expand health_records + create pharmaceutical_inventory

-- ============================================================
-- 1. Extend health_records table
-- ============================================================
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS prescription TEXT;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS dose TEXT;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS frequency TEXT;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS product_used TEXT;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS product_quantity NUMERIC;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS cost NUMERIC;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none';
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS category TEXT;

-- ============================================================
-- 2. Create pharmaceutical_inventory table
-- ============================================================
CREATE TABLE IF NOT EXISTS pharmaceutical_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  manufacturer TEXT,
  unit TEXT DEFAULT 'doses',
  stock_quantity NUMERIC DEFAULT 0,
  min_stock_alert NUMERIC DEFAULT 5,
  cost_per_unit NUMERIC DEFAULT 0,
  expiry_date DATE,
  notes TEXT,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. RLS for pharmaceutical_inventory
-- ============================================================
ALTER TABLE pharmaceutical_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pharmaceuticals"
  ON pharmaceutical_inventory FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert pharmaceuticals"
  ON pharmaceutical_inventory FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pharmaceuticals"
  ON pharmaceutical_inventory FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pharmaceuticals"
  ON pharmaceutical_inventory FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. Update health_records RLS to allow edits and deletes
-- ============================================================
DO $$
BEGIN
  -- Drop existing restrictive policies if they exist, re-create permissive ones
  DROP POLICY IF EXISTS "Anyone can read health_records" ON health_records;
  DROP POLICY IF EXISTS "Authenticated users can insert health_records" ON health_records;
  DROP POLICY IF EXISTS "Authenticated users can update health_records" ON health_records;
  DROP POLICY IF EXISTS "Authenticated users can delete health_records" ON health_records;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

CREATE POLICY "Anyone can read health_records"
  ON health_records FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert health_records"
  ON health_records FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update health_records"
  ON health_records FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete health_records"
  ON health_records FOR DELETE
  USING (auth.uid() IS NOT NULL);
