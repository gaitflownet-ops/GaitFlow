import { type LucideIcon } from 'lucide-react';
import { formatCOPCompact } from '@/lib/financial/types';

interface KPICardProps {
  label: string;
  value: number;
  previousValue?: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  prefix?: string;
  suffix?: string;
  isLoading?: boolean;
  invertTrend?: boolean; // para gastos, subir es malo
  compact?: boolean;
}

export function KPICard({
  label,
  value,
  previousValue,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading,
  invertTrend = false,
  compact = false,
}: KPICardProps) {
  const trend =
    previousValue !== undefined && previousValue > 0
      ? ((value - previousValue) / previousValue) * 100
      : null;

  const trendPositive = trend !== null ? (invertTrend ? trend < 0 : trend > 0) : null;

  if (isLoading) {
    return (
      <div className="lux-card p-5 animate-pulse">
        <div className="h-4 w-20 bg-secondary rounded mb-3" />
        <div className="h-7 w-28 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div className="lux-card p-5 group hover:shadow-[var(--shadow-lift)] transition-shadow duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        {trend !== null && (
          <div
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-red-500/10 text-red-500'
            }`}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div className={`font-display font-semibold truncate ${compact ? 'text-xl' : 'text-2xl'}`}>
        {formatCOPCompact(value)}
      </div>

      <div className="text-xs text-muted-foreground mt-1 leading-tight">{label}</div>
    </div>
  );
}
