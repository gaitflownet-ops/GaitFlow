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
  invertTrend?: boolean;
  compact?: boolean;
  hero?: boolean;       // variante grande para Balance Neto
  isCurrency?: boolean; // false para mostrar número entero sin formato moneda
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
  hero = false,
  isCurrency = true,
}: KPICardProps) {
  const trend =
    previousValue !== undefined && previousValue > 0
      ? ((value - previousValue) / previousValue) * 100
      : null;

  const trendPositive = trend !== null ? (invertTrend ? trend < 0 : trend > 0) : null;

  const displayValue = isCurrency
    ? formatCOPCompact(value)
    : value.toLocaleString('es-CO');

  if (isLoading) {
    return (
      <div className={`lux-card animate-pulse ${hero ? 'kpi-hero-skeleton' : compact ? 'p-4' : 'p-5'}`}>
        <div className="h-3 w-16 bg-secondary rounded mb-3" />
        <div className={`bg-secondary rounded ${hero ? 'h-10 w-36' : 'h-7 w-24'}`} />
      </div>
    );
  }

  if (hero) {
    return (
      <div 
        className="lux-card kpi-hero group hover:shadow-[var(--shadow-lift)] transition-all duration-300 flex flex-col justify-between"
        style={{ minHeight: '140px', height: '100%' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {trend !== null && (
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-red-500/10 text-red-500'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="font-display text-3xl font-bold truncate leading-none mb-2">
          {displayValue}
        </div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    );
  }

  return (
    <div 
      className={`lux-card flex flex-col justify-between group hover:shadow-[var(--shadow-lift)] transition-all duration-300 ${compact ? 'p-4' : 'p-5'}`}
      style={!compact ? { minHeight: '140px', height: '100%' } : { height: '100%' }}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className={`grid ${compact ? 'h-8 w-8' : 'h-9 w-9'} place-items-center rounded-xl ${iconBg}`}>
            <Icon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${iconColor}`} />
          </div>
          {trend !== null && (
            <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-red-500/10 text-red-500'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
      <div>
        <div className={`font-display font-semibold truncate ${compact ? 'text-lg' : 'text-2xl'}`}>
          {displayValue}
        </div>
        <div className="text-xs text-muted-foreground mt-1 leading-tight">{label}</div>
      </div>
    </div>
  );
}
