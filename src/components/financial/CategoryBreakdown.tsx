import { formatCOPCompact, formatCOP } from '@/lib/financial/types';

interface CategoryItem {
  name: string;
  icon: string;
  color: string;
  amount: number;
  pct: number;
}

interface CategoryBreakdownProps {
  data: CategoryItem[];
  type: 'income' | 'expense';
  isLoading?: boolean;
  onTypeChange?: (type: 'income' | 'expense') => void;
}

export function CategoryBreakdown({ data, type, isLoading, onTypeChange }: CategoryBreakdownProps) {
  if (isLoading) {
    return (
      <div className="lux-card p-6 h-full animate-pulse">
        <div className="h-5 w-40 bg-secondary rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-secondary/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const total = data.reduce((a, d) => a + d.amount, 0);

  return (
    <div className="lux-card p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-display text-lg">
          {type === 'expense' ? 'Top Gastos' : 'Top Ingresos'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Mes actual · por categoría</p>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Sin movimientos este mes
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {data.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span>{item.icon}</span>
                  <span className="font-medium truncate text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-muted-foreground">{item.pct}%</span>
                  <span className="font-semibold text-foreground">{formatCOPCompact(item.amount)}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}

          {data.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border/60 flex justify-between text-xs">
              <span className="text-muted-foreground">Total del mes</span>
              <span className="font-bold text-foreground">{formatCOP(total)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
