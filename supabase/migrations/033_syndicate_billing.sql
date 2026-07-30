-- ============================================================
-- GaitFlow ERP — Migration 033: Sindicación y Facturación Multi-Propietario
-- Syndicate Billing & Horse Co-Ownership Automation
-- ============================================================

-- ── 1. TABLA DE COPROPIETARIOS POR EJEMPLAR ──────────────────────────────────
CREATE TABLE IF NOT EXISTS horse_owners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  horse_id        UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  ownership_pct   NUMERIC(5,2) NOT NULL CHECK (ownership_pct > 0 AND ownership_pct <= 100),
  start_date      DATE DEFAULT CURRENT_DATE,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_horse_owner_active UNIQUE(horse_id, contact_id, is_active)
);

ALTER TABLE horse_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "horse_owners_org_isolation" ON horse_owners
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


-- ── 2. FUNCIÓN PARA GENERAR FACTURAS PROPORCIONALES (SYNDICATE BILLING) ──────
-- Toma los gastos de un caballo en un mes y genera una factura automática
-- para cada copropietario en proporción a su porcentaje de participación.
CREATE OR REPLACE FUNCTION fn_generate_syndicate_invoices(
  p_org_id UUID,
  p_horse_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  ownership_pct NUMERIC(5,2),
  invoice_id UUID,
  total_billed NUMERIC(15,2)
) AS $$
DECLARE
  v_horse_name TEXT;
  v_total_horse_expense NUMERIC(15,2);
  v_owner RECORD;
  v_new_invoice_id UUID;
  v_owner_share NUMERIC(15,2);
  v_first_date DATE;
  v_last_date DATE;
BEGIN
  -- 1. Obtener nombre del caballo
  SELECT name INTO v_horse_name FROM horses WHERE id = p_horse_id AND organization_id = p_org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caballo no encontrado en la organización.';
  END IF;

  v_first_date := make_date(p_year, p_month, 1);
  v_last_date  := (v_first_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- 2. Calcular gastos totales asociados al caballo en el mes especificado
  SELECT COALESCE(SUM(amount), 0)::NUMERIC(15,2)
  INTO v_total_horse_expense
  FROM financial_transactions
  WHERE organization_id = p_org_id
    AND horse_id = p_horse_id
    AND type = 'expense'
    AND date BETWEEN v_first_date AND v_last_date;

  IF v_total_horse_expense <= 0 THEN
    RAISE NOTICE 'No hay gastos registrados para % en el periodo %-%', v_horse_name, p_year, p_month;
    RETURN;
  END IF;

  -- 3. Iterar por cada copropietario activo del caballo
  FOR v_owner IN (
    SELECT ho.contact_id, c.name AS contact_name, ho.ownership_pct
    FROM horse_owners ho
    JOIN crm_contacts c ON ho.contact_id = c.id
    WHERE ho.horse_id = p_horse_id
      AND ho.organization_id = p_org_id
      AND ho.is_active = TRUE
  ) LOOP
    v_owner_share := ROUND((v_total_horse_expense * (v_owner.ownership_pct / 100.0))::NUMERIC, 2);

    IF v_owner_share > 0 THEN
      -- Crear la factura para el copropietario
      INSERT INTO invoices (
        organization_id,
        contact_id,
        invoice_number,
        issue_date,
        due_date,
        status,
        subtotal,
        total_tax,
        total_amount,
        balance_due,
        notes,
        document_type
      ) VALUES (
        p_org_id,
        v_owner.contact_id,
        'SYND-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MI') || '-' || SUBSTRING(v_owner.contact_id::TEXT, 1, 4),
        CURRENT_DATE,
        CURRENT_DATE + 15,
        'draft',
        v_owner_share,
        0,
        v_owner_share,
        v_owner_share,
        'Facturación de copropietario (' || v_owner.ownership_pct || '%) para ejemplar: ' || v_horse_name || ' (Periodo: ' || p_month || '/' || p_year || ')',
        'invoice'
      ) RETURNING id INTO v_new_invoice_id;

      -- Insertar partida de la factura
      INSERT INTO invoice_items (
        invoice_id,
        product_name,
        quantity,
        unit_price,
        tax_rate,
        total,
        horse_id
      ) VALUES (
        v_new_invoice_id,
        'Cuota de mantenimiento y gastos (' || v_owner.ownership_pct || '%) - ' || v_horse_name,
        1,
        v_owner_share,
        0,
        v_owner_share,
        p_horse_id
      );

      -- Retornar fila generada
      contact_id    := v_owner.contact_id;
      contact_name  := v_owner.contact_name;
      ownership_pct := v_owner.ownership_pct;
      invoice_id    := v_new_invoice_id;
      total_billed  := v_owner_share;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
