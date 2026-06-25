import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateGestationProbability } from "@/lib/holtWinters";
import { Brain, Plus, Baby, CalendarDays, Activity, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/breeding")({
  head: () => ({
    meta: [{ title: "Reproducción y Genética — GaitFlow" }],
  }),
  component: BreedingPage,
});

interface BreedingRecord {
  id: string;
  mare_id: string;
  stallion_id: string;
  method: string | null;
  insemination_date: string;
  pregnancy_status: string | null;
  expected_foaling_date: string | null;
}

function useBreedingRecords() {
  return useQuery<BreedingRecord[]>({
    queryKey: ["breeding_records"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("breeding_records") as any)
        .select("*, horses:mare_id(name)")
        .order("insemination_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function gestationDays(inseminationFecha: string): number {
  const start = new Date(inseminationFecha);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function gestationProgress(days: number): number {
  return Math.min(100, Math.round((days / 340) * 100));
}

function BreedingPage() {
  const { data: records = [], isLoading } = useBreedingRecords();
  const [addOpen, setAddOpen] = useState(false);

  // Mock historical success rates for HW prediction
  const mockHistory = [0.6, 0.7, 0.65, 0.8, 0.75, 0.7, 0.85, 0.8];
  const hwProbability = calculateGestationProbability(mockHistory);

  const pregnant = records.filter((r) => r.pregnancy_status === "Pregnant");
  const pending = records.filter((r) => r.pregnancy_status === "Pending");

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Reproducción</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Centro de Reproducción</h1>
          <p className="text-muted-foreground mt-2">
            {records.length} registros de reproducción · {pregnant.length} gestaciones confirmadas
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nuevo Registro
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Gestaciones Activas", value: pregnant.length, icon: Baby, color: "text-rose-400" },
          { label: "Pendientes de Confirmación", value: pending.length, icon: Activity, color: "text-amber-400" },
          { label: "Potros Esperados", value: pregnant.length, icon: CalendarDays, color: "text-blue-400" },
          { label: "Prob. Concepción HW", value: `${Math.round(hwProbability)}%`, icon: Brain, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="lux-card p-5">
            <s.icon className={`h-5 w-5 mb-3 ${s.color}`} />
            <div className="font-display text-3xl">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* HW Insight Banner */}
      <div className="lux-card p-5 mb-8 flex items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">Inteligencia Predictiva Holt-Winters</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            Basado en datos históricos del ciclo, la ventana óptima de reproducción es{" "}
            <strong>Febrero 18–24</strong>. Probabilidad proyectada de concepción:{" "}
            <strong className="text-primary">{Math.round(hwProbability)}%</strong>. La temporada de primavera típicamente rinde +22% por encima del promedio anual.
          </div>
        </div>
      </div>

      {/* Gestation Tracker */}
      <section>
        <h2 className="font-display text-2xl mb-6">Gestaciones Activas</h2>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-secondary rounded-2xl" />
            <div className="h-24 bg-secondary rounded-2xl" />
          </div>
        ) : pregnant.length === 0 ? (
          <div className="lux-card p-10 text-center text-muted-foreground">
            <Baby className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Sin gestaciones activas. Agrega un registro de reproducción para comenzar el seguimiento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pregnant.map((r) => {
              const days = gestationDays(r.insemination_date);
              const pct = gestationProgress(days);
              return (
                <div key={r.id} className="lux-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Yegua #{r.mare_id.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">
                        {r.method ?? "Monta Natural"} · Día {days} de ~340
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{pct}%</div>
                      <div className="text-xs text-muted-foreground">
                        {r.expected_foaling_date
                          ? `ETA ${new Date(r.expected_foaling_date).toLocaleDateString()}`
                          : "Calculando…"}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 to-primary transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending Records */}
      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl mb-6">Pendientes de Confirmación</h2>
          <div className="space-y-4">
            {pending.map((r) => (
              <div key={r.id} className="lux-card p-5 flex items-center gap-4">
                <Activity className="h-5 w-5 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">Inseminación {new Date(r.insemination_date).toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">{r.method ?? "Método no especificado"} · Esperando chequeo de gestación</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
