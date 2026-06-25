import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  useNutritionCenterMetrics, 
  useAllNutritionPlansDetailed 
} from "@/lib/hooks/useNutritionCenter";
import { useFeedInventory } from "@/lib/hooks/useInventory";
import { 
  Brain, Sprout, Plus, AlertTriangle, Package, Activity, 
  DollarSign, PieChart, Users, Warehouse, Truck, Clock 
} from "lucide-react";
import { InventoryManager } from "@/components/nutrition/InventoryManager";
import { SupplierManager } from "@/components/nutrition/SupplierManager";
import { GlobalFeedingOps } from "@/components/nutrition/GlobalFeedingOps";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [{ title: "Centro de Nutrición — GaitFlow" }],
  }),
  component: NutritionCenterPage,
});

type Tab = "Dashboard" | "Bodega" | "Proveedores" | "Operaciones";

function NutritionCenterPage() {
  const { data: metrics, isLoading: loadingMetrics } = useNutritionCenterMetrics();
  const { data: rawPlans, isLoading: loadingPlans } = useAllNutritionPlansDetailed();
  const plans = rawPlans || [];
  const { data: rawInventory } = useFeedInventory();
  const inventory = rawInventory || [];
  
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");

  const lowStockCount = inventory.filter((i: any) => i && i.current_stock_kg <= i.reorder_point_kg).length;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <Warehouse className="h-3.5 w-3.5" /> Centro Operativo
          </div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Centro de Nutrición</h1>
          <p className="text-muted-foreground mt-2">
            Gestión global de dietas del criadero, bodega de alimentos, proveedores y operaciones diarias.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar border-b border-border/50">
        {[
          { id: "Dashboard", icon: PieChart },
          { id: "Operaciones", icon: Clock },
          { id: "Bodega", icon: Package },
          { id: "Proveedores", icon: Truck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.id}
          </button>
        ))}
      </div>

      {activeTab === "Dashboard" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* TOP METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lux-card p-6 border-l-4 border-l-emerald-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Sprout className="h-5 w-5" /></div>
                <h3 className="font-medium text-sm text-muted-foreground">Dietas Activas</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl">{metrics?.totalActivePlans || 0}</span>
                <span className="text-sm text-muted-foreground">caballos</span>
              </div>
            </div>

            <div className="lux-card p-6 border-l-4 border-l-sky-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500"><Activity className="h-5 w-5" /></div>
                <h3 className="font-medium text-sm text-muted-foreground">Consumo Diario</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl">{(metrics?.dailyConsumptionKg ?? 0).toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">kg / día</span>
              </div>
            </div>

            <div className="lux-card p-6 border-l-4 border-l-purple-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500"><DollarSign className="h-5 w-5" /></div>
                <h3 className="font-medium text-sm text-muted-foreground">Costo Mensual Est.</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl">${(metrics?.monthlyCost ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                <span className="text-sm text-muted-foreground">/ mes</span>
              </div>
            </div>

            <div className={`lux-card p-6 border-l-4 ${lowStockCount > 0 ? 'border-l-amber-500/50 bg-amber-500/5' : 'border-l-border/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${lowStockCount > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-secondary text-foreground'}`}>
                  {lowStockCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <h3 className="font-medium text-sm text-muted-foreground">Alertas de Bodega</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-display text-4xl ${lowStockCount > 0 ? 'text-amber-500' : ''}`}>{lowStockCount}</span>
                <span className="text-sm text-muted-foreground">items</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="lux-card p-6 md:p-8 min-h-[400px]">
                 <div className="flex items-center gap-3 mb-6">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-xl">Motor de Inteligencia Nutricional</h3>
                 </div>
                 <div className="p-6 border border-primary/20 bg-primary/5 rounded-2xl">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      El Centro de Nutrición consolida los datos de todos los caballos del criadero. 
                      Cada vez que un montador o veterinario ajusta la dieta usando medidas tradicionales (como 'cocos', 'pacas' o 'bultos'), 
                      el sistema las convierte automáticamente a Kilogramos para descontarlo de tu inventario en bodega y calcular el costo exacto del consumo mensual.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setActiveTab("Operaciones")} className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20">Ir a Operaciones ➔</button>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="lux-card p-6">
                <h3 className="font-display text-lg mb-4 flex items-center gap-2"><Users className="h-4 w-4" /> Caballos en Dieta</h3>
                <div className="space-y-3">
                  {loadingPlans ? (
                    <div className="h-20 animate-pulse bg-secondary rounded-xl" />
                  ) : (() => {
                    const activePlansList = plans.filter((p: any) => p.status === "Active");
                    if (activePlansList.length === 0) {
                      return <div className="text-sm text-muted-foreground py-4 text-center">No hay dietas activas.</div>;
                    }
                    return (
                      <>
                        {activePlansList.slice(0, 5).map((plan: any) => (
                          <div key={plan.id} className="p-3 rounded-xl bg-secondary/30 border border-border/50 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-semibold">{plan.horse?.name || "Desconocido"}</div>
                              <div className="text-[10px] text-muted-foreground">{plan.purpose}</div>
                            </div>
                            <div className="text-xs font-mono text-muted-foreground">
                              {plan.items?.length || 0} raciones
                            </div>
                          </div>
                        ))}
                        {activePlansList.length > 5 && (
                          <div className="text-center pt-2 text-xs font-medium text-primary">
                            + {activePlansList.length - 5} más
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Bodega" && <InventoryManager />}
      {activeTab === "Proveedores" && <SupplierManager />}
      {activeTab === "Operaciones" && <GlobalFeedingOps />}

    </AppShell>
  );
}
