-- ============================================================
-- GaitFlow ERP — Migration 034: Costeo Biológico NIIF 41 / Activos Biológicos
-- Foal Breeding Cost Basis & Equine Asset Valuation
-- ============================================================

-- ── 1. TABLA DE COSTOS BIOLÓGICOS Y REPRODUCTIVOS (NIIF 41) ─────────────────
CREATE TABLE IF NOT EXISTS foal_breeding_costs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  horse_id        UUID REFERENCES horses(id) ON DELETE CASCADE, -- Potro o ejemplar
  dam_id          UUID REFERENCES horses(id),                   -- Yegua madre/receptora
  sire_id         UUID REFERENCES horses(id),                   -- Semental / Padre
  cost_category   TEXT NOT NULL CHECK (
    cost_category IN ('insemination', 'embryo_transfer', 'recipient_mare_board', 'veterinary_ultrasound', 'foaling_care', 'stud_fee', 'other')
  ),
  amount          NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  date            DATE DEFAULT CURRENT_DATE,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE foal_breeding_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "foal_breeding_costs_org_isolation" ON foal_breeding_costs;
CREATE POLICY "foal_breeding_costs_org_isolation" ON foal_breeding_costs
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 2. FUNCIÓN SQL PARA OBTENER COSTO DE CRIANZA ACUMULADO (NIIF 41 ASSET BASIS)
CREATE OR REPLACE FUNCTION fn_get_horse_cost_basis(p_horse_id UUID)
RETURNS TABLE (
  horse_id UUID,
  horse_name TEXT,
  total_breeding_cost NUMERIC(15,2),
  total_operational_expense NUMERIC(15,2),
  niif41_book_value NUMERIC(15,2),
  costs_breakdown JSONB
) AS $$
DECLARE
  v_org_id UUID;
  v_name TEXT;
BEGIN
  SELECT organization_id, name INTO v_org_id, v_name FROM horses WHERE id = p_horse_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caballo no encontrado';
  END IF;

  RETURN QUERY
  WITH breeding AS (
    SELECT 
      COALESCE(SUM(amount), 0)::NUMERIC(15,2) AS total_breeding,
      jsonb_agg(
        jsonb_build_object(
          'category', cost_category,
          'amount', amount,
          'date', date,
          'description', description
        )
      ) AS breakdown
    FROM foal_breeding_costs
    WHERE foal_breeding_costs.horse_id = p_horse_id
  ),
  operational AS (
    SELECT 
      COALESCE(SUM(amount), 0)::NUMERIC(15,2) AS total_op
    FROM financial_transactions
    WHERE financial_transactions.horse_id = p_horse_id
      AND type = 'expense'
      AND status != 'cancelled'
  )
  SELECT 
    p_horse_id,
    v_name,
    COALESCE(b.total_breeding, 0)::NUMERIC(15,2),
    COALESCE(o.total_op, 0)::NUMERIC(15,2),
    (COALESCE(b.total_breeding, 0) + COALESCE(o.total_op, 0))::NUMERIC(15,2) AS niif41_book_value,
    COALESCE(b.breakdown, '[]'::jsonb) AS costs_breakdown
  FROM breeding b, operational o;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
