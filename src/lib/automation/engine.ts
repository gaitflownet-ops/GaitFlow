/**
 * GaitFlow — Automation Engine
 * Motor de automatizaciones cross-módulo.
 *
 * Este motor NO es exclusivo de finanzas. En el futuro manejará:
 * CRM, Marketplace, Vault, Notificaciones, Tasks, Emails, Auditoría.
 *
 * Uso:
 *   import { AutomationEngine } from '@/lib/automation/engine';
 *   await AutomationEngine.apply({ module: 'health', event: 'create', ... });
 */

import { supabase } from '@/lib/supabase';

// ─── Tipos del motor ──────────────────────────────────────────────────────────

export type AutomationModule =
  | 'health'
  | 'nutrition'
  | 'marketplace'
  | 'breeding'
  | 'competitions'
  | 'locations'
  | 'crm'
  | 'vault'
  | 'tasks'
  | 'financial';

export type AutomationEvent =
  | 'create'
  | 'update'
  | 'complete'
  | 'cancel'
  | 'status_change'
  | 'payment_received'
  | 'delivery_confirmed'
  | 'sale_complete'
  | 'service_confirmed'
  | 'registration_created';

export interface AutomationContext {
  module: AutomationModule;
  event: AutomationEvent;
  orgId: string;
  userId: string;
  record: Record<string, any>;  // el registro que disparó la regla
  horseId?: string;
  contactId?: string;
  amount?: number;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger_conditions: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  priority: number;
  execution_count?: number;
  last_executed_at?: string | null;
  last_error?: string | null;
}

// ─── Evaluador de condiciones ─────────────────────────────────────────────────

function evaluateConditions(
  conditions: Record<string, any>,
  record: Record<string, any>
): boolean {
  // {} → siempre aplica
  if (!conditions || Object.keys(conditions).length === 0) return true;

  const { field, operator, value } = conditions;
  if (!field) return true;

  const recordValue = record[field];

  switch (operator) {
    case 'gt':      return Number(recordValue) > Number(value);
    case 'gte':     return Number(recordValue) >= Number(value);
    case 'lt':      return Number(recordValue) < Number(value);
    case 'lte':     return Number(recordValue) <= Number(value);
    case 'eq':      return String(recordValue) === String(value);
    case 'neq':     return String(recordValue) !== String(value);
    case 'exists':  return recordValue !== null && recordValue !== undefined && recordValue !== '';
    case 'in':      return Array.isArray(value) && value.includes(recordValue);
    default:        return true;
  }
}

// ─── Interpolador de plantillas ───────────────────────────────────────────────
// Convierte "Consulta — {{horse_name}}" en "Consulta — Carbonero"

function interpolate(template: string, context: AutomationContext): string {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(context.record[key] ?? context[key as keyof AutomationContext] ?? `{{${key}}}`);
  });
}

// ─── Ejecutores de acciones ───────────────────────────────────────────────────

async function executeCreateTransaction(
  config: Record<string, any>,
  context: AutomationContext,
  rule: AutomationRule
): Promise<void> {
  let amount: number = 0;

  if (config.amount_source === 'fixed') {
    amount = Number(config.amount_fixed ?? 0);
  } else if (config.amount_source === 'from_record') {
    amount = Number(context.record[config.amount_field] ?? 0);
  } else if (config.amount_source === 'formula') {
    // Extensible para fórmulas futuras
    amount = Number(context.amount ?? 0);
  }

  // Si el monto es 0 y el amount_source es 'from_record', no crear transacción vacía
  if (amount <= 0 && config.amount_source === 'from_record') return;

  const description = interpolate(config.description_template || rule.name, context);

  const { error } = await (supabase as any)
    .from('financial_transactions')
    .insert({
      organization_id: context.orgId,
      type: config.type ?? 'expense',
      category_id: config.category_id ?? null,
      cost_center_id: config.cost_center_id ?? null,
      account_id: config.account_id ?? null,
      amount: Math.abs(amount),
      currency: config.currency ?? 'COP',
      exchange_rate: 1,
      description,
      date: new Date().toISOString().split('T')[0],
      status: config.status ?? 'completed',
      horse_id: context.horseId ?? null,
      contact_id: context.contactId ?? null,
      source_module: context.module,
      source_ref_id: context.record.id ?? null,
      source_ref_type: context.module,
      created_by: context.userId,
      is_deleted: false,
    });

  if (error) throw new Error(`[AutomationEngine] create_transaction: ${error.message}`);
}

async function executeSendNotification(
  config: Record<string, any>,
  context: AutomationContext
): Promise<void> {
  const title = interpolate(config.title_template || 'Automatización ejecutada', context);
  const body  = interpolate(config.body_template  || '', context);

  await (supabase as any)
    .from('notifications')
    .insert({
      user_id: context.userId,
      organization_id: context.orgId,
      title,
      body,
      kind: config.kind ?? 'financial',
      read: false,
      at: new Date().toISOString(),
    });
}

async function executeCreateTask(
  config: Record<string, any>,
  context: AutomationContext
): Promise<void> {
  const title = interpolate(config.title_template || 'Tarea automática', context);
  const dueDate = config.due_days
    ? new Date(Date.now() + config.due_days * 86400000).toISOString().split('T')[0]
    : null;

  await (supabase as any)
    .from('tasks')
    .insert({
      organization_id: context.orgId,
      title,
      priority: config.priority ?? 'medium',
      status: 'pending',
      due_date: dueDate,
      horse_id: context.horseId ?? null,
    });
}

async function executeCreateActivity(
  config: Record<string, any>,
  context: AutomationContext
): Promise<void> {
  const action  = interpolate(config.action_template  || context.module, context);
  const details = interpolate(config.details_template || '', context);

  await (supabase as any)
    .from('activities')
    .insert({
      organization_id: context.orgId,
      user_id: context.userId,
      action,
      details,
    });
}

// ─── Motor principal ──────────────────────────────────────────────────────────

async function apply(context: AutomationContext): Promise<void> {
  try {
    // 1. Buscar reglas activas para este módulo + evento
    const { data: rules, error } = await (supabase as any)
      .from('automation_rules')
      .select('id, name, trigger_conditions, action_type, action_config, priority')
      .eq('organization_id', context.orgId)
      .eq('trigger_module', context.module)
      .eq('trigger_event', context.event)
      .eq('is_enabled', true)
      .order('priority', { ascending: false });

    if (error || !rules?.length) return;

    // 2. Filtrar por condiciones y ejecutar en orden de prioridad
    for (const rule of rules as AutomationRule[]) {
      const conditionsMet = evaluateConditions(rule.trigger_conditions, context.record);
      if (!conditionsMet) continue;

      try {
        switch (rule.action_type) {
          case 'create_transaction':
            await executeCreateTransaction(rule.action_config, context, rule);
            break;
          case 'send_notification':
            await executeSendNotification(rule.action_config, context);
            break;
          case 'create_task':
            await executeCreateTask(rule.action_config, context);
            break;
          case 'create_activity':
            await executeCreateActivity(rule.action_config, context);
            break;
          // Futuros: 'create_invoice', 'update_contact', 'trigger_webhook', 'send_email'
          default:
            console.warn(`[AutomationEngine] Tipo de acción desconocido: ${rule.action_type}`);
        }

        // Actualizar métricas de la regla (sin bloquear el flujo principal)
        (supabase as any)
          .from('automation_rules')
          .update({
            execution_count: rule.execution_count + 1,
            last_executed_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', rule.id)
          .then(() => {});

      } catch (ruleError: any) {
        // Registrar el error en la regla pero NO interrumpir la operación principal
        console.error(`[AutomationEngine] Error en regla "${rule.name}":`, ruleError.message);
        (supabase as any)
          .from('automation_rules')
          .update({ last_error: ruleError.message })
          .eq('id', rule.id)
          .then(() => {});
      }
    }
  } catch (err: any) {
    // El motor NUNCA debe romper el flujo principal de la app
    console.error('[AutomationEngine] Error general:', err.message);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const AutomationEngine = { apply };
