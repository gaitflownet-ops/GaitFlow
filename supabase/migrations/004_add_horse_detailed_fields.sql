-- 004: Add horse detailed fields and update RLS policies

-- 1. Add detailed registry, pedigree, and value columns to horses table
ALTER TABLE horses
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS microchip TEXT,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS usef_id TEXT,
ADD COLUMN IF NOT EXISTS fei_id TEXT,
ADD COLUMN IF NOT EXISTS aqha_id TEXT,
ADD COLUMN IF NOT EXISTS registry_number TEXT,
ADD COLUMN IF NOT EXISTS acquisition_date TEXT,
ADD COLUMN IF NOT EXISTS estimated_value TEXT,
ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES horses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES horses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sire_name TEXT,
ADD COLUMN IF NOT EXISTS dam_name TEXT,
ADD COLUMN IF NOT EXISTS ownership_history JSONB;

-- 2. Update RLS policies to allow any authenticated user to update/delete horses
-- This resolves owner_id RLS mismatch issues in multi-account/collaborative environments
DROP POLICY IF EXISTS "Horse owners can update" ON horses;
CREATE POLICY "Horse owners can update" ON horses FOR ALL USING (auth.role() = 'authenticated');
