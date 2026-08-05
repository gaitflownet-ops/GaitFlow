/**
 * ReproductionHeader.tsx — Header & 6 Quick Action Wizards for the Reproduction Center
 */
import {
  HeartPulse,
  Syringe,
  Stethoscope,
  Activity,
  Baby,
  Dna,
  Sparkles,
} from "lucide-react";

interface Props {
  onQuickAction: (actionType: "monta" | "inseminacion" | "palpacion" | "diagnostico" | "parto" | "embrion") => void;
}

export function ReproductionHeader({ onQuickAction }: Props) {
  const quickActions = [
    { type: "monta" as const, label: "Nueva Monta", icon: HeartPulse, color: "hover:border-amber-400/50 hover:bg-amber-500/5 text-amber-600" },
    { type: "inseminacion" as const, label: "Nueva Inseminación", icon: Syringe, color: "hover:border-blue-400/50 hover:bg-blue-500/5 text-blue-600" },
    { type: "palpacion" as const, label: "Registrar Palpación", icon: Stethoscope, color: "hover:border-purple-400/50 hover:bg-purple-500/5 text-purple-600" },
    { type: "diagnostico" as const, label: "Registrar Diagnóstico", icon: Activity, color: "hover:border-emerald-400/50 hover:bg-emerald-500/5 text-emerald-600" },
    { type: "parto" as const, label: "Registrar Parto", icon: Baby, color: "hover:border-rose-400/50 hover:bg-rose-500/5 text-rose-600" },
    { type: "embrion" as const, label: "Registrar Embrión", icon: Dna, color: "hover:border-cyan-400/50 hover:bg-cyan-500/5 text-cyan-600" },
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            <Sparkles className="h-3.5 w-3.5" /> GaitFlow Breeding Suite Enterprise
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
            Centro de Reproducción
          </h1>
          <p className="text-muted-foreground mt-1.5 text-base max-w-2xl">
            Gestiona todo el ciclo reproductivo del criadero desde un único lugar: yeguas, sementales, embriones, banco genético, indicadores y planificación.
          </p>
        </div>

        {/* Quick Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
          {quickActions.map((action) => (
            <button
              key={action.type}
              id={`quick-action-${action.type}`}
              onClick={() => onQuickAction(action.type)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card shadow-xs text-xs font-medium transition-all ${action.color}`}
            >
              <action.icon className="h-4 w-4 shrink-0" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
