/**
 * OperationalIntelligenceAlerts.tsx — Panel de Recomendaciones e Inteligencia Operativa
 * Analiza en tiempo real los datos reproductivos reales de Supabase y genera alertas accionables.
 */
import { useState, useMemo } from "react";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Activity,
  Baby,
  Stethoscope,
  Crown,
} from "lucide-react";
import type { Mare, StallionProfile, BreedingCycle, ReproductiveEvent } from "@/lib/hooks/useBreeding";

interface Props {
  mares?: Mare[];
  stallions?: StallionProfile[];
  cycles?: BreedingCycle[];
  events?: ReproductiveEvent[];
  onOpenAction?: (action: "diagnostico" | "parto" | "palpacion" | "servicio" | "embrion") => void;
  onNavigateView?: (view: string) => void;
}

export function OperationalIntelligenceAlerts({
  mares = [],
  stallions = [],
  cycles = [],
  events = [],
  onOpenAction,
  onNavigateView,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic real-time alerts calculation
  const alerts = useMemo(() => {
    const list: {
      id: string;
      type: "warning" | "urgent" | "success" | "info";
      title: string;
      desc: string;
      actionText: string;
      badge: string;
      icon: React.ElementType;
      onClick: () => void;
    }[] = [];

    // 1. Alert: Yeguas servidas > 14 días sin diagnóstico de gestación
    const pendingDiagnosisCycles = cycles.filter((c) => {
      if (c.pregnancy_status !== "Pending" || !c.insemination_date) return false;
      const days = Math.floor((Date.now() - new Date(c.insemination_date).getTime()) / 86400000);
      return days >= 14;
    });

    if (pendingDiagnosisCycles.length > 0) {
      const mareNames = pendingDiagnosisCycles
        .slice(0, 3)
        .map((c) => c.mare?.name || `Yegua #${c.mare_id.slice(0, 4)}`)
        .join(", ");
      const extra = pendingDiagnosisCycles.length > 3 ? ` y ${pendingDiagnosisCycles.length - 3} más` : "";

      list.push({
        id: "alert-diagnosis",
        type: "warning",
        title: `${pendingDiagnosisCycles.length} Diagnóstico(s) de Gestación Pendiente(s)`,
        desc: `Las yeguas (${mareNames}${extra}) superaron los 14 días post-servicio sin confirmación ecográfica.`,
        actionText: "Registrar Diagnóstico",
        badge: "Ecografía D14",
        icon: Activity,
        onClick: () => onOpenAction?.("diagnostico"),
      });
    }

    // 2. Alert: Partos Inminentes (≤ 15 días del ETA)
    const upcomingFoalings = cycles.filter((c) => {
      if ((c.pregnancy_status !== "Confirmed" && c.pregnancy_status !== "Preñada") || !c.expected_foaling_date) {
        return false;
      }
      const days = Math.floor((new Date(c.expected_foaling_date).getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 15;
    });

    if (upcomingFoalings.length > 0) {
      const names = upcomingFoalings
        .slice(0, 2)
        .map((c) => `${c.mare?.name || "Yegua"} (ETA: ${c.expected_foaling_date})`)
        .join(", ");

      list.push({
        id: "alert-foaling",
        type: "urgent",
        title: `${upcomingFoalings.length} Parto(s) Próximo(s) en < 15 días`,
        desc: `${names} entran en ventana de monitoreo estricto de ubre y calostro.`,
        actionText: "Registrar Parto",
        badge: "Vigilancia",
        icon: Baby,
        onClick: () => onOpenAction?.("parto"),
      });
    }

    // 3. Alert: Palpaciones / Controles clínicos agendados para hoy o pendientes
    const todayStr = new Date().toISOString().split("T")[0];
    const pendingEvents = events.filter((e) => e.status === "Programado" && (e.scheduled_date || e.created_at) <= todayStr);

    if (pendingEvents.length > 0) {
      list.push({
        id: "alert-events",
        type: "info",
        title: `${pendingEvents.length} Control(es) Clínico(s) Programado(s)`,
        desc: `Exámenes ginecológicos o ecografías agendadas que requieren atención veterinaria hoy.`,
        actionText: "Ver Calendario & Timeline",
        badge: "Agenda",
        icon: Stethoscope,
        onClick: () => onNavigateView?.("timeline"),
      });
    }

    // 4. Recommendation: Semental con mejor fertilidad histórica
    const activeStallionsWithData = stallions.filter((s) => s.total_services_count >= 2 && s.conception_rate_pct > 0);
    if (activeStallionsWithData.length > 0) {
      const topStallion = [...activeStallionsWithData].sort((a, b) => b.conception_rate_pct - a.conception_rate_pct)[0];
      list.push({
        id: "alert-stallion",
        type: "success",
        title: `Alta Fertilidad: ${topStallion.horse?.name || "Semental"}`,
        desc: `Presenta la mayor tasa de concepción del criadero con ${topStallion.conception_rate_pct}% en ${topStallion.total_services_count} servicios.`,
        actionText: "Ver Sementales",
        badge: "IA Reproductiva",
        icon: Crown,
        onClick: () => onNavigateView?.("sementales"),
      });
    }

    return list;
  }, [mares, stallions, cycles, events, onOpenAction, onNavigateView]);

  return (
    <div className="lux-card p-4 sm:p-5 mb-8 bg-gradient-to-r from-primary/5 via-card to-background border-primary/20 transition-all">
      {/* Header with Title & Collapse Toggle */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-semibold">
              Inteligencia Operativa & Alertas Reproductivas
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Monitoreo continuo de ventanas diagnósticas, partos y fertilidad del criadero
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
              alerts.length > 0
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {alerts.length} {alerts.length === 1 ? "Alerta" : "Alertas"}
          </span>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            title={isCollapsed ? "Expandir recomendaciones" : "Minimizar panel"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Body: Alerts Grid or Collapsed Summary */}
      {!isCollapsed && (
        <div className="mt-4 animate-in fade-in duration-200">
          {alerts.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <div className="text-xs">
                <span className="font-semibold">¡Todo al día en el criadero!</span> No hay alertas clínicas urgentes ni diagnósticos atrasados en este momento.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {alerts.map((a) => {
                const IconComponent = a.icon;
                return (
                  <div
                    key={a.id}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all hover:shadow-xs ${
                      a.type === "warning"
                        ? "bg-amber-500/5 border-amber-500/30"
                        : a.type === "urgent"
                        ? "bg-rose-500/5 border-rose-500/30"
                        : a.type === "success"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-blue-500/5 border-blue-500/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold flex items-center gap-1.5 truncate">
                          <IconComponent className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">{a.title}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground shrink-0">
                          {a.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                        {a.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={a.onClick}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors self-start cursor-pointer group"
                    >
                      <span>{a.actionText}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
