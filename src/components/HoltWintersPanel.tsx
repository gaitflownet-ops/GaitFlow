import { Brain, Trophy, Activity, AlertTriangle, Syringe, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

export function HoltWintersPanel() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading intelligence data
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="lux-card p-6 h-96 animate-pulse" />;
  }

  return (
    <div className="lux-card p-6 bg-gradient-to-br from-background to-secondary/30 relative overflow-hidden h-full">
      {/* Visual background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 rounded-full blur-2xl -translate-y-10 translate-x-10" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="h-9 w-9 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-xl text-foreground">GaitFlow Intelligence</h3>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
            Tu Asistente Ecuestre Personal
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* CCC Events Section */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2 font-semibold">
            <span className="h-px w-5 bg-border inline-block" />
            Próximos Eventos CCC
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3.5 rounded-xl bg-background border border-border hover:border-[var(--gold)]/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Trophy className="h-4 w-4 text-[var(--gold)]" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold">Feria Equina Grado A</div>
                  <div className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <CalendarDays className="h-3 w-3" /> Agosto 2026 · Medellín
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-500 ring-1 ring-inset ring-red-500/20">
                  Cierra en 15 días
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between p-3.5 rounded-xl bg-background border border-border hover:border-blue-500/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Trophy className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold">Exposición Nacional Equina</div>
                  <div className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <CalendarDays className="h-3 w-3" /> Febrero 2027 · Bogotá
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-500 ring-1 ring-inset ring-blue-500/20">
                  Planificación
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational & Breeding Alerts */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2 font-semibold mt-6">
            <span className="h-px w-5 bg-border inline-block" />
            Alertas Operativas
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="text-[13px] font-medium">Ciclo Reproductivo Óptimo</div>
                  <div className="text-[11px] text-muted-foreground">Yegua: Promesa de La Marqueza</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-emerald-500">Alta Prob.</div>
                <div className="text-[10px] text-muted-foreground">Ventaja: 3 días</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <Syringe className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="text-[13px] font-medium">Recordatorio Vacunación</div>
                  <div className="text-[11px] text-muted-foreground">Encefalitis Equina y Tétano</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-amber-500">2 Ejemplares</div>
                <div className="text-[10px] text-muted-foreground">Vencen este mes</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-red-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-[13px] font-medium">Inventario Crítico</div>
                  <div className="text-[11px] text-muted-foreground">Suplemento Articular (Condroitina)</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-red-500">Stock Bajo</div>
                <div className="text-[10px] text-muted-foreground">Ordenar pronto</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
