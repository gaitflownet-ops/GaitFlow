import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet, Star, MoreVertical, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useFinancialAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeactivateAccount,
  type AccountWithBalance,
  type CreateAccountInput,
  ACCOUNT_TYPE_LABELS,
} from '@/lib/hooks/useFinancialAccounts';

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ─── Formulario de cuenta ─────────────────────────────────────────────────────

function AccountForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<CreateAccountInput>;
  onSubmit: (v: CreateAccountInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<CreateAccountInput>({
    name: initial?.name ?? '',
    type: initial?.type ?? 'cash',
    currency: 'COP',
    bank_name: initial?.bank_name ?? '',
    account_number: initial?.account_number ?? '',
    initial_balance: initial?.initial_balance ?? 0,
    is_default: initial?.is_default ?? false,
    icon: initial?.icon ?? '',
    color: initial?.color ?? '#6366F1',
    notes: initial?.notes ?? '',
  });

  const set = (k: keyof CreateAccountInput, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="account-form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre de la cuenta *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Bancolombia Principal" />
        </div>
        <div className="form-group">
          <label>Tipo *</label>
          <select value={form.type} onChange={e => set('type', e.target.value as any)}>
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      {(form.type === 'bank' || form.type === 'credit') && (
        <div className="form-row">
          <div className="form-group">
            <label>Banco</label>
            <input value={form.bank_name ?? ''} onChange={e => set('bank_name', e.target.value)} placeholder="Bancolombia, Davivienda..." />
          </div>
          <div className="form-group">
            <label>Últimos 4 dígitos</label>
            <input value={form.account_number ?? ''} onChange={e => set('account_number', e.target.value)} placeholder="****1234" maxLength={10} />
          </div>
        </div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label>Saldo inicial (COP)</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={form.initial_balance}
            onChange={e => set('initial_balance', Number(e.target.value))}
          />
          <small>El saldo actual se calcula dinámicamente: saldo inicial + ingresos − gastos</small>
        </div>
        <div className="form-group">
          <label>Color</label>
          <input type="color" value={form.color ?? '#6366F1'} onChange={e => set('color', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>
          <input type="checkbox" checked={form.is_default ?? false} onChange={e => set('is_default', e.target.checked)} />
          {' '}Usar como cuenta predeterminada para nuevas transacciones
        </label>
      </div>
      <div className="form-group">
        <label>Notas</label>
        <textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Descripción o información adicional..." />
      </div>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel} type="button">Cancelar</button>
        <button
          className="btn-primary"
          disabled={!form.name || loading}
          onClick={() => onSubmit(form)}
          type="button"
        >
          {loading ? 'Guardando...' : 'Guardar cuenta'}
        </button>
      </div>
    </div>
  );
}

// ─── Tarjeta de cuenta ────────────────────────────────────────────────────────

function AccountCard({
  account,
  onEdit,
  onDeactivate,
}: {
  account: AccountWithBalance;
  onEdit: (a: AccountWithBalance) => void;
  onDeactivate: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPositive = account.computed_balance >= 0;

  return (
    <div className="account-card" style={{ borderTopColor: account.color ?? '#6366F1' }}>
      <div className="account-card-header">
        <div className="account-card-icon" style={{ background: `${account.color ?? '#6366F1'}20`, color: account.color ?? '#6366F1' }}>
          {account.icon ?? '🏦'}
        </div>
        <div className="account-card-info">
          <div className="account-name">
            {account.name}
            {account.is_default && <span className="badge-default"><Star size={10} /> Principal</span>}
          </div>
          <div className="account-type">{ACCOUNT_TYPE_LABELS[account.type]}</div>
          {account.bank_name && <div className="account-bank">{account.bank_name}</div>}
        </div>
        <div className="account-menu-wrapper">
          <button className="btn-icon-ghost" onClick={() => setMenuOpen(p => !p)}>
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <button onClick={() => { setMenuOpen(false); onEdit(account); }}>
                <Pencil size={14} /> Editar
              </button>
              {!account.is_default && (
                <button className="text-danger" onClick={() => { setMenuOpen(false); onDeactivate(account.id); }}>
                  <Trash2 size={14} /> Desactivar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="account-balance" style={{ color: isPositive ? '#10B981' : '#EF4444' }}>
        {formatCOP(account.computed_balance)}
      </div>

      <div className="account-stats">
        <div className="account-stat income">
          <TrendingUp size={13} />
          <span>{formatCOP(account.income_total)}</span>
        </div>
        <div className="account-stat expense">
          <TrendingDown size={13} />
          <span>{formatCOP(account.expense_total)}</span>
        </div>
      </div>

      {account.initial_balance > 0 && (
        <div className="account-initial">
          Saldo inicial: {formatCOP(account.initial_balance)}
        </div>
      )}
    </div>
  );
}

// ─── Panel principal de cuentas ───────────────────────────────────────────────

export function AccountsPanel() {
  const { data: accounts = [], isLoading } = useFinancialAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deactivateAccount = useDeactivateAccount();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountWithBalance | null>(null);

  const totalBalance = accounts.reduce((s, a) => s + a.computed_balance, 0);

  const handleCreate = async (input: CreateAccountInput) => {
    try {
      await createAccount.mutateAsync(input);
      toast.success('Cuenta creada exitosamente');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async (input: CreateAccountInput) => {
    if (!editTarget) return;
    try {
      await updateAccount.mutateAsync({ id: editTarget.id, ...input });
      toast.success('Cuenta actualizada');
      setEditTarget(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar esta cuenta? No perderás el historial de transacciones.')) return;
    try {
      await deactivateAccount.mutateAsync(id);
      toast.success('Cuenta desactivada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="panel-loading">
        <div className="spinner" />
        <p>Cargando cuentas...</p>
      </div>
    );
  }

  return (
    <div className="accounts-panel">
      {/* Resumen */}
      <div className="accounts-summary">
        <div className="summary-stat">
          <Wallet size={20} />
          <div>
            <div className="summary-label">Balance total</div>
            <div className="summary-value" style={{ color: totalBalance >= 0 ? '#10B981' : '#EF4444' }}>
              {formatCOP(totalBalance)}
            </div>
          </div>
        </div>
        <div className="summary-stat">
          <CheckCircle size={20} />
          <div>
            <div className="summary-label">Cuentas activas</div>
            <div className="summary-value">{accounts.length}</div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Nueva Cuenta
        </button>
      </div>

      {/* Formulario */}
      {(showForm || editTarget) && (
        <div className="form-card">
          <h3>{editTarget ? 'Editar cuenta' : 'Nueva cuenta financiera'}</h3>
          <AccountForm
            initial={editTarget ?? undefined}
            onSubmit={editTarget ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditTarget(null); }}
            loading={createAccount.isPending || updateAccount.isPending}
          />
        </div>
      )}

      {/* Grid de cuentas */}
      {accounts.length === 0 ? (
        <div className="empty-state">
          <Wallet size={40} />
          <h3>Sin cuentas configuradas</h3>
          <p>Agrega tus cuentas financieras para llevar el control de tu dinero.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Crear primera cuenta
          </button>
        </div>
      ) : (
        <div className="accounts-grid">
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEdit={a => { setEditTarget(a); setShowForm(false); }}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
