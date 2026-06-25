import React, { useState } from "react";
import { useActiveNutritionPlan, useAllNutritionPlans } from "@/lib/hooks/useNutrition";
import { useLatestWellnessRecord, useWellnessRecords } from "@/lib/hooks/useWellness";
import { Wheat, Droplet, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Activity, Beaker, Plus, HeartPulse, Edit2, Info } from "lucide-react";
import { useFeedInventory, useUpdateFeedStock } from "@/lib/hooks/useInventory";
import { useCreateTask } from "@/lib/hooks/useTasks";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { NutritionPlanBuilder } from "./NutritionPlanBuilder";

interface NutritionTabProps {
  horseId: string;
}

const categoryTranslations: Record<string, string> = {
  Forage: "Forraje",
  Forraje: "Forraje",
  Concentrate: "Concentrado",
  Concentrado: "Concentrado",
  Supplement: "Suplemento",
  Suplemento: "Suplemento",
  Mineral: "Mineral",
  Electrolyte: "Electrolito",
  Electrolito: "Electrolito",
  Other: "Otro",
  Otro: "Otro"
};

const purposeTranslations: Record<string, string> = {
  Maintenance: "Mantenimiento",
  Mantenimiento: "Mantenimiento",
  Training: "Entrenamiento",
  Entrenamiento: "Entrenamiento",
  Competition: "Competencia",
  Competencia: "Competencia",
  Breeding: "Reproducción",
  Reproducción: "Reproducción",
  Pregnancy: "Preñez",
  Preñez: "Preñez",
  Growth: "Crecimiento",
  Crecimiento: "Crecimiento",
  Recovery: "Recuperación",
  Recuperación: "Recuperación"
};

export function NutritionTab({ horseId }: NutritionTabProps) {
  const { data: rawActivePlan, isLoading: loadingPlan, error: planError } = useActiveNutritionPlan(horseId);
  const { data: rawLatestWellness } = useLatestWellnessRecord(horseId);
  const { data: rawFeedInventory } = useFeedInventory();
  const feedInventory = rawFeedInventory || [];
  const createTask = useCreateTask();
  
  const [forceNotLoading, setForceNotLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const activePlan: any = forceNotLoading ? null : rawActivePlan;
  const latestWellness: any = rawLatestWellness;
  
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const updateStockMutation = useUpdateFeedStock();
  const [completingSchedules, setCompletingSchedules] = useState<Record<string, boolean>>({});
  
  // Compute low stock items
  const lowStockItems = React.useMemo(() => {
    if (!activePlan?.items || !feedInventory) return [];
    
    const activeProducts = activePlan.items.map((i: any) => (i.product_name || "").toLowerCase());
    return feedInventory.filter((inv: any) => {
      const isUsed = activeProducts.includes((inv.product_name || "").toLowerCase());
      return isUsed && inv.current_stock_kg <= inv.reorder_point_kg;
    });
  }, [activePlan, feedInventory]);

  if (loadingPlan && !forceNotLoading) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="text-muted-foreground animate-pulse font-medium">Cargando módulo de inteligencia...</div>
        {showFallback && (
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-3">
            <p>La base de datos está demorando en responder. Puede deberse a políticas de seguridad RLS del usuario actual.</p>
            {planError && (
              <p className="font-mono text-[10px] text-destructive bg-destructive/5 p-2 rounded border border-destructive/10 text-left">
                Error: {(planError as any)?.message || String(planError)}
              </p>
            )}
            <button 
              onClick={() => setForceNotLoading(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Saltar espera y crear plan manual
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isEditing) {
    return <NutritionPlanBuilder horseId={horseId} onClose={() => setIsEditing(false)} />;
  }

  // Pre-process items into schedule groups
  const scheduleOrder = ["Mañana", "Mediodía", "Tarde", "Noche", "A Voluntad"];
  
  const groupedItems = activePlan?.items?.reduce((acc: any, item: any) => {
    // En caso de que vengan en inglés desde base de datos antigua
    let scheduleKey = item.schedule;
    if (scheduleKey === "Morning") scheduleKey = "Mañana";
    if (scheduleKey === "Midday") scheduleKey = "Mediodía";
    if (scheduleKey === "Afternoon") scheduleKey = "Tarde";
    if (scheduleKey === "Night") scheduleKey = "Noche";
    if (scheduleKey === "Free Choice") scheduleKey = "A Voluntad";

    if (!acc[scheduleKey]) acc[scheduleKey] = [];
    acc[scheduleKey].push(item);
    return acc;
  }, {}) || {};



  const handleCompleteFeeding = async (schedule: string) => {
    const items = groupedItems[schedule] || [];
    if (items.length === 0) return;

    setCompletingSchedules(prev => ({ ...prev, [schedule]: true }));
    let updatedCount = 0;
    
    try {
      for (const item of items) {
        // Buscar producto coincidente en inventario (insensible a mayúsculas)
        const matchingInv = feedInventory.find(
          (inv: any) => (inv.product_name || "").toLowerCase() === (item.product_name || "").toLowerCase()
        );

        if (matchingInv) {
          const qtyInKg = Number(item.quantity) * Number(item.conversion_to_kg || 1);
          await updateStockMutation.mutateAsync({
            inventoryId: matchingInv.id,
            quantity: qtyInKg
          });
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        toast.success(`¡Alimentación de ${schedule} completada! Se descontaron las raciones del inventario en bodega.`);
      } else {
        toast.warning(`¡Alimentación de ${schedule} completada! Sin embargo, no se encontraron productos en la bodega con nombres coincidentes ("${items.map((i: any) => i.product_name).join(', ')}") para realizar el descuento.`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al descontar las raciones del inventario");
    } finally {
      setCompletingSchedules(prev => ({ ...prev, [schedule]: false }));
    }
  };

  const handleGenerateTasks = async () => {
    if (!activePlan || !activePlan.items) return;
    setIsGeneratingTasks(true);
    
    try {
      const today = new Date();
      const activeSchedules = Object.keys(groupedItems);
      
      const timeMap: Record<string, string> = {
        "Mañana": "07:00",
        "Mediodía": "12:00",
        "Tarde": "16:00",
        "Noche": "20:00",
        "A Voluntad": "08:00"
      };

      for (const schedule of activeSchedules) {
        const items = groupedItems[schedule];
        const rationSummary = items.map((i: any) => `${i.quantity}${i.unit} ${i.product_name}`).join(", ");
        
        const [hours, minutes] = timeMap[schedule].split(":");
        const taskDate = new Date(today);
        taskDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        await createTask.mutateAsync({
          title: `Alimentación: ${schedule}`,
          status: "Pendiente",
          due_date: taskDate.toISOString(),
          notes: `Ración: ${rationSummary}`,
          horse_id: horseId,
          farm_id: activePlan.organization_id, // ensure it links to the org
        });
      }
      
      toast.success(`¡Generadas ${activeSchedules.length} tareas de alimentación para hoy!`);
    } catch (e) {
      toast.error("Error al generar tareas de alimentación diaria");
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-full bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20 px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase font-semibold">
              {activePlan?.status || "Sin Dieta Activa"}
            </span>
            {activePlan?.purpose && (
              <span className="rounded-full bg-secondary text-muted-foreground px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase font-medium">
                {purposeTranslations[activePlan.purpose] || activePlan.purpose}
              </span>
            )}
          </div>
          <h3 className="font-display text-3xl">{activePlan?.name || "Nutrición y Bienestar"}</h3>
          <p className="text-sm text-muted-foreground mt-1">Nutrición de alto rendimiento y control de condición corporal.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {activePlan && activePlan.items && (
            <button 
              onClick={handleGenerateTasks} 
              disabled={isGeneratingTasks}
              className="rounded-full bg-secondary text-foreground border border-border px-4 py-2 text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> 
              {isGeneratingTasks ? "Generando..." : "Generar Tareas del Día"}
            </button>
          )}
          <button onClick={() => setIsEditing(true)} className="rounded-full bg-secondary text-foreground border border-border px-4 py-2 text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5 transition-colors">
            <Edit2 className="h-3.5 w-3.5" /> Editar Plan
          </button>
          <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95 inline-flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Plus className="h-4 w-4" /> Registrar Bienestar
          </button>
        </div>
      </div>

      {activePlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN COLUMN: FEEDING TIMELINE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="lux-card p-6 md:p-8">
              <h4 className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-semibold mb-6 flex items-center gap-2">
                <Wheat className="h-4 w-4 text-[var(--bronze)]" /> Cronograma de Alimentación Diario
              </h4>
              
              <div className="relative border-l border-border/60 pl-8 space-y-10 ml-3">
                {scheduleOrder.map((schedule) => {
                  const items = groupedItems[schedule];
                  if (!items || items.length === 0) return null;
                  
                  // Style logic for different times of day
                  let dotColor = "bg-amber-400";
                  let timeLabel = "07:00 AM";
                  if (schedule === "Mediodía") { dotColor = "bg-amber-300"; timeLabel = "12:00 PM"; }
                  if (schedule === "Tarde") { dotColor = "bg-amber-600"; timeLabel = "04:00 PM"; }
                  if (schedule === "Noche") { dotColor = "bg-indigo-400"; timeLabel = "08:00 PM"; }
                  if (schedule === "A Voluntad") { dotColor = "bg-emerald-400"; timeLabel = "Siempre Disponible"; }

                  return (
                    <div key={schedule} className="relative group">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[41px] top-1 grid h-3 w-3 rounded-full ${dotColor} ring-4 ring-background shadow-[0_0_10px_currentColor]`} />
                      
                      <div className="flex justify-between items-baseline mb-3">
                        <h5 className="font-display text-lg text-foreground">{schedule}</h5>
                        <span className="text-[11px] font-mono text-muted-foreground">{timeLabel}</span>
                      </div>
                      
                      {/* Items Cards */}
                      <div className="grid gap-3">
                        {items.map((item: any) => (
                          <div key={item.id} className="bg-secondary/20 border border-border/40 rounded-xl p-3 flex justify-between items-center group-hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="grid place-items-center h-10 w-10 rounded-lg bg-background border border-border/50 text-muted-foreground shrink-0">
                                {(item.category === 'Forage' || item.category === 'Forraje') ? <Wheat className="h-4 w-4 text-emerald-500" /> : 
                                 (item.category === 'Concentrate' || item.category === 'Concentrado') ? <Beaker className="h-4 w-4 text-amber-500" /> :
                                 <Sparkles className="h-4 w-4 text-indigo-500" />}
                              </div>
                              <div>
                                <div className="font-semibold text-[14px] text-foreground flex items-center gap-2">
                                  {item.product_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                                  <span className="uppercase tracking-wider font-semibold text-muted-foreground/80">{categoryTranslations[item.category] || item.category}</span>
                                  {item.notes && <span>· {item.notes}</span>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-mono text-[15px] font-bold text-foreground">
                                {item.quantity} <span className="text-muted-foreground text-xs font-sans">{item.unit}</span>
                              </div>
                              {/* If conversion exists and unit is not kg, show approx kg */}
                              {item.unit !== 'kg' && item.conversion_to_kg && (
                                <div className="text-[10px] text-muted-foreground">≈ {(item.quantity * item.conversion_to_kg).toFixed(3)} kg</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Integrated Task Action */}
                      <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => handleCompleteFeeding(schedule)}
                          disabled={completingSchedules[schedule]}
                          className="text-[11px] font-semibold flex items-center gap-1 text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> 
                          {completingSchedules[schedule] ? "Actualizando Bodega..." : `Marcar Alimentación ${schedule} como Completa`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {activePlan.general_observations && (
                <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                  <Info className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <h5 className="text-[12px] font-semibold text-amber-500 uppercase tracking-widest mb-1">Observaciones Veterinarias</h5>
                    <p className="text-sm text-amber-600/90 dark:text-amber-400/90">{activePlan.general_observations}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: WELLNESS & HYDRATION */}
          <div className="space-y-6">
            
            {/* WELLNESS SCORE WIDGET */}
            <div className="lux-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="h-24 w-24 text-primary" />
              </div>
              <h4 className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-semibold mb-4 flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-500" /> Condición Corporal (BCS)
              </h4>
              
              <div className="flex items-end gap-3 mb-6">
                <span className="font-display text-6xl leading-none text-foreground">
                  {latestWellness?.body_condition_score || "-"}
                </span>
                <span className="text-muted-foreground pb-1 font-medium">/ 9 BCS</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Peso Estimado</span>
                  <span className="font-mono font-medium">{latestWellness?.weight_estimate_kg ? `${latestWellness.weight_estimate_kg} kg` : "—"}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border/40 pt-3">
                  <span className="text-muted-foreground">Calidad del Pelaje</span>
                  <span className="font-medium text-foreground capitalize">{latestWellness?.coat_quality || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border/40 pt-3">
                  <span className="text-muted-foreground">Nivel de Energía (Brío)</span>
                  <span className="font-medium text-foreground capitalize">{latestWellness?.energy_level || "—"}</span>
                </div>
              </div>
              
              <div className="mt-6 text-[10px] text-muted-foreground text-center">
                Última actualización: {latestWellness ? new Date(latestWellness.date).toLocaleDateString() : "Nunca"}
              </div>
            </div>

            {/* WATER MANAGEMENT WIDGET */}
            <div className="lux-card p-6 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border-sky-500/20">
              <h4 className="text-[11px] tracking-[0.2em] uppercase text-sky-500 font-semibold mb-4 flex items-center gap-2">
                <Droplet className="h-4 w-4 fill-current" /> Estado de Hidratación
              </h4>
              
              <div className="flex justify-between items-center bg-background/50 rounded-xl p-3 border border-border/50">
                <span className="text-sm font-medium">Disponibilidad</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-500 px-2 py-0.5 text-xs font-semibold">Lleno</span>
              </div>
              
              <div className="flex justify-between items-center bg-background/50 rounded-xl p-3 border border-border/50 mt-2">
                <span className="text-sm font-medium">Bebedero Limpio</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500"/> Hoy</span>
              </div>
              
              <button className="w-full mt-4 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 py-2 text-xs font-semibold hover:bg-sky-500/20 transition-colors">
                Registrar Chequeo de Agua
              </button>
            </div>
            
            {/* QUICK INVENTORY ALERTS */}
            {lowStockItems.length > 0 && (
              <div className="space-y-3">
                {lowStockItems.map((item: any, i: number) => (
                  <div key={i} className="lux-card p-5 border-amber-500/30 bg-amber-500/5 animate-in slide-in-from-right-2">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <h5 className="text-sm font-semibold text-amber-500">Stock Bajo: {item.product_name}</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Solo quedan {item.current_stock_kg} kg en bodega (Reordenar a los {item.reorder_point_kg} kg).
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="lux-card p-12 text-center border-dashed">
          <div className="grid place-items-center h-16 w-16 rounded-full bg-secondary text-muted-foreground mx-auto mb-4">
            <Activity className="h-8 w-8" />
          </div>
          <h4 className="font-display text-xl mb-2">Sin Plan Nutricional Activo</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">Este caballo no tiene asignado un plan de nutrición o bienestar. Crea uno para habilitar la automatización de tareas y el control de bodega.</p>
          <button onClick={() => setIsEditing(true)} className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-95 shadow-lg">
            Crear Plan Nutricional
          </button>
        </div>
      )}
    </div>
  );
}
