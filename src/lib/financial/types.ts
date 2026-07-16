/**
 * GaitFlow — Centro Financiero
 * Definiciones de tipos y constantes financieras
 */

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export type TransactionStatus = 'completed' | 'pending' | 'cancelled' | 'reconciled';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'card'
  | 'check'
  | 'nequi'
  | 'daviplata'
  | 'crypto'
  | 'other';

// ─── Categorías financieras predefinidas ──────────────────────────────────────

export interface FinancialCategoryDef {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  sortOrder: number;
  sourceModule?: string;
}

export const INCOME_CATEGORIES: FinancialCategoryDef[] = [
  { name: 'Pensión / Alojamiento',   type: 'income', icon: '🏠', color: '#10B981', sortOrder: 1 },
  { name: 'Servicios Reproductivos', type: 'income', icon: '🧬', color: '#8B5CF6', sortOrder: 2 },
  { name: 'Venta de Animales',       type: 'income', icon: '🐴', color: '#F59E0B', sortOrder: 3 },
  { name: 'Comisión de Venta',       type: 'income', icon: '💼', color: '#3B82F6', sortOrder: 4 },
  { name: 'Entrenamiento / Monta',   type: 'income', icon: '🎠', color: '#EC4899', sortOrder: 5 },
  { name: 'Competencias',            type: 'income', icon: '🏆', color: '#F97316', sortOrder: 6 },
  { name: 'Servicios Veterinarios',  type: 'income', icon: '🩺', color: '#06B6D4', sortOrder: 7 },
  { name: 'Otros Ingresos',          type: 'income', icon: '💰', color: '#6B7280', sortOrder: 99 },
];

export const EXPENSE_CATEGORIES: FinancialCategoryDef[] = [
  { name: 'Alimentación',             type: 'expense', icon: '🌾', color: '#EF4444', sortOrder: 1,  sourceModule: 'nutrition' },
  { name: 'Veterinaria y Sanidad',    type: 'expense', icon: '🩺', color: '#F97316', sortOrder: 2,  sourceModule: 'health' },
  { name: 'Herrería',                 type: 'expense', icon: '🔨', color: '#8B5CF6', sortOrder: 3 },
  { name: 'Odontología Equina',       type: 'expense', icon: '🦷', color: '#EC4899', sortOrder: 4 },
  { name: 'Reproducción',             type: 'expense', icon: '🧬', color: '#6366F1', sortOrder: 5,  sourceModule: 'breeding' },
  { name: 'Competencias y Ferias',    type: 'expense', icon: '🏆', color: '#F59E0B', sortOrder: 6,  sourceModule: 'competitions' },
  { name: 'Personal / Nómina',        type: 'expense', icon: '👥', color: '#10B981', sortOrder: 7 },
  { name: 'Mantenimiento',            type: 'expense', icon: '🔧', color: '#06B6D4', sortOrder: 8 },
  { name: 'Transporte',               type: 'expense', icon: '🚚', color: '#3B82F6', sortOrder: 9 },
  { name: 'Servicios Públicos',       type: 'expense', icon: '💡', color: '#84CC16', sortOrder: 10 },
  { name: 'Seguros',                  type: 'expense', icon: '🛡️', color: '#0EA5E9', sortOrder: 11 },
  { name: 'Administración',           type: 'expense', icon: '📋', color: '#71717A', sortOrder: 12 },
  { name: 'Medicamentos y Farmacia',  type: 'expense', icon: '💊', color: '#DC2626', sortOrder: 13, sourceModule: 'health' },
  { name: 'Suplementos Nutricionales',type: 'expense', icon: '🧪', color: '#D97706', sortOrder: 14, sourceModule: 'nutrition' },
  { name: 'Otros Gastos',             type: 'expense', icon: '📌', color: '#9CA3AF', sortOrder: 99 },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

// ─── Métodos de pago ──────────────────────────────────────────────────────────

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash',          label: 'Efectivo',            icon: '💵' },
  { value: 'bank_transfer', label: 'Transferencia Bancaria', icon: '🏦' },
  { value: 'card',          label: 'Tarjeta',             icon: '💳' },
  { value: 'nequi',         label: 'Nequi',               icon: '📱' },
  { value: 'daviplata',     label: 'Daviplata',           icon: '📲' },
  { value: 'check',         label: 'Cheque',              icon: '📄' },
  { value: 'other',         label: 'Otro',                icon: '💱' },
];

// ─── Estados de transacción ───────────────────────────────────────────────────

export const TRANSACTION_STATUSES: {
  value: TransactionStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: 'completed',   label: 'Completado', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'pending',     label: 'Pendiente',  color: 'text-amber-600',   bg: 'bg-amber-500/10 border-amber-500/20' },
  { value: 'cancelled',   label: 'Cancelado',  color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/20' },
  { value: 'reconciled',  label: 'Conciliado', color: 'text-blue-600',    bg: 'bg-blue-500/10 border-blue-500/20' },
];

// ─── Formato de moneda COP ────────────────────────────────────────────────────

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCOPCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return formatCOP(amount);
}

// ─── Interfaz principal de transacción ───────────────────────────────────────

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  type: TransactionType;
  category_id: string | null;
  cost_center_id: string | null;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  description: string | null;
  date: string;
  status: TransactionStatus;
  payment_method: PaymentMethod | null;
  contact_id: string | null;
  horse_id: string | null;
  invoice_id: string | null;
  document_id: string | null;
  location_id: string | null;
  location_type: string | null;
  competition_id: string | null;
  breeding_record_id: string | null;
  source_module: string | null;
  source_ref_id: string | null;
  source_ref_type: string | null;
  tags: string[] | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  category?: FinancialCategory | null;
  contact?: { id: string; name: string } | null;
  horse?: { id: string; name: string } | null;
}

export interface FinancialCategory {
  id: string;
  organization_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  source_module: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string | null;
}

export interface FinancialKPIs {
  incomeMonth: number;
  expenseMonth: number;
  balance: number;
  pending: number;
  overdue: number;
  totalTransactions: number;
  incomeLastMonth: number;
  expenseLastMonth: number;
}

export interface MonthlyChartPoint {
  month: string;
  income: number;
  expense: number;
}
