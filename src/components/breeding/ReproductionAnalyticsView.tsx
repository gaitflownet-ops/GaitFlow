/**
 * ReproductionAnalyticsView.tsx — Analytics & Indicadores Reproductivos (Requerimiento 12)
 * Recharts dashboards: Tasa de preñez, éxito por semental/veterinario, rendimiento donadoras/receptoras
 */
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
import { TrendingUp, Award, Activity, Users, Baby, BarChart2 } from "lucide-react";

export function ReproductionAnalyticsView() {
  // Monthly Pregnancy Rate Trend Data
  const pregnancyTrendData = [
    { month: "Ene", tasa: 72, servicios: 10, preñeces: 7 },
    { month: "Feb", tasa: 78, servicios: 12, preñeces: 9 },
    { month: "Mar", tasa: 85, servicios: 14, preñeces: 12 },
    { month: "Abr", tasa: 80, servicios: 15, preñeces: 12 },
    { month: "May", tasa: 88, servicios: 16, preñeces: 14 },
    { month: "Jun", tasa: 84, servicios: 13, preñeces: 11 },
    { month: "Jul", tasa: 91, servicios: 11, preñeces: 10 },
    { month: "Ago", tasa: 89, servicios: 9, preñeces: 8 },
  ];

  // Success Rate per Stallion Data
  const stallionSuccessData = [
    { name: "Carbonero V", tasa: 91.5, servicios: 12 },
    { name: "Dulce Sueño", tasa: 88.0, servicios: 15 },
    { name: "Aristócrata", tasa: 82.3, servicios: 9 },
    { name: "Monarca IV", tasa: 76.5, servicios: 8 },
  ];

  // Success Rate per Vet Data
  const vetSuccessData = [
    { name: "Dr. Roberto Silva", tasa: 92.0, controles: 25 },
    { name: "Dra. María Gómez", tasa: 87.5, controles: 18 },
    { name: "Dr. Carlos Rossi", tasa: 84.0, controles: 12 },
  ];

  // Embryo Transfer Outcome Pie Chart Data
  const embryoOutcomeData = [
    { name: "Implantados (Éxito)", value: 65, color: "#10b981" },
    { name: "Congelados Banco", value: 20, color: "#06b6d4" },
    { name: "Pérdidas Reabsorción", value: 15, color: "#ef4444" },
  ];

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
              <p className="text-xs text-muted-foreground">Evolución de efectividad reproductiva y servicios totales</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Promedio: 84.6%
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
                <YAxis domain={[50, 100]} stroke="currentColor" className="text-xs text-muted-foreground" />
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
            <p className="text-xs text-muted-foreground">Destino de lavados y transferencias</p>
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
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-bold">{d.value}%</span>
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
            <p className="text-xs text-muted-foreground">Tasa de concepción lograda por reproductor</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stallionSuccessData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" domain={[0, 100]} stroke="currentColor" className="text-xs text-muted-foreground" />
                <YAxis dataKey="name" type="category" stroke="currentColor" className="text-xs text-muted-foreground" width={100} />
                <Tooltip />
                <Bar dataKey="tasa" name="Tasa de Concepción (%)" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vet Success Benchmark */}
        <div className="lux-card p-6">
          <div className="mb-6 pb-3 border-b border-border">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" /> Rendimiento por Veterinario (%)
            </h3>
            <p className="text-xs text-muted-foreground">Efectividad en procedimientos y ecografías</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vetSuccessData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" domain={[0, 100]} stroke="currentColor" className="text-xs text-muted-foreground" />
                <YAxis dataKey="name" type="category" stroke="currentColor" className="text-xs text-muted-foreground" width={120} />
                <Tooltip />
                <Bar dataKey="tasa" name="Éxito Diagnósticos (%)" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
