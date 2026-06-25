import { useDashboardKPIs } from "@/lib/hooks/useDashboardKPIs";
import { Link } from "@tanstack/react-router";
import { 
  Activity, 
  CheckCircle2, 
  Database, 
  HeartPulse, 
  Trophy, 
  Users, 
  ChevronRight, 
  Home,
  AlertTriangle,
  Clock
} from "lucide-react";

export function PremiumKPICards() {
  const { data, isLoading } = useDashboardKPIs();

  if (isLoading) {
    return (
      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-secondary/50 rounded-2xl border border-border" />
        ))}
      </section>
    );
  }

  // Fallback to empty if data failed to load
  const kpis = data || {
    inventory: { total: 0, mares: 0, stallions: 0, foals: 0, competition: 0 },
    tasks: { completed: 0, pending: 0, overdue: 0, compliance: 0 },
    stalls: { total: 0, occupied: 0, available: 0, occupancyRate: 0 },
    breeding: { activeMares: 0, pregnancies: 0, expectedFoals: 0, genetics: 0 },
    competitions: { active: 0, upcoming: 0, results: 0 },
    health: { alerts: 0, medications: 0, nutrition: 0, pending: 0 }
  };

  const cards = [
    {
      id: "inventory",
      title: "Inventario Equino",
      icon: Users,
      link: "/horses",
      primaryValue: kpis.inventory.total.toString(),
      primaryLabel: "Ejemplares Totales",
      metrics: [
        { label: "Yeguas", value: kpis.inventory.mares },
        { label: "Reproductores", value: kpis.inventory.stallions },
        { label: "Potros", value: kpis.inventory.foals },
      ],
      colorClass: "text-blue-500",
      bgClass: "bg-blue-500/10"
    },
    {
      id: "flow",
      title: "Score Operativo",
      icon: Activity,
      link: "/tasks",
      primaryValue: `${kpis.tasks.compliance}%`,
      primaryLabel: "Cumplimiento Diario",
      metrics: [
        { label: "Completadas", value: kpis.tasks.completed, highlight: "text-emerald-500" },
        { label: "Pendientes", value: kpis.tasks.pending },
        { label: "Vencidas", value: kpis.tasks.overdue, highlight: kpis.tasks.overdue > 0 ? "text-red-500" : "" },
      ],
      colorClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10"
    },
    {
      id: "stalls",
      title: "Capacidad de Pesebres",
      icon: Home,
      link: "/locations",
      primaryValue: `${kpis.stalls.occupancyRate}%`,
      primaryLabel: "Ocupación Actual",
      metrics: [
        { label: "Disponibles", value: kpis.stalls.available, highlight: "text-emerald-500" },
        { label: "Ocupados", value: kpis.stalls.occupied },
        { label: "Totales", value: kpis.stalls.total },
      ],
      colorClass: "text-amber-500",
      bgClass: "bg-amber-500/10"
    },
    {
      id: "breeding",
      title: "Programa Reproductivo",
      icon: Database,
      link: "/breeding",
      primaryValue: kpis.breeding.pregnancies.toString(),
      primaryLabel: "Preñeces Activas",
      metrics: [
        { label: "Yeguas Cría", value: kpis.breeding.activeMares },
        { label: "Potros Esp.", value: kpis.breeding.expectedFoals },
        { label: "Genética", value: kpis.breeding.genetics },
      ],
      colorClass: "text-purple-500",
      bgClass: "bg-purple-500/10"
    },
    {
      id: "competitions",
      title: "Rendimiento Competitivo",
      icon: Trophy,
      link: "/competitions",
      primaryValue: kpis.competitions.active.toString(),
      primaryLabel: "Caballos en Competencia",
      metrics: [
        { label: "Próximas", value: kpis.competitions.upcoming, highlight: "text-[var(--gold)]" },
        { label: "Resultados", value: kpis.competitions.results },
        { label: "En Entren.", value: kpis.inventory.competition },
      ],
      colorClass: "text-[var(--gold)]",
      bgClass: "bg-[var(--gold)]/10"
    },
    {
      id: "health",
      title: "Salud y Operaciones",
      icon: HeartPulse,
      link: "/health",
      primaryValue: kpis.health.alerts > 0 ? kpis.health.alerts.toString() : "OK",
      primaryLabel: kpis.health.alerts > 0 ? "Alertas de Salud" : "Estado General",
      primaryHighlight: kpis.health.alerts > 0 ? "text-red-500" : "text-emerald-500",
      metrics: [
        { label: "Med. Bajos", value: kpis.health.medications, highlight: kpis.health.medications > 0 ? "text-amber-500" : "" },
        { label: "Nutrición", value: kpis.health.nutrition },
        { label: "Acciones", value: kpis.health.pending },
      ],
      colorClass: "text-red-500",
      bgClass: "bg-red-500/10"
    }
  ];

  return (
    <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up-delay-1">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            to={card.link as any}
            className="group lux-card p-4 lg:p-5 flex flex-col justify-between hover:border-primary/40 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${card.bgClass} rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-700`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`grid h-8 w-8 place-items-center rounded-lg bg-background border border-border shadow-sm ${card.colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors group-hover:translate-x-1" />
              </div>
              
              <div className="mb-4">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  {card.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className={`font-display text-3xl leading-none ${card.primaryHighlight || "text-foreground"}`}>
                    {card.primaryValue}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {card.primaryLabel}
                </p>
              </div>

              {/* Mini Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                {card.metrics.map((metric, idx) => (
                  <div key={idx}>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5 truncate" title={metric.label}>
                      {metric.label}
                    </div>
                    <div className={`font-medium text-[13px] ${metric.highlight || "text-foreground"}`}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
