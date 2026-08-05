/**
 * OperationalIntelligenceAlerts.tsx — Panel de Recomendaciones e Inteligencia Operativa (Requerimiento 13)
 */
import { Brain, AlertTriangle, CheckCircle, TrendingUp, Sparkles, Bell } from "lucide-react";

export function OperationalIntelligenceAlerts() {
  const alerts = [
    {
      id: "1",
      type: "warning",
      title: "4 Palpaciones Vencidas",
      desc: "Las yegua Luna, Esperanza, Sultana y Princesa superaron la ventana de diagnóstico de 14 días post-servicio.",
      action: "Programar Ecografía",
      badge: "Urgente",
    },
    {
      id: "2",
      type: "info",
      title: "Desempeño Destacado de Semental",
      desc: "Carbonero presenta la mayor tasa de preñez del criadero (91.5% en 12 servicios este trimestre).",
      action: "Ver Semental",
      badge: "Holt-Winters IA",
    },
    {
      id: "3",
      type: "success",
      title: "Rendimiento Superior de Receptora",
      desc: "La receptora Esperanza supera el promedio de éxito del criadero con 3 transferencias implantadas consecutivas.",
      action: "Ver Receptora",
      badge: "Recomendación",
    },
    {
      id: "4",
      type: "urgent",
      title: "2 Partos Inminentes en los próximos 7 días",
      desc: "Yegua Dulcinea (ETA: 2 días) y Yegua Maravilla (ETA: 6 días) ingresan a vigilancia continua.",
      action: "Ver Partos",
      badge: "Partos",
    },
  ];

  return (
    <div className="lux-card p-5 mb-8 bg-gradient-to-r from-primary/5 via-card to-background border-primary/20">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Inteligencia Operativa & Recomendaciones</h3>
            <p className="text-xs text-muted-foreground">Alertas proactivas calculadas en tiempo real para optimizar la fertilidad del criadero</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> 4 Alertas Activas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
              a.type === "warning"
                ? "bg-amber-500/5 border-amber-500/20"
                : a.type === "urgent"
                ? "bg-rose-500/5 border-rose-500/20"
                : a.type === "success"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-blue-500/5 border-blue-500/20"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold">{a.title}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                  {a.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{a.desc}</p>
            </div>
            <button className="text-[11px] font-semibold text-primary hover:underline self-start">
              {a.action} ➔
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
