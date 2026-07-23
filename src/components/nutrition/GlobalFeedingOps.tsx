import React, { useState } from "react";
import { useAllNutritionPlansDetailed } from "@/lib/hooks/useNutritionCenter";
import { useCreateTask } from "@/lib/hooks/useTasks";
import { CheckCircle2, Clock, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";

export function GlobalFeedingOps() {
  const { data: allPlans = [], isLoading } = useAllNutritionPlansDetailed();
  const createTask = useCreateTask();
  const { state } = useApp();
  const activeOrgId = state.user?.organization_id;

  const [isGenerating, setIsGenerating] = useState(false);

  // Filter only active plans
  const activePlans = allPlans.filter((p: any) => p.status === "Active");

  // Group items by schedule across all horses
  const scheduleOrder = ["Mañana", "Mediodía", "Tarde", "Noche", "A Voluntad"];
  
  const globalSchedule: Record<string, { horseCount: number, horses: any[], itemsCount: number }> = {
    "Mañana": { horseCount: 0, horses: [], itemsCount: 0 },
    "Mediodía": { horseCount: 0, horses: [], itemsCount: 0 },
    "Tarde": { horseCount: 0, horses: [], itemsCount: 0 },
    "Noche": { horseCount: 0, horses: [], itemsCount: 0 },
    "A Voluntad": { horseCount: 0, horses: [], itemsCount: 0 },
  };

  activePlans.forEach((plan: any) => {
    if (!plan.items) return;
    
    // Find unique schedules for this horse
    const horseSchedules = new Set<string>();
    plan.items.forEach((item: any) => {
      // We map the old English db values to Spanish if needed, but since we rely on item.schedule from the plan
      // Let's ensure we map the keys correctly
      let scheduleKey = item.schedule;
      if (scheduleKey === "Morning") scheduleKey = "Mañana";
      if (scheduleKey === "Midday") scheduleKey = "Mediodía";
      if (scheduleKey === "Afternoon") scheduleKey = "Tarde";
      if (scheduleKey === "Night") scheduleKey = "Noche";
      if (scheduleKey === "Free Choice") scheduleKey = "A Voluntad";

      if (globalSchedule[scheduleKey]) {
        horseSchedules.add(scheduleKey);
        globalSchedule[scheduleKey].itemsCount++;
      }
    });

    // Add horse to the schedule blocks
    horseSchedules.forEach(schedule => {
      globalSchedule[schedule].horseCount++;
      globalSchedule[schedule].horses.push({
        id: plan.horse_id,
        name: plan.horse?.name,
        plan_id: plan.id
      });
    });
  });

  const handleGenerateGlobalTasks = async (schedule: string) => {
    if (globalSchedule[schedule].horseCount === 0) return;
    setIsGenerating(true);

    try {
      const today = new Date();
      const timeMap: Record<string, string> = {
        "Mañana": "07:00",
        "Mediodía": "12:00",
        "Tarde": "16:00",
        "Noche": "20:00",
        "A Voluntad": "08:00"
      };

      const [hours, minutes] = timeMap[schedule].split(":");
      const taskDate = new Date(today);
      taskDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Create a single grouped task for the stable
      const horseNames = globalSchedule[schedule].horses.map(h => h.name).join(", ");
      
      await createTask.mutateAsync({
        title: `Operación Alimentación: Turno ${schedule}`,
        status: "Pendiente",
        due_date: taskDate.toISOString(),
        notes: `Ración requerida para ${globalSchedule[schedule].horseCount} caballos: \n${horseNames}\n\nRevisar perfil individual del caballo para detalles exactos.`,
        farm_id: activeOrgId || "00000000-0000-0000-0000-000000000000",
        organization_id: activeOrgId || undefined,
      });

      toast.success(`Tarea global generada para el turno: ${schedule}`);
    } catch (e) {
      toast.error("Error al generar las tareas globales");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Cargando operaciones del criadero...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="lux-card p-6 border-sky-500/20 bg-sky-500/5">
        <h4 className="font-display text-xl mb-2 text-sky-500">Operaciones Globales de Alimentación</h4>
        <p className="text-sm text-muted-foreground">
          Centro de comando unificado para despachar las tareas de alimentación a los palafreneros en bloque.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scheduleOrder.map(schedule => {
          const stats = globalSchedule[schedule];
          const hasHorses = stats.horseCount > 0;

          return (
            <div key={schedule} className={`lux-card p-6 relative overflow-hidden transition-all ${hasHorses ? 'border-primary/20' : 'opacity-60 grayscale'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary text-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h5 className="font-semibold">{schedule}</h5>
                </div>
                {hasHorses && (
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                    {stats.horseCount} Caballos
                  </span>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{hasHorses ? `${stats.horseCount} caballos requieren ración` : "No hay caballos programados"}</span>
                </div>
              </div>

              <button 
                onClick={() => handleGenerateGlobalTasks(schedule)}
                disabled={!hasHorses || isGenerating}
                className="w-full rounded-xl bg-secondary hover:bg-muted text-foreground border border-border px-4 py-2.5 text-sm font-medium transition-colors inline-flex justify-between items-center disabled:opacity-50"
              >
                Despachar Tarea a Kanban <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
