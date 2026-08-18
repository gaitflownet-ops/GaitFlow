/**
 * ReproductionHeader.tsx — Header & Unified 5 Quick Action Wizards for the Reproduction Center
 */
import {
  HeartPulse,
  Stethoscope,
  Activity,
  Baby,
  Dna,
  Sparkles,
} from "lucide-react";

export type ReproductionQuickActionType = "servicio" | "palpacion" | "diagnostico" | "parto" | "embrion";

interface Props {
  onQuickAction: (actionType: ReproductionQuickActionType) => void;
}

export function ReproductionHeader({ onQuickAction }: Props) {
  const quickActions = [
    {
      type: "servicio" as const,
      label: "Registrar Servicio",
      sublabel: "Monta / Inseminación / TE",
      icon: HeartPulse,
      color: "hover:border-primary/50 hover:bg-primary/5 text-primary border-primary/20",
    },
    {
      type: "palpacion" as const,
      label: "Registrar Palpación",
      sublabel: "Examen folicular / Útero",
      icon: Stethoscope,
      color: "hover:border-purple-400/50 hover:bg-purple-500/5 text-purple-600",
    },
    {
      type: "diagnostico" as const,
      label: "Diagnóstico Gestación",
      sublabel: "Ecografía / Confirmación",
      icon: Activity,
      color: "hover:border-emerald-400/50 hover:bg-emerald-500/5 text-emerald-600",
    },
    {
      type: "parto" as const,
      label: "Registrar Parto",
      sublabel: "Nacimiento y alta cría",
      icon: Baby,
      color: "hover:border-rose-400/50 hover:bg-rose-500/5 text-rose-600",
    },
    {
      type: "embrion" as const,
      label: "Registrar Embrión",
      sublabel: "Lavado / Transferencia",
      icon: Dna,
      color: "hover:border-cyan-400/50 hover:bg-cyan-500/5 text-cyan-600",
    },
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
            Gestiona todo el ciclo reproductivo del criadero desde un único lugar: servicios, chequeos foliculares, diagnósticos, partos, embriones y banco genético.
          </p>
        </div>

        {/* Quick Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 shrink-0">
          {quickActions.map((action) => (
            <button
              key={action.type}
              id={`quick-action-${action.type}`}
              onClick={() => onQuickAction(action.type)}
              className={`flex flex-col items-start gap-1 p-3 rounded-2xl border bg-card shadow-xs transition-all ${action.color}`}
            >
              <action.icon className="h-5 w-5 shrink-0 mb-0.5" />
              <span className="font-bold text-xs leading-tight">{action.label}</span>
              <span className="text-[10px] text-muted-foreground font-normal leading-none">{action.sublabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
