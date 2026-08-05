-- =============================================================================
-- GaitFlow — Section I: Enterprise Breeding & Reproduction Center Schema
-- Full Schema: Mares, Stallion Profiles, Embryos, Genetic Bank, Events & Analytics
-- =============================================================================

-- ── 1. Mares Registry ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mares (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL,
  horse_id            UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  reproductive_status TEXT NOT NULL DEFAULT 'Vacía',
  -- Statuses: 'Vacías', 'En celo', 'Programadas', 'Servidas', 'Diagnóstico', 'Preñadas', 'Próximas al parto', 'Lactancia', 'Descanso'
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mares_org_isolation" ON mares;
CREATE POLICY "mares_org_isolation" ON mares FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE UNIQUE INDEX IF NOT EXISTS mares_horse_id_unique ON mares(horse_id);

-- ── 2. Stallion Profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stallion_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL,
  horse_id              UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'Activo', -- 'Activo', 'En descanso', 'Inactivo'
  total_services_count  INT DEFAULT 0,
  conception_rate_pct   NUMERIC(5,2) DEFAULT 0.00,
  total_offspring_count INT DEFAULT 0,
  doses_available_count INT DEFAULT 0,
  stud_fee_usd          NUMERIC(12,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stallion_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stallion_profiles_org_isolation" ON stallion_profiles;
CREATE POLICY "stallion_profiles_org_isolation" ON stallion_profiles FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
CREATE UNIQUE INDEX IF NOT EXISTS stallion_profiles_horse_id_unique ON stallion_profiles(horse_id);

-- ── 3. Genetic Bank (Semen, Embryos, Oocytes) ────────────────────────────────
CREATE TABLE IF NOT EXISTS genetic_bank (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL,
  material_type     TEXT NOT NULL, -- 'Semen', 'Embrión', 'Ovocito'
  lot_number        TEXT,
  donor_id          UUID REFERENCES horses(id) ON DELETE SET NULL,
  dam_id            UUID REFERENCES horses(id) ON DELETE SET NULL,
  quantity          INT DEFAULT 1,
  storage_tank      TEXT,
  storage_canister  TEXT,
  storage_rack      TEXT,
  status            TEXT NOT NULL DEFAULT 'Disponible', -- 'Disponible', 'Reservado', 'Agotado', 'Expirado'
  acquisition_date  DATE DEFAULT CURRENT_DATE,
  expiration_date   DATE,
  cost_usd          NUMERIC(12,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE genetic_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "genetic_bank_org_isolation" ON genetic_bank;
CREATE POLICY "genetic_bank_org_isolation" ON genetic_bank FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

-- ── 4. Embryo Center ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS embryos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL,
  donor_mare_id       UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  stallion_id         UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  recipient_mare_id   UUID REFERENCES horses(id) ON DELETE SET NULL,
  flush_date          DATE NOT NULL,
  transfer_date       DATE,
  grade               TEXT DEFAULT 'Calidad I', -- 'Calidad I', 'Calidad II', 'Calidad III'
  stage               TEXT DEFAULT 'Blastocisto', -- 'Mórula', 'Blastocisto', 'Blastocisto Expandido'
  status              TEXT NOT NULL DEFAULT 'Congelado', -- 'Congelado', 'Transferido', 'Implantado', 'Nacido', 'Pérdida'
  genetic_bank_id     UUID REFERENCES genetic_bank(id) ON DELETE SET NULL,
  vet_name            TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE embryos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "embryos_org_isolation" ON embryos;
CREATE POLICY "embryos_org_isolation" ON embryos FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

-- ── 5. Breeding Cycles & Services ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS breeding_cycles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL,
  mare_id               UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  stallion_id           UUID REFERENCES horses(id) ON DELETE SET NULL,
  stallion_name         TEXT NOT NULL,
  stallion_registry     TEXT,
  method                TEXT NOT NULL DEFAULT 'Monta Natural',
  -- 'Monta Natural', 'Semen Refrigerado', 'Pajilla Congelada', 'Transferencia de Embrión'
  insemination_date     DATE NOT NULL,
  genetic_material_id   UUID REFERENCES genetic_bank(id) ON DELETE SET NULL,
  embryo_id             UUID REFERENCES embryos(id) ON DELETE SET NULL,
  vet_name              TEXT,
  pregnancy_confirmed   BOOLEAN,
  diagnosis_date        DATE,
  diagnosis_notes       TEXT,
  pregnancy_status      TEXT NOT NULL DEFAULT 'Pending',
  -- 'Pending', 'Confirmed', 'Open', 'Lost', 'Aborted'
  expected_foaling_date DATE,
  actual_foaling_date   DATE,
  foal_id               UUID REFERENCES horses(id) ON DELETE SET NULL,
  cycle_outcome_score   NUMERIC(4,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE breeding_cycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "breeding_cycles_org_isolation" ON breeding_cycles;
CREATE POLICY "breeding_cycles_org_isolation" ON breeding_cycles FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

-- ── 6. Reproductive Events & Operational Timeline ─────────────────────────────
CREATE TABLE IF NOT EXISTS reproductive_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  cycle_id        UUID REFERENCES breeding_cycles(id) ON DELETE CASCADE,
  mare_id         UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  stallion_id     UUID REFERENCES horses(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,
  -- 'Palpación', 'Ecografía', 'Inseminación', 'Monta', 'Transferencia', 'Lavado', 'Diagnóstico', 'Parto', 'Destete'
  scheduled_date  DATE NOT NULL,
  completed_date  DATE,
  status          TEXT NOT NULL DEFAULT 'Programado',
  -- 'Programado', 'Completado', 'Vencido', 'Cancelado'
  vet_name        TEXT,
  result          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reproductive_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reproductive_events_org_isolation" ON reproductive_events;
CREATE POLICY "reproductive_events_org_isolation" ON reproductive_events FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

-- ── 7. Active Pregnancies View ────────────────────────────────────────────────
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

-- ── 8. Triggers for Auto-Updated Timestamps ───────────────────────────────────
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
    CREATE TRIGGER mares_updated_at BEFORE UPDATE ON mares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'stallion_profiles_updated_at') THEN
    CREATE TRIGGER stallion_profiles_updated_at BEFORE UPDATE ON stallion_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'genetic_bank_updated_at') THEN
    CREATE TRIGGER genetic_bank_updated_at BEFORE UPDATE ON genetic_bank FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'embryos_updated_at') THEN
    CREATE TRIGGER embryos_updated_at BEFORE UPDATE ON embryos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'breeding_cycles_updated_at') THEN
    CREATE TRIGGER breeding_cycles_updated_at BEFORE UPDATE ON breeding_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reproductive_events_updated_at') THEN
    CREATE TRIGGER reproductive_events_updated_at BEFORE UPDATE ON reproductive_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
