-- =============================================================================
-- GaitFlow — Section I: Enterprise Breeding Service Enhancements
-- Adds fields for service source, external stallion details, clinical metrics,
-- and atomic inventory dose reduction logic.
-- =============================================================================

-- 1. Extend breeding_cycles table for Enterprise clinical & source metadata
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS embryo_id UUID;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS genetic_material_id UUID;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS stallion_name TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS stallion_registry TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS insemination_date DATE;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS pregnancy_status TEXT DEFAULT 'Pending';
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS expected_foaling_date DATE;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS vet_name TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS service_source TEXT DEFAULT 'internal';
-- Options: 'internal', 'inventory', 'external'

ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS external_owner TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS external_country TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS external_contact TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS external_sire_name TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS external_dam_name TEXT;

ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS follicle_size_mm NUMERIC(5,2);
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS uterine_tone TEXT;
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS semen_motility_pct NUMERIC(5,2);
ALTER TABLE breeding_cycles ADD COLUMN IF NOT EXISTS doses_used INT DEFAULT 1;

-- 2. Function for atomic dose deduction in genetic_bank
CREATE OR REPLACE FUNCTION deduct_genetic_material_dose(
  p_item_id UUID,
  p_quantity_used INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_qty INT;
  v_new_qty INT;
  v_new_status TEXT;
BEGIN
  SELECT quantity INTO v_current_qty
  FROM genetic_bank
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material genético con ID % no fue encontrado.', p_item_id;
  END IF;

  IF v_current_qty < p_quantity_used THEN
    RAISE EXCEPTION 'Dosis insuficientes en el Banco Genético. Disponibles: %, solicitadas: %', v_current_qty, p_quantity_used;
  END IF;

  v_new_qty := v_current_qty - p_quantity_used;
  
  IF v_new_qty <= 0 THEN
    v_new_status := 'Agotado';
  ELSE
    v_new_status := 'Disponible';
  END IF;

  UPDATE genetic_bank
  SET quantity = v_new_qty,
      status = v_new_status,
      updated_at = NOW()
  WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'id', p_item_id,
    'previous_quantity', v_current_qty,
    'new_quantity', v_new_qty,
    'status', v_new_status
  );
END;
$$;
