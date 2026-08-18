/**
 * ReproductionKanban.tsx — Tablero Kanban del Ciclo Reproductivo (Requerimiento 4)
 * 9 Columnas de estado con arrastre/cambio rápido de fase reproductiva
 */
import { useState } from "react";
import {
  HeartPulse,
  Flame,
  CalendarCheck,
  Syringe,
  Activity,
  Baby,
  Sparkles,
  Milk,
  Bed,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { Mare, MareReproductiveStatus } from "@/lib/hooks/useBreeding";

interface Props {
  mares: Mare[];
  onUpdateStatus: (id: string, status: MareReproductiveStatus) => void;
  onOpenMareProfile: (mare: Mare) => void;
}

const STAGES: {
  id: MareReproductiveStatus;
  label: string;
  color: string;
  headerBg: string;
  icon: React.ElementType;
}[] = [
  { id: "Vacías", label: "Vacías", color: "border-slate-300 text-slate-700", headerBg: "bg-slate-100 dark:bg-slate-800/60", icon: HeartPulse },
  { id: "En celo", label: "En Celo", color: "border-rose-400 text-rose-600", headerBg: "bg-rose-500/10", icon: Flame },
  { id: "Programadas", label: "Programadas", color: "border-purple-400 text-purple-600", headerBg: "bg-purple-500/10", icon: CalendarCheck },
  { id: "Servidas", label: "Servidas", color: "border-blue-400 text-blue-600", headerBg: "bg-blue-500/10", icon: Syringe },
  { id: "Diagnóstico", label: "Diagnóstico", color: "border-amber-400 text-amber-600", headerBg: "bg-amber-500/10", icon: Activity },
  { id: "Preñadas", label: "Preñadas", color: "border-emerald-400 text-emerald-600", headerBg: "bg-emerald-500/10", icon: Baby },
  { id: "Próximas al parto", label: "Próximas al Parto", color: "border-rose-500 text-rose-700", headerBg: "bg-rose-500/20", icon: Sparkles },
  { id: "Lactancia", label: "Lactancia", color: "border-cyan-400 text-cyan-600", headerBg: "bg-cyan-500/10", icon: Milk },
  { id: "Descanso", label: "Descanso", color: "border-slate-400 text-slate-500", headerBg: "bg-secondary", icon: Bed },
];

export function ReproductionKanban({ mares, onUpdateStatus, onOpenMareProfile }: Props) {
  // Real mares from database
  const displayMares: Mare[] = mares;

  return (
    <div className="lux-card p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <h2 className="font-display text-xl font-bold">Tablero Kanban de Ciclos Reproductivos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mueve las yeguas entre fases para actualizar su estado reproductivo en tiempo real
          </p>
        </div>
      </div>

      {/* 9-stage Horizontal Scroll Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
        {STAGES.map((stage, stageIdx) => {
          const stageMares = displayMares.filter(
            (m) => (m.reproductive_status as string) === stage.id || (m.reproductive_status as string)?.toLowerCase() === stage.id.toLowerCase()
          );
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 rounded-2xl border border-border bg-card/60 flex flex-col max-h-[700px]"
            >
              {/* Column Header */}
              <div className={`p-3.5 rounded-t-2xl border-b border-border ${stage.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${stage.color}`} />
                  <span className="font-semibold text-xs text-foreground">{stage.label}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-card shadow-xs border border-border">
                  {stageMares.length}
                </span>
              </div>

              {/* Mare Cards List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {stageMares.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                    Sin yeguas
                  </div>
                ) : (
                  stageMares.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="h-10 w-10 rounded-xl bg-secondary border border-border overflow-hidden shrink-0">
                          <img
                            src={m.horse?.image_url || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=200&q=80"}
                            alt={m.horse?.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs truncate group-hover:text-primary transition-colors">
                            {m.horse?.name || `Yegua #${m.horse_id.slice(0, 6)}`}
                          </h4>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {m.horse?.breed || "Raza N/E"} {m.horse?.age ? `· ${m.horse.age} años` : ""}
                          </div>
                        </div>
                      </div>

                      {m.gestation_days && (
                        <div className="text-[10px] text-emerald-600 font-medium mb-2 bg-emerald-500/10 p-1.5 rounded-md">
                          🤰 {m.gestation_days} días de gestación {m.expected_foaling_date ? `(ETA: ${m.expected_foaling_date})` : ""}
                        </div>
                      )}

                      {/* Stage Shift Controls */}
                      <div className="flex items-center justify-between border-t border-border pt-2 text-[10px]">
                        <button
                          disabled={stageIdx === 0}
                          onClick={() => onUpdateStatus(m.id, STAGES[stageIdx - 1].id)}
                          className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
                          title="Fase anterior"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenMareProfile(m)}
                          className="font-medium text-primary hover:underline"
                        >
                          Ver Ficha
                        </button>

                        <button
                          disabled={stageIdx === STAGES.length - 1}
                          onClick={() => onUpdateStatus(m.id, STAGES[stageIdx + 1].id)}
                          className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"
                          title="Siguiente fase"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
