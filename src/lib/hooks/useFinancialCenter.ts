/**
 * GaitFlow — Centro Financiero
 * Hook principal: todas las queries y mutaciones del módulo financiero
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

// ─── Hook: KPIs financieros del mes actual ────────────────────────────────────

export function useFinancialKPIs() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<FinancialKPIs>({
    queryKey: ['financial-kpis', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return {
        incomeMonth: 0, expenseMonth: 0, balance: 0,
        pending: 0, overdue: 0, totalTransactions: 0,
        incomeLastMonth: 0, expenseLastMonth: 0,
      };

      const { start: startThisMonth, end: endThisMonth } = getMonthRange(0);
      const { start: startLastMonth, end: endLastMonth } = getMonthRange(1);
      const today = new Date().toISOString().split('T')[0];

      const { data: all } = await (supabase as any)
        .from('financial_transactions')
        .select('type, amount, status, date')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

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

      // Overdue = pending income older than today
      const { data: overdueData } = await (supabase as any)
        .from('financial_transactions')
        .select('amount')
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .eq('status', 'pending')
        .eq('type', 'income')
        .lt('date', today);

      const overdue = ((overdueData ?? []) as { amount: number }[])
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
