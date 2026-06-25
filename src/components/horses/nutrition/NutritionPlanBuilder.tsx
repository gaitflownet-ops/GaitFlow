import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, Info } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { createNutritionPlan, addNutritionItems } from "@/lib/api-nutrition";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveNutritionPlan } from "@/lib/hooks/useNutrition";

interface NutritionPlanBuilderProps {
  horseId: string;
  onClose: () => void;
}

const schedules = ["Mañana", "Mediodía", "Tarde", "Noche", "A Voluntad"];
const categories = ["Forraje", "Concentrado", "Suplemento", "Mineral", "Electrolito", "Otro"];
const units = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "lb", label: "Libra (lb - 500g)" },
  { value: "g", label: "Gramos (g)" },
  { value: "coco/scoop", label: "Coco / Cucharada (Volumétrico)" },
  { value: "bulto", label: "Bulto" },
  { value: "porcion", label: "Porción / Ración" },
  { value: "paca", label: "Paca (Heno)" },
  { value: "bloque", label: "Bloque" },
];

export function NutritionPlanBuilder({ horseId, onClose }: NutritionPlanBuilderProps) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  
  const [planName, setPlanName] = useState("Plan de Alimentación 2026");
  const [purpose, setPurpose] = useState("Competencia");
  const [observations, setObservations] = useState("");
  
  const [items, setItems] = useState<any[]>([]);

  // Load existing active plan if editing
  const { data: activePlan } = useActiveNutritionPlan(horseId);

  useEffect(() => {
    if (activePlan) {
      setPlanName(activePlan.name || "Plan de Alimentación 2026");
      setPurpose(activePlan.purpose || "Competencia");
      setObservations(activePlan.general_observations || "");
      if (activePlan.items) {
        setItems(activePlan.items.map((item: any) => ({
          id: item.id,
          product_name: item.product_name || "",
          category: item.category || "Concentrado",
          quantity: item.quantity || 1,
          unit: item.unit || "kg",
          schedule: item.schedule || "Mañana",
          conversion_to_kg: item.conversion_to_kg || 1,
          notes: item.notes || "",
        })));
      }
    }
  }, [activePlan]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9), // temp id
        product_name: "",
        category: "Concentrado",
        quantity: 1,
        unit: "kg",
        schedule: "Mañana",
        conversion_to_kg: 1,
        notes: "",
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Si el usuario cambia la unidad, asignamos automáticamente la equivalencia estimada en Kg
        if (field === "unit") {
          if (value === "kg") {
            updated.conversion_to_kg = 1;
          } else if (value === "lb") {
            updated.conversion_to_kg = 0.5; // 1 libra colombiana = 500 gramos = 0.5 kg
          } else if (value === "g") {
            updated.conversion_to_kg = 0.001;
          } else if (value === "bulto") {
            updated.conversion_to_kg = 40; // Peso promedio de un bulto en Colombia (40 Kg)
          } else if (value === "paca") {
            updated.conversion_to_kg = 12; // Peso promedio de una paca de heno en Colombia (12 Kg)
          } else if (value === "coco/scoop") {
            updated.conversion_to_kg = 0.5; // Peso promedio volumétrico de un coco de concentrado (0.5 Kg)
          } else if (value === "bloque") {
            updated.conversion_to_kg = 5; // Peso promedio de un bloque mineral (5 Kg)
          } else if (value === "porcion") {
            updated.conversion_to_kg = 1;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!planName) {
      toast.error("El nombre del plan es requerido");
      return;
    }
    
    if (items.length === 0) {
      toast.error("Añade al menos una ración al plan");
      return;
    }

    try {
      const planData = {
        organization_id: orgId,
        horse_id: horseId,
        name: planName,
        purpose,
        status: "Active",
        general_observations: observations,
      };

      // Strip temporary IDs
      const itemsData = items.map(({ id, ...rest }) => rest);

      if (!orgId || !horseId) {
        toast.error("Faltan datos de sesión (org o caballo)");
        return;
      }

      setIsPending(true);
      toast.loading("Paso 1: Creando plan principal...", { id: "save-dieta" });
      
      const newPlan = await createNutritionPlan(planData);
      
      toast.loading("Paso 2: Guardando raciones...", { id: "save-dieta" });

      if (itemsData && itemsData.length > 0) {
        const itemsWithPlanId = itemsData.map(i => ({ ...i, plan_id: newPlan.id }));
        await addNutritionItems(itemsWithPlanId);
      }

      queryClient.invalidateQueries({ queryKey: ["active_nutrition_plan", horseId] });
      queryClient.invalidateQueries({ queryKey: ["all_nutrition_plans", horseId] });
      queryClient.invalidateQueries({ queryKey: ["nutrition_center_metrics"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition_plans_detailed"] });

      toast.success("Dieta Registrada Exitosamente", { id: "save-dieta" });
      onClose();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Error: ${error?.message || "Fallo en la base de datos"}`, { id: "save-dieta" });
      queryClient.invalidateQueries({ queryKey: ["active_nutrition_plan", horseId] });
      queryClient.invalidateQueries({ queryKey: ["all_nutrition_plans", horseId] });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl">Diseñar Plan Nutricional</h3>
          <p className="text-xs text-muted-foreground">Define las raciones diarias, medidas tradicionales y horarios.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="rounded-full bg-secondary text-foreground px-4 py-2 text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5">
            <X className="h-4 w-4" /> Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--primary),0.3)] disabled:opacity-50">
            {isPending ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar y Activar</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-5">
          <div className="lux-card p-5">
            <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">Información de la Dieta</h4>
            
            <div className="space-y-4">
              <div>
                <label className="eyebrow block mb-1">Nombre del Plan</label>
                <input className="lux-input" value={planName} onChange={e => setPlanName(e.target.value)} />
              </div>
              
              <div>
                <label className="eyebrow block mb-1">Propósito</label>
                <select className="lux-select" value={purpose} onChange={e => setPurpose(e.target.value)}>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Entrenamiento">Entrenamiento</option>
                  <option value="Competencia">Competencia</option>
                  <option value="Reproducción">Reproducción</option>
                  <option value="Preñez">Preñez</option>
                  <option value="Crecimiento">Crecimiento</option>
                  <option value="Recuperación">Recuperación</option>
                </select>
              </div>

              <div>
                <label className="eyebrow block mb-1">Observaciones Veterinarias</label>
                <textarea 
                  className="lux-input min-h-[100px] resize-none" 
                  value={observations} 
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Ej. Remojar el cuido por problemas dentales..."
                />
              </div>
            </div>
          </div>

          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 flex gap-3">
            <Info className="h-5 w-5 text-sky-500 shrink-0" />
            <div>
              <h5 className="text-[12px] font-semibold text-sky-500 uppercase tracking-widest">Conversor de Medidas</h5>
              <p className="text-xs text-muted-foreground mt-1">Si seleccionas unidades volumétricas como "cocos" o "pacas", asegúrate de ingresar la equivalencia en kg para el control exacto de bodega.</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="lux-card p-12 text-center text-muted-foreground border-dashed">
              <p>Aún no hay raciones.</p>
              <button onClick={handleAddItem} className="mt-4 rounded-full bg-secondary text-foreground px-4 py-2 text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Agregar Primera Ración
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="lux-card p-4 relative group">
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="flex gap-2 items-center mb-4">
                    <span className="grid place-items-center h-6 w-6 rounded-full bg-secondary text-xs font-mono">{index + 1}</span>
                    <h5 className="font-semibold text-sm">Especificación de Ración</h5>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="eyebrow block mb-1">Nombre del Producto</label>
                      <input 
                        className="lux-input text-sm" 
                        value={item.product_name} 
                        onChange={e => handleUpdateItem(item.id, "product_name", e.target.value)} 
                        placeholder="Ej. Pavo Sport, Pasto Kikuyo..."
                      />
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                      <label className="eyebrow block mb-1 truncate">Categoría</label>
                      <select 
                        className="lux-select text-sm" 
                        value={item.category} 
                        onChange={e => handleUpdateItem(item.id, "category", e.target.value)}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="eyebrow block mb-1 truncate" title="Horario / Turno">Horario / Turno</label>
                      <select 
                        className="lux-select text-sm" 
                        value={item.schedule} 
                        onChange={e => handleUpdateItem(item.id, "schedule", e.target.value)}
                      >
                        {schedules.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="eyebrow block mb-1 truncate">Cantidad</label>
                      <input 
                        className="lux-input text-sm" 
                        type="number" 
                        min="0" step="0.1" 
                        value={item.quantity} 
                        onChange={e => handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} 
                      />
                    </div>

                    <div>
                      <label className="eyebrow block mb-1">Unidad</label>
                      <select 
                        className="lux-select text-sm" 
                        value={item.unit} 
                        onChange={e => handleUpdateItem(item.id, "unit", e.target.value)}
                      >
                        {units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="eyebrow block mb-1">Equivalencia y Total (Kg)</label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input 
                            className="lux-input text-sm w-20" 
                            type="number" 
                            min="0" step="0.0001" 
                            value={item.conversion_to_kg} 
                            onChange={e => handleUpdateItem(item.id, "conversion_to_kg", parseFloat(e.target.value) || 0)} 
                            disabled={item.unit === "kg" || item.unit === "g" || item.unit === "lb"}
                            title="Equivalencia de 1 unidad en kg"
                          />
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            {item.unit === "kg" ? "1 kg por unidad" : item.unit === "g" ? "0.001 kg por gramo" : item.unit === "lb" ? "0.5 kg por libra" : `kg por ${item.unit}`}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-primary mt-1">
                          Total ración: <span className="font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">{(item.quantity * item.conversion_to_kg).toFixed(3)} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button onClick={handleAddItem} className="w-full rounded-2xl border-2 border-dashed border-border/80 p-4 text-sm font-medium hover:border-primary/50 hover:bg-secondary/20 transition-colors inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" /> Agregar Otra Ración
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
