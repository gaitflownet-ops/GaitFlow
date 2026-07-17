import { useState } from 'react';
import { Plus, Target, Pencil, Trash2, TrendingUp, TrendingDown, Briefcase, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  useFinancialCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
  type FinancialCostCenter,
  COST_CENTER_TYPE_LABELS,
} from '@/lib/hooks/useFinancialCostCenters';

function CostCenterForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<FinancialCostCenter>;
  onSubmit: (v: Omit<FinancialCostCenter, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    type: initial?.type ?? ('general' as FinancialCostCenter['type']),
    parent_id: initial?.parent_id ?? null,
    is_active: initial?.is_active ?? true,
    sort_order: initial?.sort_order ?? 0,
  });

  return (
    <div className="account-form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Veterinaria y Sanidad" />
        </div>
        <div className="form-group">
          <label>Tipo</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as FinancialCostCenter['type'] }))}>
            {Object.entries(COST_CENTER_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea rows={2} value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="¿Qué tipo de gastos/ingresos agrupa este centro?" />
      </div>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel} type="button">Cancelar</button>
        <button className="btn-primary" disabled={!form.name || loading} onClick={() => onSubmit(form)} type="button">
          {loading ? 'Guardando...' : 'Guardar centro de costo'}
        </button>
      </div>
    </div>
  );
}

function CostCenterCard({
  center,
  onEdit,
  onDelete,
}: {
  center: FinancialCostCenter;
  onEdit: (c: FinancialCostCenter) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const label = COST_CENTER_TYPE_LABELS[center.type];

  return (
    <div className="cost-center-card">
      <div className="cost-center-icon">{label.split(' ')[0]}</div>
      <div className="cost-center-body">
        <div className="cost-center-name">{center.name}</div>
        <div className="cost-center-type">{label.replace(/^\S+\s/, '')}</div>
        {center.description && <div className="cost-center-desc">{center.description}</div>}
      </div>
      <div className="account-menu-wrapper">
        <button className="btn-icon-ghost" onClick={() => setMenuOpen(p => !p)}>
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="dropdown-menu">
            <button onClick={() => { setMenuOpen(false); onEdit(center); }}>
              <Pencil size={14} /> Editar
            </button>
            <button className="text-danger" onClick={() => { setMenuOpen(false); onDelete(center.id); }}>
              <Trash2 size={14} /> Desactivar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CostCentersPanel() {
  const { data: centers = [], isLoading } = useFinancialCostCenters();
  const createCenter = useCreateCostCenter();
  const updateCenter = useUpdateCostCenter();
  const deleteCenter = useDeleteCostCenter();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<FinancialCostCenter | null>(null);

  const active = centers.filter(c => c.is_active);

  const handleCreate = async (input: any) => {
    try {
      await createCenter.mutateAsync(input);
      toast.success('Centro de costo creado');
      setShowForm(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdate = async (input: any) => {
    if (!editTarget) return;
    try {
      await updateCenter.mutateAsync({ id: editTarget.id, ...input });
      toast.success('Centro actualizado');
      setEditTarget(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar este centro de costo?')) return;
    try {
      await deleteCenter.mutateAsync(id);
      toast.success('Centro desactivado');
    } catch (err: any) { toast.error(err.message); }
  };

  if (isLoading) return <div className="panel-loading"><div className="spinner" /><p>Cargando...</p></div>;

  return (
    <div className="accounts-panel">
      <div className="accounts-summary">
        <div className="summary-stat">
          <Target size={20} />
          <div>
            <div className="summary-label">Centros activos</div>
            <div className="summary-value">{active.length}</div>
          </div>
        </div>
        <div className="summary-stat">
          <Briefcase size={20} />
          <div>
            <div className="summary-label">Uso</div>
            <div className="summary-value">Clasificación de gastos e ingresos</div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Nuevo Centro
        </button>
      </div>

      {(showForm || editTarget) && (
        <div className="form-card">
          <h3>{editTarget ? 'Editar centro de costo' : 'Nuevo centro de costo'}</h3>
          <CostCenterForm
            initial={editTarget ?? undefined}
            onSubmit={editTarget ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditTarget(null); }}
            loading={createCenter.isPending || updateCenter.isPending}
          />
        </div>
      )}

      {active.length === 0 ? (
        <div className="empty-state">
          <Target size={40} />
          <h3>Sin centros de costo</h3>
          <p>Los centros de costo permiten clasificar ingresos y gastos por área de la operación.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Crear primer centro
          </button>
        </div>
      ) : (
        <div className="cost-centers-grid">
          {active.map(c => (
            <CostCenterCard key={c.id} center={c} onEdit={a => { setEditTarget(a); setShowForm(false); }} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
