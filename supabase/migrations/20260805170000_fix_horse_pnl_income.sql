-- ── 3. ESTADO DE RESULTADOS POR EJEMPLAR (HORSE P&L) - FIX INCOMES ──
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
      COALESCE(SUM(ii.amount), 0)::NUMERIC(15,2) AS amount
    FROM (
      -- 1. Incomes from Invoices (Accounts Receivable)
      SELECT 
        inv_item.horse_id, 
        inv_item.total AS amount
      FROM invoice_items inv_item
      JOIN invoices inv ON inv_item.invoice_id = inv.id
      WHERE inv.organization_id = p_org_id
        AND inv.status NOT IN ('void', 'draft')
        AND inv_item.horse_id IS NOT NULL
        AND (p_horse_id IS NULL OR inv_item.horse_id = p_horse_id)
      
      UNION ALL
      
      -- 2. Direct Incomes from Ledger (Manual transactions without invoices)
      SELECT 
        ft.horse_id, 
        ft.amount
      FROM financial_transactions ft
      WHERE ft.organization_id = p_org_id
        AND ft.type = 'income'
        AND ft.status != 'cancelled'
        AND ft.horse_id IS NOT NULL
        AND (p_horse_id IS NULL OR ft.horse_id = p_horse_id)
        AND ft.source_module = 'manual'
    ) ii
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
