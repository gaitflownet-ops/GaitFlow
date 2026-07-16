import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlyChartPoint } from '@/lib/financial/types';
import { formatCOPCompact } from '@/lib/financial/types';

interface BalanceChartProps {
  data: MonthlyChartPoint[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-modal)] text-sm">
      <div className="font-semibold mb-2 text-foreground">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">
            {entry.name === 'income' ? 'Ingresos' : 'Gastos'}:
          </span>
          <span className="font-medium text-foreground">{formatCOPCompact(entry.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-border/60 text-xs flex justify-between">
          <span className="text-muted-foreground">Balance</span>
          <span
            className={`font-semibold ${
              payload[0].value - payload[1].value >= 0 ? 'text-emerald-500' : 'text-red-400'
            }`}
          >
            {formatCOPCompact(payload[0].value - payload[1].value)}
          </span>
        </div>
      )}
    </div>
  );
}

export function BalanceChart({ data, isLoading }: BalanceChartProps) {
  if (isLoading) {
    return (
      <div className="lux-card p-6 h-[280px] animate-pulse">
        <div className="h-5 w-40 bg-secondary rounded mb-4" />
        <div className="h-[220px] bg-secondary/40 rounded-xl" />
      </div>
    );
  }

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="lux-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg">Ingresos vs Gastos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses · COP</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Gastos
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          No hay movimientos en los últimos 6 meses
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F87171" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => formatCOPCompact(v)}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#gradIncome)"
              dot={false}
              activeDot={{ r: 4, fill: '#10B981' }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#F87171"
              strokeWidth={2}
              fill="url(#gradExpense)"
              dot={false}
              activeDot={{ r: 4, fill: '#F87171' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
