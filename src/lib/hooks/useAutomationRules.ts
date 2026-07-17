/**
 * GaitFlow — Automation Rules Hook
 * CRUD del motor de automatizaciones
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useApp } from '../store';

export interface AutomationRule {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  is_system: boolean;
  priority: number;
  trigger_module: string;
  trigger_event: string;
  trigger_conditions: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  execution_count: number;
  last_executed_at: string | null;
  last_error: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const MODULE_LABELS: Record<string, string> = {
  health:       '🩺 Veterinaria',
  nutrition:    '🌾 Nutrición',
  marketplace:  '🛒 Marketplace',
  breeding:     '🧬 Reproducción',
  competitions: '🏆 Competencias',
  locations:    '📍 Instalaciones',
  crm:          '👤 CRM',
  vault:        '📄 Documentos',
  tasks:        '✅ Tareas',
  financial:    '💰 Financiero',
};

export const EVENT_LABELS: Record<string, string> = {
  create:               'Al crear',
  update:               'Al actualizar',
  complete:             'Al completar',
  cancel:               'Al cancelar',
  status_change:        'Al cambiar estado',
  payment_received:     'Al recibir pago',
  delivery_confirmed:   'Al confirmar entrega',
  sale_complete:        'Al completar venta',
  service_confirmed:    'Al confirmar servicio',
  registration_created: 'Al inscribir',
};

export const ACTION_LABELS: Record<string, string> = {
  create_transaction: '💸 Crear movimiento financiero',
  create_invoice:     '🧾 Generar factura',
  send_notification:  '🔔 Enviar notificación',
  create_task:        '✅ Crear tarea',
  create_activity:    '📋 Registrar actividad',
  update_contact:     '👤 Actualizar contacto',
  trigger_webhook:    '🔗 Disparar webhook',
};

// ─── Hook: lista de reglas ────────────────────────────────────────────────────

export function useAutomationRules() {
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  return useQuery<AutomationRule[]>({
    queryKey: ['automation-rules', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from('automation_rules')
        .select('*')
        .eq('organization_id', orgId)
        .order('priority', { ascending: false })
        .order('trigger_module');
      if (error) throw error;
      return (data ?? []) as AutomationRule[];
    },
  });
}

// ─── Mutación: toggle is_enabled ─────────────────────────────────────────────

export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from('automation_rules')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });
}

// ─── Mutación: crear regla personalizada ─────────────────────────────────────

export interface CreateRuleInput {
  name: string;
  description?: string;
  trigger_module: string;
  trigger_event: string;
  trigger_conditions?: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  priority?: number;
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  const { state } = useApp();

  return useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      const orgId = state.user?.organization_id;
      const userId = state.user?.id;
      if (!orgId) throw new Error('No organization');

      const { data, error } = await (supabase as any)
        .from('automation_rules')
        .insert({
          ...input,
          organization_id: orgId,
          created_by: userId,
          is_system: false,
          is_enabled: true,
          trigger_conditions: input.trigger_conditions ?? {},
          priority: input.priority ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });
}

// ─── Mutación: eliminar regla personalizada (no las del sistema) ──────────────

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('automation_rules')
        .delete()
        .eq('id', id)
        .eq('is_system', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });
}
