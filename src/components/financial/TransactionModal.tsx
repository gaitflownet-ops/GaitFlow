import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Modal } from '@/components/modals/Modal';
import {
  type TransactionType,
  type TransactionStatus,
  type PaymentMethod,
  type FinancialCategory,
  PAYMENT_METHODS,
} from '@/lib/financial/types';
import {
  useCreateTransaction,
  type CreateTransactionInput,
} from '@/lib/hooks/useFinancialCenter';
import { useHorses } from '@/lib/hooks/useHorses';
import { useContacts } from '@/lib/hooks/useCRM';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  categories: FinancialCategory[];
  defaultType?: TransactionType;
}

const LABEL = {
  className: 'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5',
};
const INPUT = {
  className:
    'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors',
};

export function TransactionModal({
  open,
  onClose,
  categories,
  defaultType = 'expense',
}: TransactionModalProps) {
  const createTx = useCreateTransaction();
  const { data: horses = [] } = useHorses();
  const { data: contacts = [] } = useContacts();

  const [type, setType]             = useState<TransactionType>(defaultType);
  const [amount, setAmount]         = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus]         = useState<TransactionStatus>('completed');
  const [payMethod, setPayMethod]   = useState<PaymentMethod | ''>('');
  const [contactId, setContactId]   = useState('');
  const [horseId, setHorseId]       = useState('');
  const [notes, setNotes]           = useState('');
  const [error, setError]           = useState('');

  // Reset when opening
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setAmount('');
      setDescription('');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('completed');
      setPayMethod('');
      setContactId('');
      setHorseId('');
      setNotes('');
      setError('');
    }
  }, [open, defaultType]);

  // Auto-select first category of the type
  useEffect(() => {
    const first = categories.find(c => c.type === type);
    if (first) setCategoryId(first.id);
  }, [type, categories]);

  const filteredCats = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount.replace(/[^\d.,-]/g, '').replace(',', '.'));
    if (!amt || amt <= 0) { setError('El monto debe ser mayor a cero'); return; }
    if (!description.trim()) { setError('La descripción es obligatoria'); return; }

    const input: CreateTransactionInput = {
      type,
      amount: amt,
      description: description.trim(),
      date,
      category_id:    categoryId || null,
      status,
      payment_method: payMethod as PaymentMethod || null,
      contact_id:     contactId || null,
      horse_id:       horseId || null,
      notes:          notes.trim() || null,
    };

    try {
      await createTx.mutateAsync(input);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
    >
      <div className="p-6">
        {/* Type toggle */}
        <div className="flex rounded-xl bg-secondary p-1 mb-6">
          {(['income', 'expense'] as TransactionType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                type === t
                  ? t === 'income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-red-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'income' ? (
                <><TrendingUp className="h-4 w-4" /> Ingreso</>
              ) : (
                <><TrendingDown className="h-4 w-4" /> Gasto</>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description + Amount */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL.className}>Descripción *</label>
              <input
                {...INPUT}
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={type === 'income' ? 'Ej. Pensión Enero — Hacienda El Nogal' : 'Ej. Vacuna contra influenza — Carbonero'}
              />
            </div>

            <div>
              <label className={LABEL.className}>Monto (COP) *</label>
              <input
                {...INPUT}
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1.500.000"
              />
            </div>

            <div>
              <label className={LABEL.className}>Fecha *</label>
              <input
                {...INPUT}
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL.className}>Categoría</label>
              <select
                {...INPUT}
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Sin categoría</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL.className}>Estado</label>
              <select
                {...INPUT}
                value={status}
                onChange={e => setStatus(e.target.value as TransactionStatus)}
              >
                <option value="completed">✅ Completado</option>
                <option value="pending">⏳ Pendiente</option>
                <option value="cancelled">❌ Cancelado</option>
                <option value="reconciled">🔵 Conciliado</option>
              </select>
            </div>
          </div>

          {/* Payment method + Contact */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL.className}>Método de pago</label>
              <select
                {...INPUT}
                value={payMethod}
                onChange={e => setPayMethod(e.target.value as PaymentMethod)}
              >
                <option value="">Sin especificar</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.icon} {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL.className}>
                {type === 'income' ? 'Cliente (CRM)' : 'Proveedor (CRM)'}
              </label>
              <select
                {...INPUT}
                value={contactId}
                onChange={e => setContactId(e.target.value)}
              >
                <option value="">Sin vincular</option>
                {contacts.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Horse */}
          <div>
            <label className={LABEL.className}>Ejemplar asociado (opcional)</label>
            <select
              {...INPUT}
              value={horseId}
              onChange={e => setHorseId(e.target.value)}
            >
              <option value="">Sin ejemplar (gasto general)</option>
              {horses.map((h: any) => (
                <option key={h.id} value={h.id}>🐴 {h.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL.className}>Notas internas</label>
            <textarea
              className={`${INPUT.className} resize-none`}
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Información adicional..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={createTx.isPending}
            className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-all ${
              type === 'income'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-red-500 hover:bg-red-600'
            } disabled:opacity-60`}
          >
            {createTx.isPending
              ? 'Guardando...'
              : type === 'income'
              ? '+ Registrar Ingreso'
              : '− Registrar Gasto'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
