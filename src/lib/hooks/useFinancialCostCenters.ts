/**
 * GaitFlow — Financial Cost Centers Hook
 * CRUD de centros de costo (la tabla ya existe desde la migración 017)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useApp } from '../store';

export interface FinancialCostCenter {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  type: 'breeding' | 'training' | 'admin' | 'competitions' | 'marketing' | 'maintenance' | 'general' | 'other';
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export const COST_CENTER_TYPE_LABELS: Record<FinancialCostCenter['type'], string> = {
  breeding:    '🧬 Reproducción',
  training:    '🏇 Entrenamiento',
  admin:       '🏢 Administración',
  competitions:'🏆 Competencias',
  marketing:   '📢 Marketing',
  maintenance: '🔧 Mantenimiento',
  general:     '📦 General',
  other:       '🔄 Otro',
};

export function useFinancialCostCenters() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<FinancialCostCenter[]>({
    queryKey: ['financial-cost-centers', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from('financial_cost_centers')
        .select('*')
        .eq('organization_id', orgId)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as FinancialCostCenter[];
    },
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (input: Omit<FinancialCostCenter, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      const orgId = state.user?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await (supabase as any)
        .from('financial_cost_centers')
        .insert({ ...input, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-cost-centers'] }),
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<FinancialCostCenter> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('financial_cost_centers')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-cost-centers'] }),
  });
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('financial_cost_centers')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-cost-centers'] }),
  });
}
