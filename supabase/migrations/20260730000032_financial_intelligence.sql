-- ============================================================
-- GaitFlow ERP — Migration 032: Inteligencia Financiera Avanzada
-- A/R & A/P Aging, P&L por Caballo/Ejemplar y Presupuestos vs. Real
-- ============================================================

-- ── 1. REPORTES DE ANTIGÜEDAD DE SALDOS (A/R AGING - CUENTAS POR COBRAR) ─────
CREATE OR REPLACE FUNCTION fn_ar_aging_report(p_org_id UUID)
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  total_due NUMERIC(15,2),
  current_0_30 NUMERIC(15,2),
  days_31_60 NUMERIC(15,2),
  days_61_90 NUMERIC(15,2),
  days_90_plus NUMERIC(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS contact_id,
    c.name AS contact_name,
    COALESCE(SUM(i.balance_due), 0)::NUMERIC(15,2) AS total_due,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) <= 30 THEN i.balance_due ELSE 0 END), 0)::NUMERIC(15,2) AS current_0_30,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) BETWEEN 31 AND 60 THEN i.balance_due ELSE 0 END), 0)::NUMERIC(15,2) AS days_31_60,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) BETWEEN 61 AND 90 THEN i.balance_due ELSE 0 END), 0)::NUMERIC(15,2) AS days_61_90,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - i.due_date) > 90 THEN i.balance_due ELSE 0 END), 0)::NUMERIC(15,2) AS days_90_plus
  FROM contacts c
  JOIN invoices i ON i.contact_id = c.id
  WHERE i.organization_id = p_org_id
    AND i.document_type IN ('invoice', 'debit_note')
    AND i.status NOT IN ('void', 'paid', 'draft')
    AND i.balance_due > 0
  GROUP BY c.id, c.name
  ORDER BY total_due DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2. REPORTES DE ANTIGÜEDAD DE DEUDAS (A/P AGING - CUENTAS POR PAGAR) ──────
CREATE OR REPLACE FUNCTION fn_ap_aging_report(p_org_id UUID)
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  total_owed NUMERIC(15,2),
  current_0_30 NUMERIC(15,2),
  days_31_60 NUMERIC(15,2),
  days_61_90 NUMERIC(15,2),
  days_90_plus NUMERIC(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS contact_id,
    COALESCE(c.name, 'Proveedor / Cuenta')::TEXT AS contact_name,
    COALESCE(SUM(ft.amount), 0)::NUMERIC(15,2) AS total_owed,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - ft.date) <= 30 THEN ft.amount ELSE 0 END), 0)::NUMERIC(15,2) AS current_0_30,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - ft.date) BETWEEN 31 AND 60 THEN ft.amount ELSE 0 END), 0)::NUMERIC(15,2) AS days_31_60,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - ft.date) BETWEEN 61 AND 90 THEN ft.amount ELSE 0 END), 0)::NUMERIC(15,2) AS days_61_90,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - ft.date) > 90 THEN ft.amount ELSE 0 END), 0)::NUMERIC(15,2) AS days_90_plus
  FROM financial_transactions ft
  LEFT JOIN contacts c ON ft.contact_id = c.id
  WHERE ft.organization_id = p_org_id
    AND ft.type = 'expense'
    AND ft.status = 'pending'
  GROUP BY c.id, c.name
  ORDER BY total_owed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. ESTADO DE RESULTADOS POR EJEMPLAR (HORSE P&L) ─────────────────────────
CREATE OR REPLACE FUNCTION fn_horse_pnl_report(p_org_id UUID, p_horse_id UUID DEFAULT NULL)
RETURNS TABLE (
  horse_id UUID,
  horse_name TEXT,
  total_income NUMERIC(15,2),
  total_expense NUMERIC(15,2),
  net_profit NUMERIC(15,2),
  profit_margin_pct NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH horse_incomes AS (
    SELECT 
      ii.horse_id,
      COALESCE(SUM(ii.total), 0)::NUMERIC(15,2) AS amount
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.organization_id = p_org_id
      AND i.status NOT IN ('void', 'draft')
      AND ii.horse_id IS NOT NULL
      AND (p_horse_id IS NULL OR ii.horse_id = p_horse_id)
    GROUP BY ii.horse_id
  ),
  horse_expenses AS (
    SELECT 
      ft.horse_id,
      COALESCE(SUM(ft.amount), 0)::NUMERIC(15,2) AS amount
    FROM financial_transactions ft
    WHERE ft.organization_id = p_org_id
      AND ft.type = 'expense'
      AND ft.status != 'cancelled'
      AND ft.horse_id IS NOT NULL
      AND (p_horse_id IS NULL OR ft.horse_id = p_horse_id)
    GROUP BY ft.horse_id
  ),
  all_horses AS (
    SELECT id, name FROM horses WHERE organization_id = p_org_id AND (p_horse_id IS NULL OR id = p_horse_id)
  )
  SELECT 
    h.id AS horse_id,
    h.name AS horse_name,
    COALESCE(hi.amount, 0)::NUMERIC(15,2) AS total_income,
    COALESCE(he.amount, 0)::NUMERIC(15,2) AS total_expense,
    (COALESCE(hi.amount, 0) - COALESCE(he.amount, 0))::NUMERIC(15,2) AS net_profit,
    CASE 
      WHEN COALESCE(hi.amount, 0) > 0 THEN 
        ROUND(((COALESCE(hi.amount, 0) - COALESCE(he.amount, 0)) / COALESCE(hi.amount, 0) * 100)::NUMERIC, 2)
      ELSE 0.00
    END AS profit_margin_pct
  FROM all_horses h
  LEFT JOIN horse_incomes hi ON h.id = hi.horse_id
  LEFT JOIN horse_expenses he ON h.id = he.horse_id
  WHERE COALESCE(hi.amount, 0) > 0 OR COALESCE(he.amount, 0) > 0
  ORDER BY net_profit DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 4. PRESUPUESTOS FINANCIEROS (BUDGET vs. ACTUAL) ──────────────────────────
CREATE TABLE IF NOT EXISTS financial_budgets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cost_center_id      UUID REFERENCES financial_cost_centers(id) ON DELETE CASCADE,
  category            TEXT NOT NULL,
  monthly_budget      NUMERIC(15,2) NOT NULL DEFAULT 0,
  alert_threshold_pct INTEGER DEFAULT 80,
  year                INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_org_category_year UNIQUE(organization_id, category, year)
);

ALTER TABLE financial_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_budgets_org_isolation" ON financial_budgets;
CREATE POLICY "financial_budgets_org_isolation" ON financial_budgets
  USING (organization_id = ANY(get_user_orgs()))
  WITH CHECK (organization_id = ANY(get_user_orgs()));


DROP FUNCTION IF EXISTS fn_budget_vs_actual_report(UUID, INTEGER);
CREATE OR REPLACE FUNCTION fn_budget_vs_actual_report(p_org_id UUID, p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::int)
RETURNS TABLE (
  category TEXT,
  monthly_budget NUMERIC(15,2),
  annual_budget NUMERIC(15,2),
  actual_spent NUMERIC(15,2),
  monthly_spent NUMERIC(15,2),
  variance_amount NUMERIC(15,2),
  execution_pct NUMERIC(5,2),
  status_alert TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH spent_data AS (
    SELECT 
      COALESCE(fc.name, 'General') AS cat,
      COALESCE(SUM(ft.amount), 0)::NUMERIC(15,2) AS spent,
      COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM ft.date) = EXTRACT(MONTH FROM CURRENT_DATE) THEN ft.amount ELSE 0 END), 0)::NUMERIC(15,2) AS month_spent
    FROM financial_transactions ft
    LEFT JOIN financial_categories fc ON ft.category_id = fc.id
    WHERE ft.organization_id = p_org_id
      AND ft.type = 'expense'
      AND EXTRACT(YEAR FROM ft.date) = p_year
    GROUP BY fc.name
  )
  SELECT 
    b.category,
    b.monthly_budget,
    (b.monthly_budget * 12)::NUMERIC(15,2) AS annual_budget,
    COALESCE(s.spent, 0)::NUMERIC(15,2) AS actual_spent,
    COALESCE(s.month_spent, 0)::NUMERIC(15,2) AS monthly_spent,
    ((b.monthly_budget * 12) - COALESCE(s.spent, 0))::NUMERIC(15,2) AS variance_amount,
    CASE 
      WHEN b.monthly_budget > 0 THEN 
        ROUND((COALESCE(s.spent, 0) / (b.monthly_budget * 12) * 100)::NUMERIC, 2)
      ELSE 0.00
    END AS execution_pct,
    CASE
      WHEN b.monthly_budget > 0 AND (COALESCE(s.spent, 0) / (b.monthly_budget * 12) * 100) >= 100 THEN 'OVER_BUDGET'
      WHEN b.monthly_budget > 0 AND (COALESCE(s.spent, 0) / (b.monthly_budget * 12) * 100) >= b.alert_threshold_pct THEN 'WARNING'
      ELSE 'NORMAL'
    END AS status_alert
  FROM financial_budgets b
  LEFT JOIN spent_data s ON b.category = s.cat
  WHERE b.organization_id = p_org_id
    AND b.year = p_year
  ORDER BY execution_pct DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
