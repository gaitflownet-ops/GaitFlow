import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, ChevronDown, Trash2 } from 'lucide-react';
import type { FinancialTransaction, TransactionStatus } from '@/lib/financial/types';
import { formatCOP, TRANSACTION_STATUSES } from '@/lib/financial/types';
import { useUpdateTransactionStatus, useDeleteTransaction } from '@/lib/hooks/useFinancialCenter';

interface TransactionListProps {
  transactions: FinancialTransaction[];
  isLoading?: boolean;
}

const STATUS_ICON: Record<TransactionStatus, typeof CheckCircle2> = {
  completed:  CheckCircle2,
  pending:    Clock,
  cancelled:  XCircle,
  reconciled: CheckCircle2,
};

function TransactionRow({ tx }: { tx: FinancialTransaction }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const updateStatus = useUpdateTransactionStatus();
  const deleteTx = useDeleteTransaction();

  const isIncome = tx.type === 'income';
  const cat = (tx as any).category;
  const contact = (tx as any).contact;
  const horse = (tx as any).horse;
  const statusDef = TRANSACTION_STATUSES.find(s => s.value === tx.status);
  const StatusIcon = STATUS_ICON[tx.status] ?? CheckCircle2;

  const dateStr = tx.date
    ? new Date(tx.date + 'T12:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <div className="flex items-center gap-3 py-3.5 px-5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors group">
      {/* Indicator */}
      <div
        className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-base`}
        style={{ backgroundColor: cat?.color ? `${cat.color}18` : undefined }}
      >
        {cat?.icon ?? (isIncome ? '💰' : '💸')}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{tx.description || cat?.name || '—'}</span>
          {tx.source_module && tx.source_module !== 'manual' && tx.source_module !== 'legacy_invoices' && tx.source_module !== 'legacy_expenses' && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              auto
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
          {cat && <span>{cat.name}</span>}
          {contact && <><span>·</span><span>{contact.name}</span></>}
          {horse && <><span>·</span><span>🐴 {horse.name}</span></>}
          <span>·</span>
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="relative shrink-0">
        <button
          onClick={() => setStatusOpen(v => !v)}
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${statusDef?.bg ?? ''} ${statusDef?.color ?? ''} hover:opacity-80`}
        >
          <StatusIcon className="h-3 w-3" />
          {statusDef?.label ?? tx.status}
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>

        {statusOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-border bg-card shadow-[var(--shadow-modal)] overflow-hidden z-20">
            {TRANSACTION_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => {
                  updateStatus.mutate({ id: tx.id, status: s.value });
                  setStatusOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors ${s.color}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right min-w-[100px]">
        <div
          className={`font-display font-semibold text-base ${
            isIncome ? 'text-emerald-500' : 'text-foreground'
          }`}
        >
          {isIncome ? '+' : '−'} {formatCOP(tx.amount)}
        </div>
        <div className="text-[10px] text-muted-foreground">{tx.currency}</div>
      </div>

      {/* Delete */}
      <button
        onClick={() => {
          if (confirm('¿Eliminar este movimiento? No se borrará físicamente.')) {
            deleteTx.mutate(tx.id);
          }
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full grid place-items-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="lux-card overflow-hidden animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 p-5 border-b border-border/50">
            <div className="h-9 w-9 rounded-xl bg-secondary shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 bg-secondary rounded" />
              <div className="h-3 w-24 bg-secondary/60 rounded" />
            </div>
            <div className="h-4 w-20 bg-secondary rounded shrink-0" />
            <div className="h-5 w-24 bg-secondary rounded shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="lux-card p-12 text-center">
        <div className="text-4xl mb-3">💸</div>
        <p className="font-medium text-foreground">Sin movimientos</p>
        <p className="text-sm text-muted-foreground mt-1">
          Registra tu primer ingreso o gasto para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="lux-card overflow-hidden">
      {transactions.map(tx => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}
