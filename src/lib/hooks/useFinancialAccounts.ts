/**
 * GaitFlow — Financial Accounts Hook
 * CRUD de cuentas financieras + saldo calculado dinámicamente
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useApp } from '../store';

export interface FinancialAccount {
  id: string;
  organization_id: string;
  name: string;
  type: 'cash' | 'bank' | 'digital_wallet' | 'credit' | 'investment' | 'other';
  currency: string;
  bank_name: string | null;
  account_number: string | null;
  is_default: boolean;
  is_active: boolean;
  initial_balance: number;
  icon: string | null;
  color: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
  // Calculado en el cliente
  computed_balance?: number;
  income_total?: number;
  expense_total?: number;
}

export interface AccountWithBalance extends FinancialAccount {
  computed_balance: number;
  income_total: number;
  expense_total: number;
}

// ─── Hook: lista de cuentas con saldo calculado ───────────────────────────────

export function useFinancialAccounts() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<AccountWithBalance[]>({
    queryKey: ['financial-accounts', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];

      // 1. Traer las cuentas
      const { data: accounts, error: accErr } = await (supabase as any)
        .from('financial_accounts')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('sort_order');

      if (accErr) throw accErr;
      if (!accounts?.length) return [];

      // 2. Traer totales por cuenta desde financial_transactions
      const accountIds = (accounts as FinancialAccount[]).map(a => a.id);

      const { data: txData } = await (supabase as any)
        .from('financial_transactions')
        .select('account_id, type, amount')
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .neq('status', 'cancelled')
        .in('account_id', accountIds);

      // 3. Calcular saldos en el cliente
      const totals: Record<string, { income: number; expense: number }> = {};
      for (const tx of (txData ?? []) as { account_id: string; type: string; amount: number }[]) {
        if (!tx.account_id) continue;
        if (!totals[tx.account_id]) totals[tx.account_id] = { income: 0, expense: 0 };
        if (tx.type === 'income')  totals[tx.account_id].income  += Number(tx.amount);
        if (tx.type === 'expense') totals[tx.account_id].expense += Number(tx.amount);
      }

      return (accounts as FinancialAccount[]).map(acc => {
        const t = totals[acc.id] ?? { income: 0, expense: 0 };
        return {
          ...acc,
          income_total:     t.income,
          expense_total:    t.expense,
          computed_balance: Number(acc.initial_balance) + t.income - t.expense,
        };
      });
    },
    staleTime: 30_000,
  });
}

// ─── Hook: crear cuenta ───────────────────────────────────────────────────────

export interface CreateAccountInput {
  name: string;
  type: FinancialAccount['type'];
  currency?: string;
  bank_name?: string;
  account_number?: string;
  is_default?: boolean;
  initial_balance?: number;
  icon?: string;
  color?: string;
  notes?: string;
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      const orgId = state.user?.organization_id;
      if (!orgId) throw new Error('No organization');

      // Si se marca como default, quitar default de las demás
      if (input.is_default) {
        await (supabase as any)
          .from('financial_accounts')
          .update({ is_default: false })
          .eq('organization_id', orgId);
      }

      const { data, error } = await (supabase as any)
        .from('financial_accounts')
        .insert({ ...input, organization_id: orgId, currency: input.currency ?? 'COP' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}

// ─── Hook: actualizar cuenta ──────────────────────────────────────────────────

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateAccountInput> & { id: string }) => {
      const orgId = state.user?.organization_id;

      if (input.is_default && orgId) {
        await (supabase as any)
          .from('financial_accounts')
          .update({ is_default: false })
          .eq('organization_id', orgId);
      }

      const { data, error } = await (supabase as any)
        .from('financial_accounts')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}

// ─── Hook: eliminar cuenta (soft: desactivar) ────────────────────────────────

export function useDeactivateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('financial_accounts')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
    },
  });
}

// ─── Helpers de presentación ──────────────────────────────────────────────────

export const ACCOUNT_TYPE_LABELS: Record<FinancialAccount['type'], string> = {
  cash:           'Efectivo',
  bank:           'Cuenta Bancaria',
  digital_wallet: 'Billetera Digital',
  credit:         'Tarjeta de Crédito',
  investment:     'Inversión',
  other:          'Otro',
};

export const ACCOUNT_TYPE_ICONS: Record<FinancialAccount['type'], string> = {
  cash:           '💵',
  bank:           '🏦',
  digital_wallet: '📱',
  credit:         '💳',
  investment:     '📈',
  other:          '💼',
};
