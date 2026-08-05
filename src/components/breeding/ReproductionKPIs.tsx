/**
 * ReproductionKPIs.tsx — 11 KPI Cards Dashboard with drill-down triggers
 */
import {
  HeartPulse,
  Crown,
  Baby,
  CalendarDays,
  Activity,
  TrendingUp,
  Dna,
  Share2,
  Sparkles,
  AlertOctagon,
  Clock,
} from "lucide-react";
import type { ReproductionKPIData as KPIData } from "@/lib/hooks/useBreeding";

interface Props {
  kpis: KPIData;
  activeFilter?: string;
  onSelectFilter: (filter: string) => void;
}

export function ReproductionKPIs({ kpis, activeFilter, onSelectFilter }: Props) {
  const cards = [
    { id: "mares", label: "Yeguas reproductoras", value: kpis.breeding_mares_count, icon: HeartPulse, color: "text-rose-500 bg-rose-500/10", border: "border-rose-500/20" },
    { id: "stallions", label: "Sementales activos", value: kpis.active_stallions_count, icon: Crown, color: "text-amber-500 bg-amber-500/10", border: "border-amber-500/20" },
    { id: "pregnant", label: "Yeguas preñadas", value: kpis.pregnant_mares_count, icon: Baby, color: "text-emerald-500 bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "upcoming_foalings", label: "Próximos partos", value: kpis.upcoming_foalings_count, icon: CalendarDays, color: "text-blue-500 bg-blue-500/10", border: "border-blue-500/20" },
    { id: "services_month", label: "Servicios este mes", value: kpis.services_this_month_count, icon: Activity, color: "text-indigo-500 bg-indigo-500/10", border: "border-indigo-500/20" },
    { id: "pregnancy_rate", label: "Tasa de preñez", value: `${kpis.pregnancy_rate_pct}%`, icon: TrendingUp, color: "text-teal-500 bg-teal-500/10", border: "border-teal-500/20" },
    { id: "active_embryos", label: "Embriones activos", value: kpis.active_embryos_count, icon: Dna, color: "text-cyan-500 bg-cyan-500/10", border: "border-cyan-500/20" },
    { id: "transfers", label: "Transferencias", value: kpis.transfers_count, icon: Share2, color: "text-purple-500 bg-purple-500/10", border: "border-purple-500/20" },
    { id: "born_foals", label: "Potros nacidos", value: kpis.born_foals_count, icon: Sparkles, color: "text-yellow-500 bg-yellow-500/10", border: "border-yellow-500/20" },
    { id: "abortions", label: "Abortos / Pérdidas", value: kpis.abortions_count, icon: AlertOctagon, color: "text-red-500 bg-red-500/10", border: "border-red-500/20" },
    { id: "pending_services", label: "Servicios pendientes", value: kpis.pending_services_count, icon: Clock, color: "text-orange-500 bg-orange-500/10", border: "border-orange-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3 mb-8">
      {cards.map((card) => {
        const isSelected = activeFilter === card.id;
        return (
          <button
            key={card.id}
            id={`kpi-card-${card.id}`}
            onClick={() => onSelectFilter(card.id)}
            className={`lux-card p-3.5 text-left transition-all relative overflow-hidden group cursor-pointer ${
              isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/40 hover:-translate-y-0.5"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon className="h-4 w-4 shrink-0" />
              </div>
            </div>
            <div className="font-display text-2xl lg:text-3xl font-bold tracking-tight mb-0.5">
              {card.value}
            </div>
            <div className="text-[11px] text-muted-foreground font-medium leading-tight line-clamp-2">
              {card.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
