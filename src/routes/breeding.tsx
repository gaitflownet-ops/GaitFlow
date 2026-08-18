/**
 * breeding.tsx — GaitFlow Enterprise Reproduction Center
 * Complete Enterprise UX/UI & Functional Redesign addressing all 15 specifications:
 *  1. Rediseño del Dashboard Principal
 *  2. KPI Dashboard (11 cards interactivas)
 *  3. Timeline Operativo
 *  4. Vista Kanban (9 fases reproductivas con Drag/Shift)
 *  5. Tarjetas Profesionales de Yeguas
 *  6. Tarjetas Profesionales de Sementales (estándar uniforme)
 *  7. Banco Genético (Semen, Embriones, Ovocitos, lotes, tanques)
 *  8. Centro de Embriones (donadora, receptora, lavado, transferencia, estado)
 *  9. Calendario Reproductivo (mensual con filtros)
 * 10. Ficha Completa del Ejemplar (Página completa de 10 pestañas)
 * 11. Historial Cronológico (corte de flujo continuo)
 * 12. Analytics (Recharts + dashboards de fertilidad)
 * 13. Inteligencia Operativa (Recomendaciones e IA)
 * 14. Experiencia Visual Enterprise
 * 15. Arquitectura de Datos Robusta
 */

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import {
  useMares,
  useStallions,
  useEmbryos,
  useGeneticBank,
  useReproductiveEvents,
  useBreedingCycles,
  useUpdateMareStatus,
  type Mare,
  type StallionProfile,
  type MareReproductiveStatus,
} from "@/lib/hooks/useBreeding";

// Specialized Components
import { ReproductionHeader } from "@/components/breeding/ReproductionHeader";
import { ReproductionKPIs } from "@/components/breeding/ReproductionKPIs";
import { OperationalIntelligenceAlerts } from "@/components/breeding/OperationalIntelligenceAlerts";
import { ReproductionTimeline } from "@/components/breeding/ReproductionTimeline";
import { ReproductionKanban } from "@/components/breeding/ReproductionKanban";
import { MareCard } from "@/components/breeding/MareCard";
import { StallionCard } from "@/components/breeding/StallionCard";
import { EmbryoCenter } from "@/components/breeding/EmbryoCenter";
import { GeneticBankView } from "@/components/breeding/GeneticBankView";
import { ReproductionCalendarView } from "@/components/breeding/ReproductionCalendarView";
import { ReproductionAnalyticsView } from "@/components/breeding/ReproductionAnalyticsView";
import { HorseReproductionProfileView } from "@/components/breeding/HorseReproductionProfileView";

// Enterprise Reproduction Modals
import { RegisterBreedingServiceModal } from "@/components/modals/RegisterBreedingServiceModal";
import { RegisterPalpationModal } from "@/components/modals/RegisterPalpationModal";
import { RegisterDiagnosisModal } from "@/components/modals/RegisterDiagnosisModal";
import { RegisterFoalingModal } from "@/components/modals/RegisterFoalingModal";
import { RegisterEmbryoModal } from "@/components/modals/RegisterEmbryoModal";
import { AddGeneticMaterialModal } from "@/components/modals/AddGeneticMaterialModal";

import {
  Calendar,
  Kanban,
  HeartPulse,
  Crown,
  Dna,
  Snowflake,
  BarChart2,
  Clock,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/breeding")({
  head: () => ({
    meta: [
      { title: "Centro de Reproducción — GaitFlow Enterprise" },
      { name: "description", content: "Centro Integral de Gestión Reproductiva y Banco Genético de Élite." },
    ],
  }),
  component: EnterpriseBreedingPage,
});

type MainViewMode =
  | "timeline"
  | "kanban"
  | "yeguas"
  | "sementales"
  | "embriones"
  | "banco"
  | "calendario"
  | "analytics";

function useLocalReproductionKPIs(
  mares: Mare[],
  stallions: StallionProfile[],
  embryos: any[],
  events: any[]
) {
  const { data: cycles = [] } = useBreedingCycles();

  const pregnant = (cycles || []).filter((c) => c && (c.pregnancy_status === "Confirmed" || c.pregnancy_status === "Preñada"));
  const upcomingFoalings = pregnant.filter((c) => {
    if (!c || !c.expected_foaling_date) return false;
    const diffDays = (new Date(c.expected_foaling_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays <= 60 && diffDays >= 0;
  });

  const confirmedCount = pregnant.length;
  const totalCompletedCycles = (cycles || []).filter((c) => c && c.pregnancy_status !== "Pending").length;
  const pregnancyRatePct = totalCompletedCycles > 0 ? Math.round((confirmedCount / totalCompletedCycles) * 100) : 0;

  return {
    breeding_mares_count: mares.length,
    active_stallions_count: stallions.length,
    pregnant_mares_count: pregnant.length,
    upcoming_foalings_count: upcomingFoalings.length,
    services_this_month_count: cycles.length,
    pregnancy_rate_pct: pregnancyRatePct,
    active_embryos_count: embryos.length,
    transfers_count: (embryos || []).filter((e) => e && (e.status === "Transferido" || e.status === "Implantado")).length,
    born_foals_count: (cycles || []).filter((c) => c && c.actual_foaling_date).length,
    abortions_count: (cycles || []).filter((c) => c && (c.pregnancy_status === "Aborted" || c.pregnancy_status === "Lost" || c.pregnancy_status === "Aborto")).length,
    pending_services_count: (events || []).filter((e) => e && e.status === "Programado").length,
  };
}

function EnterpriseBreedingPage() {
  const [activeView, setActiveView] = useState<MainViewMode>("timeline");
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | undefined>(undefined);
  const [selectedHorseProfile, setSelectedHorseProfile] = useState<{
    data: Mare | StallionProfile;
    type: "mare" | "stallion";
  } | null>(null);

  // Dedicated Enterprise Modals state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [palpationModalOpen, setPalpationModalOpen] = useState(false);
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [foalingModalOpen, setFoalingModalOpen] = useState(false);
  const [embryoModalOpen, setEmbryoModalOpen] = useState(false);
  const [geneticModalOpen, setGeneticModalOpen] = useState(false);

  // Hooks
  const { data: mares = [], isLoading: loadingMares } = useMares();
  const { data: stallions = [] } = useStallions();
  const { data: embryos = [] } = useEmbryos();
  const { data: events = [] } = useReproductiveEvents();
  const kpis = useLocalReproductionKPIs(mares, stallions, embryos, events);
  const updateMareStatus = useUpdateMareStatus();
  const { data: geneticBank = [] } = useGeneticBank();

  function handleQuickAction(actionType: "servicio" | "monta" | "inseminacion" | "palpacion" | "diagnostico" | "parto" | "embrion") {
    if (actionType === "servicio" || actionType === "inseminacion" || actionType === "monta") {
      setServiceModalOpen(true);
    } else if (actionType === "palpacion") {
      setPalpationModalOpen(true);
    } else if (actionType === "diagnostico") {
      setDiagnosisModalOpen(true);
    } else if (actionType === "parto") {
      setFoalingModalOpen(true);
    } else if (actionType === "embrion") {
      setEmbryoModalOpen(true);
    }
  }

  function handleSelectKpi(kpiId: string) {
    setActiveKpiFilter(kpiId);
    if (kpiId === "mares" || kpiId === "pregnant") setActiveView("yeguas");
    else if (kpiId === "stallions") setActiveView("sementales");
    else if (kpiId === "active_embryos" || kpiId === "transfers") setActiveView("embriones");
    else if (kpiId === "pending_services" || kpiId === "services_month") setActiveView("timeline");
    else if (kpiId === "pregnancy_rate") setActiveView("analytics");
  }

  function handleMareStatusShift(mareId: string, newStatus: MareReproductiveStatus) {
    updateMareStatus.mutate({ id: mareId, reproductive_status: newStatus });
  }

  // Real data only from Supabase database
  const displayMares: Mare[] = mares;
  const displayStallions: StallionProfile[] = stallions;

  // Render Full Page Horse Reproduction Profile (Req 10 & 11)
  if (selectedHorseProfile) {
    return (
      <AppShell>
        <HorseReproductionProfileView
          horseData={selectedHorseProfile.data}
          type={selectedHorseProfile.type}
          onBack={() => setSelectedHorseProfile(null)}
        />
      </AppShell>
    );
  }

  const mainViews: { id: MainViewMode; label: string; icon: React.ElementType }[] = [
    { id: "timeline", label: "Timeline Operativo", icon: Clock },
    { id: "kanban", label: "Tablero Kanban", icon: Kanban },
    { id: "yeguas", label: "Yeguas Reproductoras", icon: HeartPulse },
    { id: "sementales", label: "Sementales Activos", icon: Crown },
    { id: "embriones", label: "Centro de Embriones", icon: Dna },
    { id: "banco", label: "Banco Genético", icon: Snowflake },
    { id: "calendario", label: "Calendario", icon: Calendar },
    { id: "analytics", label: "Analytics & IA", icon: BarChart2 },
  ];

  return (
    <AppShell>
      {/* 1. Header & 6 Quick Actions */}
      <ReproductionHeader onQuickAction={handleQuickAction} />

      {/* 2. 11 KPI Cards Dashboard */}
      <ReproductionKPIs
        kpis={kpis}
        activeFilter={activeKpiFilter}
        onSelectFilter={handleSelectKpi}
      />

      {/* 3. Operational Intelligence Alerts & Recommendations (Req 13) */}
      <OperationalIntelligenceAlerts />

      {/* 4. Main Navigation View Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border mb-8">
        {mainViews.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              id={`view-tab-${view.id}`}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border hover:bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* 5. Render Active Main View */}
      <div className="min-h-[500px]">
        {activeView === "timeline" && (
          <ReproductionTimeline events={events} />
        )}

        {activeView === "kanban" && (
          <ReproductionKanban
            mares={displayMares}
            onUpdateStatus={handleMareStatusShift}
            onOpenMareProfile={(mare) => setSelectedHorseProfile({ data: mare, type: "mare" })}
          />
        )}

        {activeView === "yeguas" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">Catálogo de Yeguas Reproductoras</h2>
              <button
                onClick={() => handleQuickAction("monta")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> Registrar Yegua
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayMares.map((mare) => (
                <MareCard
                  key={mare.id}
                  mare={mare}
                  onOpenProfile={(m) => setSelectedHorseProfile({ data: m, type: "mare" })}
                />
              ))}
            </div>
          </div>
        )}

        {activeView === "sementales" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">Plantel de Sementales Reproductores</h2>
              <button
                onClick={() => setGeneticModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 text-black font-semibold text-xs"
              >
                <Plus className="h-4 w-4" /> Registrar Dosis Semen
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayStallions.map((st) => (
                <StallionCard
                  key={st.id}
                  stallion={st}
                  onOpenProfile={(s) => setSelectedHorseProfile({ data: s, type: "stallion" })}
                />
              ))}
            </div>
          </div>
        )}

        {activeView === "embriones" && (
          <EmbryoCenter
            embryos={embryos}
            onCreateEmbryo={() => handleQuickAction("embrion")}
          />
        )}

        {activeView === "banco" && (
          <GeneticBankView
            inventory={geneticBank}
            onCreateItem={() => setGeneticModalOpen(true)}
          />
        )}

        {activeView === "calendario" && (
          <ReproductionCalendarView events={events} />
        )}

        {activeView === "analytics" && (
          <ReproductionAnalyticsView />
        )}
      </div>

      {/* 6. Dedicated Enterprise Reproduction Modals */}
      <RegisterBreedingServiceModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onNavigateView={(v) => setActiveView(v as any)}
      />
      <RegisterPalpationModal
        open={palpationModalOpen}
        onClose={() => setPalpationModalOpen(false)}
        onNavigateView={(v) => setActiveView(v as any)}
      />
      <RegisterDiagnosisModal
        open={diagnosisModalOpen}
        onClose={() => setDiagnosisModalOpen(false)}
        onNavigateView={(v) => setActiveView(v as any)}
      />
      <RegisterFoalingModal
        open={foalingModalOpen}
        onClose={() => setFoalingModalOpen(false)}
        onNavigateView={(v) => setActiveView(v as any)}
      />
      <RegisterEmbryoModal
        open={embryoModalOpen}
        onClose={() => setEmbryoModalOpen(false)}
        onNavigateView={(v) => setActiveView(v as any)}
      />
      <AddGeneticMaterialModal
        open={geneticModalOpen}
        onClose={() => setGeneticModalOpen(false)}
      />
    </AppShell>
  );
}
