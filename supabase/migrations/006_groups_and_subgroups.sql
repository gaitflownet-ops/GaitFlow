-- Migration: 006_groups_and_subgroups.sql
-- Create horse_groups and horse_subgroups tables, and add references in horses

-- 1. Create horse_groups table
CREATE TABLE IF NOT EXISTS horse_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create horse_subgroups table
CREATE TABLE IF NOT EXISTS horse_subgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES horse_groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add group and subgroup references to horses table
ALTER TABLE horses ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES horse_groups(id) ON DELETE SET NULL;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS subgroup_id UUID REFERENCES horse_subgroups(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE horse_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_subgroups ENABLE ROW LEVEL SECURITY;

-- 5. Policies for horse_groups
CREATE POLICY "Anyone can read horse_groups"
  ON horse_groups FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can perform all actions on horse_groups"
  ON horse_groups FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 6. Policies for horse_subgroups
CREATE POLICY "Anyone can read horse_subgroups"
  ON horse_subgroups FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can perform all actions on horse_subgroups"
  ON horse_subgroups FOR ALL
  USING (auth.uid() IS NOT NULL);
