-- =============================================================================
-- GaitFlow — Section I: Breeding Full Schema (ADD COLUMNS ONLY — safe upgrade)
-- Works on top of existing tables from 007_enterprise_saas_schema.sql
--
-- Existing columns kept as-is:
--   breeding_cycles:     id, mare_id, stallion_id, method, date, status, organization_id, created_at, updated_at
--   genetics_inventory:  id, material_type, source, expiration_date, owner_id, organization_id, created_at, updated_at
-- =============================================================================

-- ── Step 1: Extend breeding_cycles with full I.1 fields ───────────────────────

ALTER TABLE breeding_cycles
  ADD COLUMN IF NOT EXISTS stallion_name       TEXT,
  ADD COLUMN IF NOT EXISTS stallion_registry   TEXT,
  ADD COLUMN IF NOT EXISTS insemination_date   DATE,
  ADD COLUMN IF NOT EXISTS genetic_material_id UUID REFERENCES genetics_inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vet_name            TEXT,
  ADD COLUMN IF NOT EXISTS pregnancy_confirmed BOOLEAN,
  ADD COLUMN IF NOT EXISTS diagnosis_date      DATE,
  ADD COLUMN IF NOT EXISTS diagnosis_notes     TEXT,
  ADD COLUMN IF NOT EXISTS pregnancy_status    TEXT,
  ADD COLUMN IF NOT EXISTS expected_foaling_date DATE,
  ADD COLUMN IF NOT EXISTS actual_foaling_date   DATE,
  ADD COLUMN IF NOT EXISTS foal_id             UUID REFERENCES horses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cycle_outcome_score NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS notes               TEXT;

-- Back-fill insemination_date from the old 'date' column where null
UPDATE breeding_cycles
  SET insemination_date = date
  WHERE insemination_date IS NULL AND date IS NOT NULL;

-- Back-fill stallion_name from old stallion_id (text) where null
UPDATE breeding_cycles
  SET stallion_name = stallion_id
  WHERE stallion_name IS NULL AND stallion_id IS NOT NULL;

-- Back-fill pregnancy_status from old 'status' where null
UPDATE breeding_cycles
  SET pregnancy_status = CASE status
    WHEN 'Pregnant' THEN 'Confirmed'
    WHEN 'Open'     THEN 'Open'
    ELSE 'Pending'
  END
  WHERE pregnancy_status IS NULL;

-- ── Step 2: Extend genetics_inventory with full I.2 fields ───────────────────

ALTER TABLE genetics_inventory
  ADD COLUMN IF NOT EXISTS unique_code       TEXT,
  ADD COLUMN IF NOT EXISTS donor_name        TEXT,
  ADD COLUMN IF NOT EXISTS donor_registry    TEXT,
  ADD COLUMN IF NOT EXISTS dam_name          TEXT,
  ADD COLUMN IF NOT EXISTS production_date   DATE,
  ADD COLUMN IF NOT EXISTS acquisition_date  DATE,
  ADD COLUMN IF NOT EXISTS supplier_name     TEXT,
  ADD COLUMN IF NOT EXISTS supplier_contact  TEXT,
  ADD COLUMN IF NOT EXISTS cost_usd          NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS storage_temp      TEXT,
  ADD COLUMN IF NOT EXISTS storage_location  TEXT,
  ADD COLUMN IF NOT EXISTS laboratory_name   TEXT,
  ADD COLUMN IF NOT EXISTS responsible_vet   TEXT,
  ADD COLUMN IF NOT EXISTS status            TEXT,
  ADD COLUMN IF NOT EXISTS quantity          INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_in_cycle_id  UUID REFERENCES breeding_cycles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS usage_date        DATE,
  ADD COLUMN IF NOT EXISTS usage_notes       TEXT,
  ADD COLUMN IF NOT EXISTS listed_for_sale   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS asking_price_usd  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS notes             TEXT;

-- Back-fill donor_name from old 'source' column
UPDATE genetics_inventory
  SET donor_name = source
  WHERE donor_name IS NULL AND source IS NOT NULL;

-- Back-fill status
UPDATE genetics_inventory
  SET status = 'Available'
  WHERE status IS NULL;

-- ── Step 3: Create mares table (new) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mares (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL,
  horse_id            UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  reproductive_status TEXT NOT NULL DEFAULT 'Active Breeding',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mares_org_isolation" ON mares;
CREATE POLICY "mares_org_isolation" ON mares
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS mares_horse_id_unique ON mares(horse_id);

-- ── Step 4: Create reproductive_events table (new) ────────────────────────────

CREATE TABLE IF NOT EXISTS reproductive_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  cycle_id        UUID NOT NULL REFERENCES breeding_cycles(id) ON DELETE CASCADE,
  mare_id         UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  scheduled_date  DATE NOT NULL,
  completed_date  DATE,
  status          TEXT NOT NULL DEFAULT 'Scheduled',
  vet_name        TEXT,
  result          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reproductive_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reproductive_events_org_isolation" ON reproductive_events;
CREATE POLICY "reproductive_events_org_isolation" ON reproductive_events
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── Step 5: Active pregnancies view (uses insemination_date which now exists) ──

DROP VIEW IF EXISTS active_pregnancies;

CREATE VIEW active_pregnancies AS
  SELECT
    bc.*,
    h.name        AS mare_name,
    h.breed       AS mare_breed,
    h.image_url   AS mare_image_url,
    CASE
      WHEN bc.insemination_date IS NOT NULL
      THEN EXTRACT(DAY FROM NOW() - (bc.insemination_date)::timestamptz)::int
      ELSE 0
    END AS gestation_days,
    CASE
      WHEN bc.insemination_date IS NOT NULL
      THEN ROUND(
        EXTRACT(DAY FROM NOW() - (bc.insemination_date)::timestamptz) / 340.0 * 100
      , 1)
      ELSE 0
    END AS gestation_pct
  FROM breeding_cycles bc
  JOIN horses h ON h.id = bc.mare_id
  WHERE bc.pregnancy_status = 'Confirmed';

-- ── Step 6: Triggers ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'mares_updated_at') THEN
    CREATE TRIGGER mares_updated_at
      BEFORE UPDATE ON mares
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'breeding_cycles_updated_at') THEN
    CREATE TRIGGER breeding_cycles_updated_at
      BEFORE UPDATE ON breeding_cycles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'genetics_inventory_updated_at') THEN
    CREATE TRIGGER genetics_inventory_updated_at
      BEFORE UPDATE ON genetics_inventory
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
