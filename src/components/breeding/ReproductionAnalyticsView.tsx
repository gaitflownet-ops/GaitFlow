/**
 * ReproductionAnalyticsView.tsx — Analytics & Indicadores Reproductivos
 * Dashboards en tiempo real calculados 100% desde los datos reales de Supabase:
 * Tasa de preñez mensual, rendimiento por semental, éxito por veterinario y distribución de embriones.
 */
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Award, Activity, Users, Baby, BarChart2, Calendar } from "lucide-react";
import {
  useBreedingCycles,
  useStallions,
  useReproductiveEvents,
  useEmbryos,
} from "@/lib/hooks/useBreeding";

export function ReproductionAnalyticsView() {
  const { data: cycles = [] } = useBreedingCycles();
  const { data: stallions = [] } = useStallions();
  const { data: events = [] } = useReproductiveEvents();
  const { data: embryos = [] } = useEmbryos();

  // 1. Monthly Pregnancy Rate Trend (Current Year)
  const pregnancyTrendData = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentYear = new Date().getFullYear();
    const currentMonthIdx = new Date().getMonth();

    const monthlyStats: Record<number, { servicios: number; preñeces: number }> = {};
    for (let m = 0; m <= currentMonthIdx; m++) {
      monthlyStats[m] = { servicios: 0, preñeces: 0 };
    }

    for (const c of cycles) {
      if (!c.insemination_date) continue;
      const d = new Date(c.insemination_date);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        if (monthlyStats[m]) {
          monthlyStats[m].servicios += 1;
          if (c.pregnancy_status === "Confirmed" || c.pregnancy_status === "Preñada") {
            monthlyStats[m].preñeces += 1;
          }
        }
      }
    }

    return Object.keys(monthlyStats).map((k) => {
      const idx = Number(k);
      const st = monthlyStats[idx];
      const tasa = st.servicios > 0 ? Math.round((st.preñeces / st.servicios) * 100) : 0;
      return {
        month: monthNames[idx],
        tasa,
        servicios: st.servicios,
        preñeces: st.preñeces,
      };
    });
  }, [cycles]);

  // Overall Average Rate
  const overallAvgRate = useMemo(() => {
    const totalServ = cycles.length;
    const confirmed = cycles.filter((c) => c.pregnancy_status === "Confirmed" || c.pregnancy_status === "Preñada").length;
    return totalServ > 0 ? Math.round((confirmed / totalServ) * 100) : 0;
  }, [cycles]);

  // 2. Success Rate per Stallion Data
  const stallionSuccessData = useMemo(() => {
    return stallions.slice(0, 6).map((st) => ({
      name: st.horse?.name || `Semental #${st.horse_id.slice(0, 5)}`,
      tasa: st.conception_rate_pct || 0,
      servicios: st.total_services_count || 0,
    }));
  }, [stallions]);

  // 3. Success Rate per Vet Data
  const vetSuccessData = useMemo(() => {
    const vetStats: Record<string, { total: number; positives: number }> = {};
    for (const ev of events) {
      const v = ev.vet_name?.trim();
      if (!v) continue;
      if (!vetStats[v]) vetStats[v] = { total: 0, positives: 0 };
      vetStats[v].total += 1;
      if (ev.result && (ev.result.toLowerCase().includes("positiv") || ev.result.toLowerCase().includes("preñ") || ev.result.toLowerCase().includes("exitos"))) {
        vetStats[v].positives += 1;
      }
    }

    return Object.entries(vetStats).map(([name, s]) => {
      const tasa = s.total > 0 ? Math.round((s.positives / s.total) * 100) : 100;
      return {
        name,
        tasa,
        controles: s.total,
      };
    });
  }, [events]);

  // 4. Embryo Outcome Pie Chart Data
  const embryoOutcomeData = useMemo(() => {
    const total = embryos.length;
    if (total === 0) {
      return [
        { name: "Sin embriones", value: 100, color: "#94a3b8" },
      ];
    }
    const implanted = embryos.filter((e) => e.status === "Implantado" || e.status === "Transferido").length;
    const frozen = embryos.filter((e) => e.status === "Congelado" || e.status === "Recolectado" || e.status === "Disponible").length;
    const lost = embryos.filter((e) => e.status === "Perdido" || e.status === "Reabsorbido" || e.status === "Fallido").length;

    return [
      { name: "Implantados / Transferidos", value: Math.round((implanted / total) * 100) || 0, color: "#10b981", count: implanted },
      { name: "Criopreservados / Banco", value: Math.round((frozen / total) * 100) || 0, color: "#06b6d4", count: frozen },
      { name: "Pérdidas / No viables", value: Math.round((lost / total) * 100) || 0, color: "#ef4444", count: lost },
    ].filter((item) => item.value > 0 || item.count! > 0);
  }, [embryos]);

  const hasAnyData = cycles.length > 0 || events.length > 0 || embryos.length > 0;

  return (
    <div className="space-y-6">
      {/* Upper Grid: Trend & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pregnancy Rate Trend Line Chart */}
        <div className="lg:col-span-2 lux-card p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> Tasa de Preñez Mensual (%)
              </h3>
              <p className="text-xs text-muted-foreground">Evolución de efectividad reproductiva y servicios totales de tu criadero</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Promedio Actual: {overallAvgRate}%
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pregnancyTrendData}>
                <defs>
                  <linearGradient id="colorTasa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="currentColor" className="text-xs text-muted-foreground" />
                <YAxis domain={[0, 100]} stroke="currentColor" className="text-xs text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Area type="monotone" dataKey="tasa" name="Tasa Preñez (%)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTasa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Embryo Outcome Pie Chart */}
        <div className="lux-card p-6">
          <div className="mb-6 pb-3 border-b border-border">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Baby className="h-5 w-5 text-cyan-500" /> Distribución de Embriones
            </h3>
            <p className="text-xs text-muted-foreground">Destino de lavados y transferencias reales</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={embryoOutcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {embryoOutcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs pt-2">
            {embryoOutcomeData.map((d) => (
              <div key={d.name} className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground truncate">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-bold shrink-0">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Grid: Stallion & Vet Benchmarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stallion Success Benchmark */}
        <div className="lux-card p-6">
          <div className="mb-6 pb-3 border-b border-border">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Éxito por Semental (%)
            </h3>
            <p className="text-xs text-muted-foreground">Tasa de concepción calculada por semental activo</p>
          </div>

          {stallionSuccessData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4">
              <Award className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No hay servicios registrados con sementales aún.</p>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stallionSuccessData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" domain={[0, 100]} stroke="currentColor" className="text-xs text-muted-foreground" />
                  <YAxis dataKey="name" type="category" stroke="currentColor" className="text-xs text-muted-foreground" width={110} />
                  <Tooltip />
                  <Bar dataKey="tasa" name="Tasa de Concepción (%)" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Vet Success Benchmark */}
        <div className="lux-card p-6">
          <div className="mb-6 pb-3 border-b border-border">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" /> Rendimiento por Veterinario (%)
            </h3>
            <p className="text-xs text-muted-foreground">Efectividad y controles realizados por profesional</p>
          </div>

          {vetSuccessData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No hay eventos clínicos con veterinarios asignados aún.</p>
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vetSuccessData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" domain={[0, 100]} stroke="currentColor" className="text-xs text-muted-foreground" />
                  <YAxis dataKey="name" type="category" stroke="currentColor" className="text-xs text-muted-foreground" width={130} />
                  <Tooltip />
                  <Bar dataKey="tasa" name="Éxito Diagnósticos (%)" fill="#6366f1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
