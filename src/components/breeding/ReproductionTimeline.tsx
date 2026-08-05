/**
 * ReproductionTimeline.tsx — Timeline Operativo Reproductivo (Requerimiento 3)
 * Chronological line of upcoming events with category colors and filtering
 */
import { useState } from "react";
import {
  Stethoscope,
  Activity,
  Syringe,
  HeartPulse,
  Share2,
  Dna,
  Baby,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import type { ReproductiveEvent, ReproductiveEventType } from "@/lib/hooks/useBreeding";

interface Props {
  events: ReproductiveEvent[];
  onCompleteEvent?: (id: string) => void;
}

const EVENT_CONFIG: Record<
  ReproductiveEventType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  Palpación:      { label: "Palpación",      icon: Stethoscope, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  Ecografía:      { label: "Ecografía",      icon: Activity,    color: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/20" },
  Inseminación:   { label: "Inseminación",   icon: Syringe,     color: "text-cyan-500",   bg: "bg-cyan-500/10 border-cyan-500/20" },
  Monta:          { label: "Monta Natural",  icon: HeartPulse,  color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20" },
  Transferencia:  { label: "Transferencia",  icon: Share2,      color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
  Lavado:         { label: "Lavado Embrión", icon: Dna,         color: "text-teal-500",   bg: "bg-teal-500/10 border-teal-500/20" },
  Diagnóstico:    { label: "Diagnóstico",    icon: Activity,    color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20" },
  Parto:          { label: "Parto Inminente",icon: Baby,        color: "text-rose-500",   bg: "bg-rose-500/10 border-rose-500/20" },
  Destete:        { label: "Destete",        icon: Sparkles,    color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
};

export function ReproductionTimeline({ events }: Props) {
  const [selectedType, setSelectedType] = useState<string>("all");

  // Sample data fallback if events empty
  const displayEvents: ReproductiveEvent[] = events.length > 0 ? events : [
    {
      id: "ev1",
      organization_id: "org1",
      mare_id: "m1",
      event_type: "Palpación",
      scheduled_date: "2026-08-07",
      status: "Programado",
      vet_name: "Dr. Roberto Silva",
      mare: { name: "Luna Llena", breed: "Paso Fino" },
      notes: "Palpación folicular día 12 post-celo",
      created_at: "2026-08-01",
    },
    {
      id: "ev2",
      organization_id: "org1",
      mare_id: "m2",
      event_type: "Ecografía",
      scheduled_date: "2026-08-08",
      status: "Programado",
      vet_name: "Dra. María Gómez",
      mare: { name: "Esperanza de la Cima", breed: "CCC" },
      notes: "Diagnóstico precoz de gestación (14 días)",
      created_at: "2026-08-01",
    },
    {
      id: "ev3",
      organization_id: "org1",
      mare_id: "m3",
      event_type: "Transferencia",
      scheduled_date: "2026-08-10",
      status: "Programado",
      vet_name: "Dr. Carlos Rossi",
      mare: { name: "Sultana del Valle", breed: "CCC" },
      notes: "Transferencia de embrión fresco Grado I",
      created_at: "2026-08-02",
    },
    {
      id: "ev4",
      organization_id: "org1",
      mare_id: "m4",
      event_type: "Parto",
      scheduled_date: "2026-08-12",
      status: "Programado",
      vet_name: "Dr. Roberto Silva",
      mare: { name: "Dulcinea IV", breed: "Trotador" },
      notes: "Día 338 de gestación — monitoreo de ubre",
      created_at: "2026-08-02",
    },
    {
      id: "ev5",
      organization_id: "org1",
      mare_id: "m5",
      event_type: "Lavado",
      scheduled_date: "2026-08-15",
      status: "Programado",
      vet_name: "Dra. María Gómez",
      mare: { name: "Princesa Real", breed: "Paso Fino" },
      notes: "Lavado uterino post-inseminación Carbonero",
      created_at: "2026-08-03",
    },
  ];

  const filteredEvents = selectedType === "all"
    ? displayEvents
    : displayEvents.filter((e) => e.event_type === selectedType);

  return (
    <div className="lux-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Timeline Operativo Cronológico
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Próximas actividades reproductivas programadas en el criadero
          </p>
        </div>

        {/* Event Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <button
            onClick={() => setSelectedType("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
              selectedType === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
            }`}
          >
            Todos ({displayEvents.length})
          </button>
          {Object.keys(EVENT_CONFIG).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
                selectedType === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary text-muted-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {filteredEvents.map((ev) => {
          const cfg = EVENT_CONFIG[ev.event_type] || EVENT_CONFIG.Palpación;
          const Icon = cfg.icon;
          const isToday = ev.scheduled_date === new Date().toISOString().split("T")[0];

          return (
            <div key={ev.id} className="relative group">
              {/* Node Icon */}
              <div className={`absolute -left-6 top-0.5 h-6 w-6 rounded-full border flex items-center justify-center bg-card ${cfg.bg}`}>
                <Icon className={`h-3 w-3 ${cfg.color}`} />
              </div>

              {/* Event Content Card */}
              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="font-semibold text-sm">
                      {ev.mare?.name || `Yegua #${ev.mare_id.slice(0, 6)}`}
                    </span>
                    {ev.mare?.breed && (
                      <span className="text-xs text-muted-foreground">· {ev.mare.breed}</span>
                    )}
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                        ¡HOY!
                      </span>
                    )}
                  </div>
                  {ev.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{ev.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                  <div className="text-right">
                    <div className="font-semibold text-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(ev.scheduled_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    {ev.vet_name && (
                      <div className="text-muted-foreground text-[11px] mt-0.5">{ev.vet_name}</div>
                    )}
                  </div>

                  <button className="p-2 rounded-lg border border-border hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600 text-muted-foreground transition-all" title="Marcar completado">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
