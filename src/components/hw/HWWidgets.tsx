import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, Activity } from "lucide-react";

/* =========================================================================
   Holt-Winters Predictive Intelligence — Visual Components
   These components surface AI forecasts described in the GaitFlow doc.
   ========================================================================= */

export function HWBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/40 px-2.5 py-0.5 text-[10px] tracking-[0.18em] uppercase font-semibold text-[var(--bronze)]">
      <Sparkles className="h-3 w-3" /> HW · {children}
    </span>
  );
}

/* HW-1 — Marketplace ideal price band -------------------------------------- */
export function PriceForecastCard({
  current,
  forecastLow,
  forecastHigh,
  trend = "up",
}: {
  current: number;
  forecastLow: number;
  forecastHigh: number;
  trend?: "up" | "down";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const inBand = current >= forecastLow && current <= forecastHigh;
  return (
    <div className="lux-card p-5 border-[var(--gold)]/30">
      <div className="flex items-center justify-between mb-3">
        <HWBadge>HW-1 · Price</HWBadge>
        <span
          className={`inline-flex items-center gap-1 text-[12px] font-medium ${
            trend === "up" ? "text-emerald-600" : "text-destructive"
          }`}
        >
          <TrendIcon className="h-3.5 w-3.5" /> 90-day
        </span>
      </div>
      <div className="font-display text-2xl">
        ${forecastLow.toLocaleString()} – ${forecastHigh.toLocaleString()}
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Ideal listing band predicted by Holt-Winters from comparable Ocala sales.
      </p>
      <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden relative">
        <div className="absolute inset-y-0 left-[20%] right-[20%] bg-[var(--gold)]/40" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-foreground border-2 border-background shadow"
          style={{
            left: `${Math.min(
              95,
              Math.max(
                5,
                ((current - forecastLow * 0.7) / (forecastHigh * 1.3 - forecastLow * 0.7)) * 100,
              ),
            )}%`,
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>Below band</span>
        <span className={inBand ? "text-emerald-600 font-medium" : ""}>
          You: ${current.toLocaleString()}
        </span>
        <span>Above band</span>
      </div>
    </div>
  );
}

/* HW-2 — Gestation / reproductive success probability ---------------------- */
export function GestationProbability({ probability }: { probability: number }) {
  const pct = Math.max(0, Math.min(100, probability));
  const tone =
    pct >= 75 ? "text-emerald-600" : pct >= 55 ? "text-[var(--bronze)]" : "text-destructive";
  return (
    <div className="lux-card p-5">
      <div className="flex items-center justify-between mb-3">
        <HWBadge>HW-2 · Gestation</HWBadge>
        <span className="text-[11px] text-muted-foreground">Cycle window</span>
      </div>
      <div className="flex items-end gap-3">
        <div className={`font-display text-5xl leading-none ${tone}`}>{pct}%</div>
        <div className="text-[12px] text-muted-foreground pb-1">
          probability of successful conception in this cycle
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--leather)] via-[var(--bronze)] to-[var(--gold)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">
        Modeled from prior cycles, donor age, stallion fertility & seasonality.
      </p>
    </div>
  );
}

/* HW-3 — Seasonal health risk index 0–10 ----------------------------------- */
export function SeasonalRiskBar({
  score,
  label = "Respiratory + colic risk",
}: {
  score: number;
  label?: string;
}) {
  const pct = (Math.max(0, Math.min(10, score)) / 10) * 100;
  const tone = score >= 7 ? "bg-destructive" : score >= 4 ? "bg-[var(--gold)]" : "bg-emerald-500";
  return (
    <div className="lux-card p-5">
      <div className="flex items-center justify-between mb-2">
        <HWBadge>HW-3 · Health</HWBadge>
        <span className="text-[11px] text-muted-foreground">Next 30 days</span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-display text-3xl">{score.toFixed(1)}</span>
        <span className="text-[12px] text-muted-foreground">/ 10 seasonal index</span>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[10px] tracking-widest uppercase text-muted-foreground">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* HW-4 — Feed inventory restock alert -------------------------------------- */
export function FeedRestockAlert({
  product,
  daysRemaining,
  projectedConsumption,
}: {
  product: string;
  daysRemaining: number;
  projectedConsumption: string;
}) {
  const critical = daysRemaining <= 7;
  return (
    <div
      className={`lux-card p-5 ${critical ? "border-destructive/40 bg-destructive/5" : "border-[var(--gold)]/30"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <HWBadge>HW-4 · Nutrition</HWBadge>
        {critical && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Restock now
          </span>
        )}
      </div>
      <div className="font-display text-xl">{product}</div>
      <div className="mt-1 text-[13px] text-muted-foreground">{projectedConsumption}</div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`font-display text-4xl ${critical ? "text-destructive" : ""}`}>
          {daysRemaining}
        </span>
        <span className="text-[12px] text-muted-foreground">days of stock left</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full ${critical ? "bg-destructive" : "bg-[var(--bronze)]"}`}
          style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
        />
      </div>
    </div>
  );
}

/* HW-5 — Revenue / cash projection sparkline ------------------------------- */
export function RevenueForecastCard({
  series,
  projection,
  anomaly,
}: {
  series: number[];
  projection: number[];
  anomaly?: string;
}) {
  const all = [...series, ...projection];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = Math.max(1, max - min);
  const w = 320;
  const h = 90;
  const step = w / (all.length - 1);
  const points = all.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  const split = (series.length - 1) * step;
  return (
    <div className="lux-card p-5">
      <div className="flex items-center justify-between mb-3">
        <HWBadge>HW-5 · Finance</HWBadge>
        <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600 font-medium">
          <Activity className="h-3.5 w-3.5" /> 6-mo projection
        </span>
      </div>
      <div className="font-display text-2xl">
        ${all[all.length - 1].toLocaleString()}
        <span className="text-[12px] text-muted-foreground ml-2 font-sans">
          projected month-end
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-3" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hw5-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--forest)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--forest)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,${h} ${points} ${w},${h}`} fill="url(#hw5-grad)" stroke="none" />
        <polyline points={points} fill="none" stroke="var(--forest)" strokeWidth="2" />
        <line
          x1={split}
          x2={split}
          y1={0}
          y2={h}
          stroke="var(--gold)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] tracking-widest uppercase text-muted-foreground">
        <span>Historical</span>
        <span className="text-[var(--bronze)]">Forecast →</span>
      </div>
      {anomaly && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-[12px] text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{anomaly}</span>
        </div>
      )}
    </div>
  );
}
