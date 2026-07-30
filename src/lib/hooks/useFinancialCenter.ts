/**
 * GaitFlow — Centro Financiero
 * Hook principal: todas las queries y mutaciones del módulo financiero
 * Performance: staleTime + gcTime en todas las queries para evitar re-fetches al cambiar tabs
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useApp } from '../store';
import {
  type FinancialTransaction,
  type FinancialCategory,
  type FinancialKPIs,
  type MonthlyChartPoint,
  type TransactionType,
  type TransactionStatus,
  type PaymentMethod,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../financial/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Cache config: 2 min stale, 10 min in memory — evita re-fetches al cambiar de pestaña
const CACHE_CONFIG = {
  staleTime: 2 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
};

function getMonthRange(monthsBack: number = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// ─── Seeding de categorías (se llama automáticamente al primer acceso) ────────

export async function ensureCategories(orgId: string) {
  const { count } = await (supabase as any)
    .from('financial_categories')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (count && count > 0) return;

  const allCats = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  await (supabase as any)
    .from('financial_categories')
    .insert(
      allCats.map((c) => ({
        organization_id: orgId,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        sort_order: c.sortOrder,
        is_system: true,
        source_module: c.sourceModule ?? null,
      }))
    );
}

// ─── Hook: categorías ────────────────────────────────────────────────────────

export function useFinancialCategories() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<FinancialCategory[]>({
    queryKey: ['financial-categories', orgId],
    enabled: !!orgId,
    ...CACHE_CONFIG,
    queryFn: async () => {
      if (!orgId) return [];
      await ensureCategories(orgId);
      const { data, error } = await (supabase as any)
        .from('financial_categories')
        .select('*')
        .eq('organization_id', orgId)
        .order('type')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as FinancialCategory[];
    },
  });
}

// ─── Hook: transacciones con join a categoría, contacto y caballo ─────────────

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
  horseId?: string;
  contactId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function useFinancialTransactions(filters: TransactionFilters = {}) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<FinancialTransaction[]>({
    queryKey: ['financial-transactions', orgId, filters],
    enabled: !!orgId,
    staleTime: 60 * 1000, // 1 min para transacciones (cambian más seguido)
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!orgId) return [];
      let query = (supabase as any)
        .from('financial_transactions')
        .select(`
          *,
          category:category_id ( id, name, icon, color, type ),
          contact:contact_id   ( id, name ),
          horse:horse_id       ( id, name )
        `)
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.type)       query = query.eq('type', filters.type);
      if (filters.status)     query = query.eq('status', filters.status);
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters.horseId)    query = query.eq('horse_id', filters.horseId);
      if (filters.contactId)  query = query.eq('contact_id', filters.contactId);
      if (filters.dateFrom)   query = query.gte('date', filters.dateFrom);
      if (filters.dateTo)     query = query.lte('date', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;

      let result = (data ?? []) as FinancialTransaction[];

      // Client-side search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.description?.toLowerCase().includes(q) ||
            (t as any).category?.name?.toLowerCase().includes(q) ||
            (t as any).contact?.name?.toLowerCase().includes(q) ||
            (t as any).horse?.name?.toLowerCase().includes(q)
        );
      }

      return result;
    },
  });
}

// ─── Hook: KPIs financieros — CONSOLIDADO en 1 sola query ────────────────────
// Antes hacía 2 queries separadas. Ahora trae todos los datos en una y calcula en cliente.

export function useFinancialKPIs() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<FinancialKPIs>({
    queryKey: ['financial-kpis', orgId],
    enabled: !!orgId,
    ...CACHE_CONFIG,
    queryFn: async () => {
      if (!orgId) return {
        incomeMonth: 0, expenseMonth: 0, balance: 0,
        pending: 0, overdue: 0, totalTransactions: 0,
        incomeLastMonth: 0, expenseLastMonth: 0,
      };

      const { start: startThisMonth, end: endThisMonth } = getMonthRange(0);
      const { start: startLastMonth, end: endLastMonth } = getMonthRange(1);
      const today = new Date().toISOString().split('T')[0];

      // Una sola query — calculamos todo en cliente
      const { data: all, error } = await (supabase as any)
        .from('financial_transactions')
        .select('type, amount, status, date')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      if (error) throw error;

      const rows = (all ?? []) as Array<{
        type: TransactionType;
        amount: number;
        status: TransactionStatus;
        date: string;
      }>;

      const thisMonth = rows.filter(r => r.date >= startThisMonth && r.date <= endThisMonth);
      const lastMonth = rows.filter(r => r.date >= startLastMonth && r.date <= endLastMonth);

      const sum = (arr: typeof rows, t: TransactionType, s?: TransactionStatus) =>
        arr
          .filter(r => r.type === t && (!s || r.status === s))
          .reduce((acc, r) => acc + Number(r.amount), 0);

      const incomeMonth   = sum(thisMonth, 'income');
      const expenseMonth  = sum(thisMonth, 'expense');
      const incomeLastM   = sum(lastMonth, 'income');
      const expenseLastM  = sum(lastMonth, 'expense');

      const pending = rows
        .filter(r => r.status === 'pending' && r.type === 'income')
        .reduce((acc, r) => acc + Number(r.amount), 0);

      // Overdue calculado en cliente también — ya tenemos los datos
      const overdue = rows
        .filter(r => r.status === 'pending' && r.type === 'income' && r.date < today)
        .reduce((acc, r) => acc + Number(r.amount), 0);

      return {
        incomeMonth,
        expenseMonth,
        balance: incomeMonth - expenseMonth,
        pending,
        overdue,
        totalTransactions: rows.filter(r => !r.status.includes('cancelled')).length,
        incomeLastMonth: incomeLastM,
        expenseLastMonth: expenseLastM,
      };
    },
  });
}

// ─── Hook: datos para el gráfico de los últimos 6 meses ──────────────────────

export function useFinancialChart(months: number = 6) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<MonthlyChartPoint[]>({
    queryKey: ['financial-chart', orgId, months],
    enabled: !!orgId,
    ...CACHE_CONFIG,
    queryFn: async () => {
      if (!orgId) return [];

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
        .toISOString()
        .split('T')[0];

      const { data, error } = await (supabase as any)
        .from('financial_transactions')
        .select('type, amount, date')
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .neq('status', 'cancelled')
        .gte('date', startDate);

      if (error) throw error;

      const rows = (data ?? []) as { type: TransactionType; amount: number; date: string }[];

      const points: MonthlyChartPoint[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = MONTHS_ES[d.getMonth()];

        const monthRows = rows.filter(r => r.date.startsWith(key));
        const income  = monthRows.filter(r => r.type === 'income') .reduce((a, r) => a + Number(r.amount), 0);
        const expense = monthRows.filter(r => r.type === 'expense').reduce((a, r) => a + Number(r.amount), 0);

        points.push({ month: label, income, expense });
      }

      return points;
    },
  });
}

// ─── Hook: distribución por categoría ────────────────────────────────────────

export function useFinancialCategoryBreakdown(type: TransactionType = 'expense') {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const { start, end } = getMonthRange(0);

  return useQuery<{ name: string; icon: string; color: string; amount: number; pct: number }[]>({
    queryKey: ['financial-breakdown', orgId, type],
    enabled: !!orgId,
    ...CACHE_CONFIG,
    queryFn: async () => {
      if (!orgId) return [];

      const { data } = await (supabase as any)
        .from('financial_transactions')
        .select('amount, category:category_id ( name, icon, color )')
        .eq('organization_id', orgId)
        .eq('type', type)
        .eq('is_deleted', false)
        .neq('status', 'cancelled')
        .gte('date', start)
        .lte('date', end);

      const rows = (data ?? []) as {
        amount: number;
        category: { name: string; icon: string; color: string } | null;
      }[];

      const map: Record<string, { name: string; icon: string; color: string; amount: number }> = {};
      for (const r of rows) {
        const key = r.category?.name ?? 'Sin categoría';
        if (!map[key]) {
          map[key] = {
            name: key,
            icon: r.category?.icon ?? '📌',
            color: r.category?.color ?? '#9CA3AF',
            amount: 0,
          };
        }
        map[key].amount += Number(r.amount);
      }

      const total = Object.values(map).reduce((a, v) => a + v.amount, 0);
      return Object.values(map)
        .map(v => ({ ...v, pct: total > 0 ? Math.round((v.amount / total) * 100) : 0 }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);
    },
  });
}

// ─── Mutación: crear transacción ──────────────────────────────────────────────

export interface CreateTransactionInput {
  type: TransactionType;
  category_id?: string | null;
  amount: number;
  currency?: string;
  description: string;
  date: string;
  status?: TransactionStatus;
  payment_method?: PaymentMethod | null;
  contact_id?: string | null;
  horse_id?: string | null;
  notes?: string | null;
  tags?: string[];
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const orgId = state.user?.organization_id;
      const userId = state.user?.id;
      if (!orgId) throw new Error('No organization');

      const { data, error } = await (supabase as any)
        .from('financial_transactions')
        .insert({
          organization_id: orgId,
          type: input.type,
          category_id: input.category_id ?? null,
          amount: input.amount,
          currency: input.currency ?? 'COP',
          exchange_rate: 1,
          description: input.description,
          date: input.date,
          status: input.status ?? 'completed',
          payment_method: input.payment_method ?? null,
          contact_id: input.contact_id ?? null,
          horse_id: input.horse_id ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? null,
          source_module: 'manual',
          created_by: userId ?? null,
          is_deleted: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['financial-chart'] });
      queryClient.invalidateQueries({ queryKey: ['financial-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

// ─── Mutación: actualizar estado de transacción ───────────────────────────────

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TransactionStatus }) => {
      const userId = state.user?.id;
      const { data, error } = await (supabase as any)
        .from('financial_transactions')
        .update({ status, updated_by: userId ?? null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
    },
  });
}

// ─── Mutación: soft delete de transacción ─────────────────────────────────────

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = state.user?.id;
      const { error } = await (supabase as any)
        .from('financial_transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId ?? null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['financial-chart'] });
    },
  });
}

// ─── Hook: Cierre Contable Fiscal ([SEC-001]) ─────────────────────────────────

export interface FinancialPeriod {
  id: string;
  organization_id: string;
  year: number;
  month: number;
  is_closed: boolean;
  closed_by?: string;
  closed_at?: string;
  notes?: string;
}

export function useFinancialPeriods(year: number) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<FinancialPeriod[]>({
    queryKey: ['financial-periods', orgId, year],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from('financial_periods')
        .select('*')
        .eq('organization_id', orgId)
        .eq('year', year)
        .order('month');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useToggleFiscalPeriod() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async ({ year, month, isClosed }: { year: number; month: number; isClosed: boolean }) => {
      const orgId = state.user?.organization_id;
      const userId = state.user?.id;
      if (!orgId) throw new Error('No active organization');

      const { data: existing } = await (supabase as any)
        .from('financial_periods')
        .select('id')
        .eq('organization_id', orgId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from('financial_periods')
          .update({
            is_closed: isClosed,
            closed_by: isClosed ? userId : null,
            closed_at: isClosed ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('financial_periods')
          .insert({
            organization_id: orgId,
            year,
            month,
            is_closed: isClosed,
            closed_by: isClosed ? userId : null,
            closed_at: isClosed ? new Date().toISOString() : null,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financial-periods'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
  });
}

// ─── HOOKS DE INTELIGENCIA FINANCIERA (A/R AGING, A/P AGING, P&L CABALLO, BUDGETS) ───

export interface ARAgingItem {
  contact_id: string;
  contact_name: string;
  total_due: number;
  current_0_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

export function useARAgingReport() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery({
    queryKey: ['ar-aging-report', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any).rpc('fn_ar_aging_report', { p_org_id: orgId });
      if (error) throw error;
      return (data || []) as ARAgingItem[];
    },
    enabled: !!orgId,
  });
}

export interface APAgingItem {
  contact_id: string;
  contact_name: string;
  total_owed: number;
  current_0_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

export function useAPAgingReport() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery({
    queryKey: ['ap-aging-report', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any).rpc('fn_ap_aging_report', { p_org_id: orgId });
      if (error) throw error;
      return (data || []) as APAgingItem[];
    },
    enabled: !!orgId,
  });
}

export interface HorsePnLItem {
  horse_id: string;
  horse_name: string;
  total_income: number;
  total_expense: number;
  net_profit: number;
  profit_margin_pct: number;
}

export function useHorsePnLReport(horseId?: string) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery({
    queryKey: ['horse-pnl-report', orgId, horseId || 'all'],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any).rpc('fn_horse_pnl_report', {
        p_org_id: orgId,
        p_horse_id: horseId || null,
      });
      if (error) throw error;
      return (data || []) as HorsePnLItem[];
    },
    enabled: !!orgId,
  });
}

export interface BudgetVsActualItem {
  category: string;
  monthly_budget: number;
  annual_budget: number;
  actual_spent: number;
  variance_amount: number;
  execution_pct: number;
  status_alert: 'NORMAL' | 'WARNING' | 'OVER_BUDGET';
}

export function useBudgetVsActualReport(year?: number) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['budget-vs-actual-report', orgId, currentYear],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any).rpc('fn_budget_vs_actual_report', {
        p_org_id: orgId,
        p_year: currentYear,
      });
      if (error) throw error;
      return (data || []) as BudgetVsActualItem[];
    },
    enabled: !!orgId,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useMutation({
    mutationFn: async ({
      category,
      monthly_budget,
      alert_threshold_pct = 80,
      year = new Date().getFullYear(),
    }: {
      category: string;
      monthly_budget: number;
      alert_threshold_pct?: number;
      year?: number;
    }) => {
      if (!orgId) throw new Error('Sin organización');
      const { data, error } = await (supabase as any)
        .from('financial_budgets')
        .upsert(
          {
            organization_id: orgId,
            category,
            monthly_budget,
            alert_threshold_pct,
            year,
          },
          { onConflict: 'organization_id,category,year' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-vs-actual-report'] });
    },
  });
}

// ─── SINDICACIÓN & CO-PROPIEDAD (SYNDICATE BILLING) ─────────────────────────

export interface HorseOwner {
  id: string;
  organization_id: string;
  horse_id: string;
  contact_id: string;
  ownership_pct: number;
  start_date: string;
  is_active: boolean;
  contact?: { name: string; email?: string };
}

export function useHorseOwners(horseId?: string) {
  return useQuery({
    queryKey: ['horse-owners', horseId],
    queryFn: async () => {
      if (!horseId) return [];
      const { data, error } = await (supabase as any)
        .from('horse_owners')
        .select('*, contact:contact_id(name, email)')
        .eq('horse_id', horseId)
        .eq('is_active', true)
        .order('ownership_pct', { ascending: false });
      if (error) throw error;
      return data as HorseOwner[];
    },
    enabled: Boolean(horseId),
    ...CACHE_CONFIG,
  });
}

export function useGenerateSyndicateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orgId,
      horseId,
      year,
      month,
    }: {
      orgId: string;
      horseId: string;
      year: number;
      month: number;
    }) => {
      const { data, error } = await (supabase as any).rpc('fn_generate_syndicate_invoices', {
        p_org_id: orgId,
        p_horse_id: horseId,
        p_year: year,
        p_month: month,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// ─── COSTEO BIOLÓGICO & NIIF 41 (FOAL COST BASIS) ───────────────────────────

export interface HorseCostBasis {
  horse_id: string;
  horse_name: string;
  total_breeding_cost: number;
  total_operational_expense: number;
  niif41_book_value: number;
  costs_breakdown: Array<{
    category: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

export function useHorseCostBasis(horseId?: string) {
  return useQuery({
    queryKey: ['horse-cost-basis', horseId],
    queryFn: async () => {
      if (!horseId) return null;
      const { data, error } = await (supabase as any).rpc('fn_get_horse_cost_basis', {
        p_horse_id: horseId,
      });
      if (error) throw error;
      return (data?.[0] || null) as HorseCostBasis | null;
    },
    enabled: Boolean(horseId),
    ...CACHE_CONFIG,
  });
}

// ─── ANTICIPOS DE CLIENTES (CUSTOMER ADVANCES) ──────────────────────────────

export interface CustomerAdvance {
  id: string;
  organization_id: string;
  contact_id: string;
  amount: number;
  balance_available: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  date: string;
  contact?: { name: string };
}

export function useCustomerAdvances(orgId?: string) {
  return useQuery({
    queryKey: ['customer-advances', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from('customer_advances')
        .select('*, contact:contact_id(name)')
        .eq('organization_id', orgId)
        .gt('balance_available', 0)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as CustomerAdvance[];
    },
    enabled: Boolean(orgId),
    ...CACHE_CONFIG,
  });
}

export function useApplyCustomerAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      advanceId,
      invoiceId,
      amount,
    }: {
      advanceId: string;
      invoiceId: string;
      amount: number;
    }) => {
      const { data, error } = await (supabase as any).rpc('fn_apply_customer_advance_to_invoice', {
        p_advance_id: advanceId,
        p_invoice_id: invoiceId,
        p_amount: amount,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-advances'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
  });
}

// ─── CATÁLOGO DE CUENTAS PUC/NIIF (CHART OF ACCOUNTS) ───────────────────────

export interface ChartOfAccount {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  is_active: boolean;
}

export function useChartOfAccounts(orgId?: string) {
  return useQuery({
    queryKey: ['chart-of-accounts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from('financial_chart_of_accounts')
        .select('*')
        .eq('organization_id', orgId)
        .order('code', { ascending: true });
      if (error) throw error;
      return data as ChartOfAccount[];
    },
    enabled: Boolean(orgId),
    ...CACHE_CONFIG,
  });
}

