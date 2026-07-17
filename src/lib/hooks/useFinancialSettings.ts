/**
 * GaitFlow — Financial Settings Hook
 * Configuración financiera de la organización
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useApp } from '../store';

export interface FinancialSettings {
  id: string;
  organization_id: string;
  default_currency: string;
  supported_currencies: string[];
  invoice_prefix: string;
  invoice_sequence: number;
  default_tax_rate: number;
  tax_name: string;
  tax_included_in_price: boolean;
  fiscal_info: Record<string, any>;
  regional_settings: Record<string, any>;
  fiscal_year_start: string;
  payment_reminder_days: number[];
  dashboard_config: Record<string, any>;
  created_at: string | null;
  updated_at: string | null;
}

const DEFAULT_SETTINGS: Partial<FinancialSettings> = {
  default_currency: 'COP',
  supported_currencies: ['COP'],
  invoice_prefix: 'GF',
  invoice_sequence: 1,
  default_tax_rate: 0,
  tax_name: 'IVA',
  tax_included_in_price: false,
  fiscal_info: {},
  regional_settings: { date_format: 'DD/MM/YYYY', thousands_separator: '.', decimal_separator: ',' },
  fiscal_year_start: '01-01',
  payment_reminder_days: [3, 7, 15],
  dashboard_config: {
    kpis: ['income_month', 'expense_month', 'balance', 'pending', 'overdue', 'total_transactions'],
    chart_months: 6,
    show_cost_centers: true,
  },
};

export function useFinancialSettings() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<FinancialSettings>({
    queryKey: ['financial-settings', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) throw new Error('No organization');

      const { data, error } = await (supabase as any)
        .from('financial_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;

      // Si no existe aún, devolver defaults
      if (!data) {
        return { ...DEFAULT_SETTINGS, organization_id: orgId } as FinancialSettings;
      }

      return data as FinancialSettings;
    },
  });
}

export function useUpdateFinancialSettings() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (updates: Partial<FinancialSettings>) => {
      const orgId = state.user?.organization_id;
      if (!orgId) throw new Error('No organization');

      const { data, error } = await (supabase as any)
        .from('financial_settings')
        .upsert({ ...updates, organization_id: orgId }, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-settings'] });
    },
  });
}
