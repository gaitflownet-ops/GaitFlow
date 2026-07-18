import { type LucideIcon, ChevronRight } from 'lucide-react';
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
  hero?: boolean;
  isCurrency?: boolean;
  metrics?: { label: string; value: string | number; highlight?: string }[];
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
  isCurrency = true,
  metrics = []
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
      <div className="h-48 bg-secondary/50 rounded-2xl border border-border animate-pulse" />
    );
  }

  // Determine an implicit background color class based on iconBg
  let glowColor = iconBg;
  if (iconBg.includes('emerald')) glowColor = 'bg-emerald-500/10';
  else if (iconBg.includes('red')) glowColor = 'bg-red-500/10';
  else if (iconBg.includes('indigo')) glowColor = 'bg-indigo-500/10';
  else if (iconBg.includes('amber')) glowColor = 'bg-amber-500/10';
  else if (iconBg.includes('violet')) glowColor = 'bg-violet-500/10';

  return (
    <div className="group lux-card p-4 lg:p-5 flex flex-col justify-between hover:border-primary/40 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden h-[180px]">
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${glowColor} rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-700`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`grid h-8 w-8 place-items-center rounded-lg bg-background border border-border shadow-sm ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors group-hover:translate-x-1" />
        </div>
        
        <div className="mb-4">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
            {label}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none text-foreground">
              {displayValue}
            </span>
            {trend !== null && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                trendPositive
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Mini Metrics Grid */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
            {metrics.map((metric, idx) => (
              <div key={idx}>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5 truncate" title={metric.label}>
                  {metric.label}
                </div>
                <div className={`font-medium text-[13px] ${metric.highlight || "text-foreground"}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
