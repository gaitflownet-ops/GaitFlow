import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HorseCard } from "@/components/HorseCard";
import { useApp } from "@/lib/store";
import { useState, useMemo } from "react";
import { useHorses } from "@/lib/hooks/useHorses";
import { useUpdates } from "@/lib/hooks/useUpdates";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
import { useLocations, useLocationHistory, useQuarantineHistory } from "@/lib/hooks/useLocations";
import { Home, MapPin, Activity, ShieldAlert } from "lucide-react";
import {
  Camera,
  Video,
  Trophy,
  HeartPulse,
  PenLine,
  Wrench,
  BellPlus,
  ArrowUpRight,
  TrendingUp,
  CalendarDays,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Play,
} from "lucide-react";
import { AddUpdateModal } from "@/components/modals/AddUpdateModal";
import { AddHealthRecordModal } from "@/components/modals/AddHealthRecordModal";
import { AddCompetitionModal } from "@/components/modals/AddCompetitionModal";
import { PremiumKPICards } from "@/components/dashboard/PremiumKPICards";
import { DailyScheduleWidget } from "@/components/DailyScheduleWidget";
import { StableOperationsWidget } from "@/components/dashboard/StableOperationsWidget";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EquiSales" },
      {
        name: "description",
        content: "The premium operating system for horse owners, farms, and trainers.",
      },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { label: "Upload Photo", icon: Camera, type: "photo" as const },
  { label: "Upload Video", icon: Video, type: "video" as const },
  { label: "Add Competition", icon: Trophy, type: "competition" as const },
  { label: "Add Health Record", icon: HeartPulse, type: "health" as const },
  { label: "Add Training Note", icon: PenLine, type: "training" as const },
  { label: "Add Service", icon: Wrench, type: "service" as const },
  { label: "Add Reminder", icon: BellPlus, type: "reminder" as const },
];

function getUpdateIcon(type: string) {
  switch (type) {
    case "competition":
      return Trophy;
    case "health":
    case "farrier":
    case "vet":
    case "dental":
      return HeartPulse;
    case "training":
    case "note":
      return PenLine;
    case "media":
      return Camera;
    default:
      return Sparkles;
  }
}

function Dashboard() {
  const { state, dispatch } = useApp();
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [addHealthOpen, setAddHealthOpen] = useState(false);
  const [addCompetitionOpen, setAddCompetitionOpen] = useState(false);
  const [likedUpdates, setLikedUpdates] = useState<Set<string>>(new Set());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";
  const userName = state.user?.name?.split(" ")[0] ?? "Usuario";

  const { data: horses = [], isLoading: loadingHorses } = useHorses();
  const { data: allUpdates = [], isLoading: loadingUpdates } = useUpdates();
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();

  const { data: locations = [] } = useLocations();
  const { data: movements = [] } = useLocationHistory();
  const { data: quarantines = [] } = useQuarantineHistory();

  // Operational dashboard calculations
  const stableStats = useMemo(() => {
    const stableLocations = locations.filter(l => l.type?.toLowerCase() === 'stable');
    const totalStableCap = stableLocations.reduce((acc, loc) => acc + (loc.capacity || 0), 0);
    const occupiedStables = movements.filter(m => {
      if (m.end_date) return false;
      const loc = locations.find(l => l.id === m.new_location_id);
      return loc?.type?.toLowerCase() === 'stable';
    }).length;

    const inClinic = movements.filter(m => {
      if (m.end_date) return false;
      const loc = locations.find(l => l.id === m.new_location_id);
      return loc?.type?.toLowerCase() === 'clinic' || loc?.type?.toLowerCase() === 'clínica';
    }).length;

    const activeQuarantine = quarantines.filter(q => q.status === 'Active').length;
    
    const paddocks = locations.filter(l => l.type?.toLowerCase() === 'paddock' || l.type?.toLowerCase() === 'potrero');
    const restingPaddocks = paddocks.filter(p => p.rotation_status === 'Resting').length;
    const grazingPaddocks = paddocks.filter(p => p.rotation_status === 'Grazing').length;

    return {
      totalStableCap,
      occupiedStables,
      inClinic,
      activeQuarantine,
      totalPaddocks: paddocks.length,
      restingPaddocks,
      grazingPaddocks
    };
  }, [locations, movements, quarantines]);

  const handleLike = (id: string) => {
    setLikedUpdates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQuickAction = (type: string) => {
    if (type === "health") {
      setAddHealthOpen(true);
    } else if (type === "competition") {
      setAddCompetitionOpen(true);
    } else {
      dispatch({ type: "SET_QUICK_ACTION", open: true });
    }
  };

  return (
    <AppShell>
      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border animate-fade-up">
        <img
          src="https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"
          alt="Stable at dawn"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.18_0.018_60/0.85)] via-[oklch(0.22_0.04_155/0.55)] to-transparent" />
        <div className="relative p-10 lg:px-14 lg:py-24 text-primary-foreground">
          <div className="eyebrow !text-primary-foreground/70">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <h1 className="font-display text-4xl lg:text-6xl mt-3 max-w-2xl leading-[1.02]">
            {greeting}, {userName}.
            <span className="block gold-text">El criadero está activo y productivo hoy.</span>
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/80 text-[15px]">
            {loadingHorses ? "..." : horses.length} caballos en trabajo, 
            y {loadingMetrics ? "..." : (metrics?.weeklyUpdates ?? allUpdates.length)} actualizaciones 
            de tu equipo esperándote.
          </p>
        </div>
      </section>

      {/* KPIs Section */}
      <PremiumKPICards />

      {/* Quick actions */}
      <section className="mt-10 animate-fade-up-delay-1">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="eyebrow">Acciones rápidas</div>
            <h2 className="font-display text-2xl mt-1">Todo en menos de 15 segundos</h2>
          </div>
          <span className="text-xs text-muted-foreground hidden md:block">
            Toca para registrar · sincroniza con el caballo
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickActions.map(({ label, icon: Icon, type }) => (
            <button
              key={label}
              id={`dashboard-quick-${type}`}
              onClick={() => handleQuickAction(type)}
              className="lux-card p-4 text-left flex flex-col gap-3 hover:-translate-y-0.5 transition-transform active:scale-95"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[13px] font-medium leading-tight text-foreground/90">
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>



      {/* Timeline + side rail */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl">Actividad del Criadero</h2>
          </div>

          {loadingUpdates ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-secondary rounded-2xl"></div>
              <div className="h-32 bg-secondary rounded-2xl"></div>
            </div>
          ) : allUpdates.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Sin actividad reciente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allUpdates.map((update, i) => {
                const horse = horses.find((h) => h.id === update.horse_id);
                const isLiked = likedUpdates.has(update.id);
                const Icon = getUpdateIcon(update.type);

                return (
                  <div
                    key={update.id}
                    className="lux-card p-4 group animate-fade-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground border border-border/50 shadow-sm group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              {horse ? (
                                <Link
                                  to="/horses/$horseId"
                                  params={{ horseId: horse.slug || horse.id }}
                                  className="text-[12px] font-semibold text-primary hover:underline uppercase tracking-widest"
                                >
                                  {horse.name}
                                </Link>
                              ) : (
                                <span className="text-[12px] font-semibold text-primary uppercase tracking-widest">
                                  Novedad del Criadero
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground">• {update.at}</span>
                            </div>
                            <h4 className="mt-0.5 font-display text-[17px] leading-tight group-hover:text-primary transition-colors">
                              {update.title}
                            </h4>
                          </div>
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                          {update.body}
                        </p>
                        {update.media_url && (
                          <div className="mt-3 overflow-hidden rounded-xl bg-black max-h-[180px] relative cursor-pointer">
                            <img
                              src={update.media_url}
                              alt="Update media"
                              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                            />
                            {update.type === "media" && (
                              <span className="absolute inset-0 grid place-items-center bg-black/10">
                                <span className="grid h-14 w-14 place-items-center rounded-full bg-background/90 backdrop-blur">
                                  <Play className="h-5 w-5 text-foreground ml-0.5" />
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Por {update.by}</span>
                          <span className="inline-flex items-center gap-3">
                            <button
                              onClick={() => handleLike(update.id)}
                              className={`inline-flex items-center gap-1.5 transition-colors ${
                                isLiked ? "text-red-500" : "hover:text-foreground"
                              }`}
                            >
                              <Heart
                                className="h-3.5 w-3.5"
                                fill={isLiked ? "currentColor" : "none"}
                              />
                              {(update.likes || 0) + (isLiked ? 1 : 0)}
                            </button>
                            <button className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {update.comments || 0}
                            </button>
                            <button className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side rail widgets */}
        <div className="space-y-6 lg:mt-0">
          {/* Spatial Control Center quick stats */}
          <div className="lux-card p-6 space-y-4">
            <h3 className="font-display text-lg flex items-center gap-2 border-b border-border/60 pb-2">
              <Home className="h-4.5 w-4.5 text-primary" /> Ocupación del Criadero
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/15 p-3.5 rounded-2xl border border-border/40 text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Pesebreras</span>
                <div className="font-display text-2xl font-bold mt-1 text-foreground">
                  {stableStats.occupiedStables} / {stableStats.totalStableCap || 0}
                </div>
                <div className="h-1 w-full bg-border/50 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${stableStats.totalStableCap ? Math.min(100, Math.round((stableStats.occupiedStables / stableStats.totalStableCap) * 100)) : 0}%` }} 
                  />
                </div>
              </div>

              <div className="bg-secondary/15 p-3.5 rounded-2xl border border-border/40 text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">Potreros Activos</span>
                <div className="font-display text-2xl font-bold mt-1 text-emerald-500">
                  {stableStats.grazingPaddocks} / {stableStats.totalPaddocks || 0}
                </div>
                <div className="text-[9px] text-muted-foreground mt-2">
                  {stableStats.restingPaddocks} en descanso
                </div>
              </div>

              <div className="bg-secondary/15 p-3.5 rounded-2xl border border-border/40 text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground">En Clínica</span>
                <div className="font-display text-2xl font-bold mt-1 text-sky-500">
                  {stableStats.inClinic}
                </div>
                <div className="text-[9px] text-muted-foreground mt-2 font-medium">
                  Atención médica
                </div>
              </div>

              <div className="bg-secondary/15 p-3.5 rounded-2xl border border-border/40 text-center border-red-500/20 bg-red-500/5">
                <span className="text-[10px] uppercase font-mono text-red-500 font-semibold">En Aislamiento</span>
                <div className="font-display text-2xl font-bold mt-1 text-red-500">
                  {stableStats.activeQuarantine}
                </div>
                <div className="text-[9px] text-red-500 mt-2 font-medium">
                  Cuarentena activa
                </div>
              </div>
            </div>

            <Link
              to="/locations"
              className="mt-2 block w-full text-center text-xs font-semibold text-primary hover:underline"
            >
              Ver mapa del criadero →
            </Link>
          </div>

          <StableOperationsWidget />

          <DailyScheduleWidget />
        </div>
      </div>

      <AddUpdateModal open={addUpdateOpen} onOpenChange={setAddUpdateOpen} />
      <AddHealthRecordModal open={addHealthOpen} onOpenChange={setAddHealthOpen} />
      <AddCompetitionModal open={addCompetitionOpen} onOpenChange={setAddCompetitionOpen} />
    </AppShell>
  );
}
