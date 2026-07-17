import { useState } from 'react';
import { Zap, ToggleLeft, ToggleRight, ChevronRight, AlertCircle, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAutomationRules,
  useToggleRule,
  useDeleteRule,
  type AutomationRule,
  MODULE_LABELS,
  EVENT_LABELS,
  ACTION_LABELS,
} from '@/lib/hooks/useAutomationRules';

// ─── Tarjeta de regla ─────────────────────────────────────────────────────────

function RuleCard({
  rule,
  onToggle,
  onDelete,
}: {
  rule: AutomationRule;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rule-card ${rule.is_enabled ? 'rule-enabled' : 'rule-disabled'}`}>
      <div className="rule-card-main" onClick={() => setExpanded(p => !p)}>
        <div className="rule-status-dot" style={{ background: rule.is_enabled ? '#10B981' : '#6B7280' }} />

        <div className="rule-info">
          <div className="rule-name">{rule.name}</div>
          <div className="rule-trigger">
            <span className="rule-chip">{MODULE_LABELS[rule.trigger_module] ?? rule.trigger_module}</span>
            <span className="rule-arrow">→</span>
            <span className="rule-chip">{EVENT_LABELS[rule.trigger_event] ?? rule.trigger_event}</span>
            <span className="rule-arrow">→</span>
            <span className="rule-chip action">{ACTION_LABELS[rule.action_type] ?? rule.action_type}</span>
          </div>
          {rule.description && <div className="rule-desc">{rule.description}</div>}
        </div>

        <div className="rule-meta">
          {rule.execution_count > 0 && (
            <div className="rule-executions">
              <CheckCircle2 size={12} />
              {rule.execution_count}x
            </div>
          )}
          {rule.last_error && (
            <div className="rule-error-badge" title={rule.last_error}>
              <AlertCircle size={14} />
            </div>
          )}
          {rule.is_system && <span className="badge-system">Sistema</span>}
          <ChevronRight size={16} className={`rule-chevron ${expanded ? 'expanded' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="rule-detail">
          {rule.last_executed_at && (
            <div className="rule-detail-row">
              <Clock size={13} />
              Última ejecución: {new Date(rule.last_executed_at).toLocaleString('es-CO')}
            </div>
          )}
          {rule.last_error && (
            <div className="rule-detail-row text-danger">
              <AlertCircle size={13} />
              Error: {rule.last_error}
            </div>
          )}
          <div className="rule-detail-config">
            <strong>Configuración:</strong>
            <pre>{JSON.stringify(rule.action_config, null, 2)}</pre>
          </div>
          <div className="rule-actions">
            <button
              className={`btn-toggle ${rule.is_enabled ? 'active' : ''}`}
              onClick={() => onToggle(rule.id, !rule.is_enabled)}
            >
              {rule.is_enabled
                ? <><ToggleRight size={16} /> Desactivar</>
                : <><ToggleLeft size={16} /> Activar</>
              }
            </button>
            {!rule.is_system && (
              <button className="btn-danger-ghost" onClick={() => onDelete(rule.id)}>
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel principal de automatizaciones ─────────────────────────────────────

export function RulesPanel() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();

  const enabledCount = rules.filter(r => r.is_enabled).length;
  const disabledCount = rules.filter(r => !r.is_enabled).length;
  const totalExecutions = rules.reduce((s, r) => s + r.execution_count, 0);

  // Agrupar por módulo
  const byModule: Record<string, AutomationRule[]> = {};
  for (const rule of rules) {
    if (!byModule[rule.trigger_module]) byModule[rule.trigger_module] = [];
    byModule[rule.trigger_module].push(rule);
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleRule.mutateAsync({ id, is_enabled: enabled });
      toast.success(enabled ? 'Automatización activada' : 'Automatización desactivada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta regla? Esta acción no se puede deshacer.')) return;
    try {
      await deleteRule.mutateAsync(id);
      toast.success('Regla eliminada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="panel-loading">
        <div className="spinner" />
        <p>Cargando automatizaciones...</p>
      </div>
    );
  }

  return (
    <div className="rules-panel">
      {/* Header con stats */}
      <div className="rules-header">
        <div>
          <h3 className="rules-title">
            <Zap size={20} />
            Motor de Automatizaciones
          </h3>
          <p className="rules-subtitle">
            Las automatizaciones procesan eventos de los módulos de GaitFlow y generan movimientos financieros, notificaciones y tareas de forma automática.
          </p>
        </div>
        <button className="btn-primary" disabled title="Próximamente">
          <Plus size={16} /> Nueva regla
        </button>
      </div>

      {/* Stats */}
      <div className="rules-stats">
        <div className="rule-stat-card">
          <div className="rule-stat-value text-success">{enabledCount}</div>
          <div className="rule-stat-label">Activas</div>
        </div>
        <div className="rule-stat-card">
          <div className="rule-stat-value text-muted">{disabledCount}</div>
          <div className="rule-stat-label">Desactivadas</div>
        </div>
        <div className="rule-stat-card">
          <div className="rule-stat-value text-accent">{totalExecutions}</div>
          <div className="rule-stat-label">Ejecuciones totales</div>
        </div>
      </div>

      {/* Reglas agrupadas por módulo */}
      {Object.entries(byModule).map(([module, moduleRules]) => (
        <div key={module} className="rules-group">
          <div className="rules-group-header">
            {MODULE_LABELS[module] ?? module}
          </div>
          <div className="rules-list">
            {moduleRules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ))}

      {rules.length === 0 && (
        <div className="empty-state">
          <Zap size={40} />
          <h3>Sin automatizaciones configuradas</h3>
          <p>Las automatizaciones se crearán automáticamente al ejecutar la migración SQL de Fase 2.</p>
        </div>
      )}
    </div>
  );
}
