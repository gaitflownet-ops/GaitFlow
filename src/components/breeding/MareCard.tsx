/**
 * MareCard.tsx — Tarjeta Profesional de Yegua Reproductora (Requerimiento 5)
 */
import { HeartPulse, Calendar, Activity, ChevronRight, Dna } from "lucide-react";
import type { Mare } from "@/lib/hooks/useBreeding";

interface Props {
  mare: Mare;
  onOpenProfile: (mare: Mare) => void;
}

export function MareCard({ mare, onOpenProfile }: Props) {
  const h = mare.horse || {
    name: "Yegua Sin Nombre",
    code: "YEG-000",
    age: 6,
    breed: "Paso Fino",
    image_url: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80",
    bloodline: "Carbonero × Dulcinea",
  };

  const statusColors: Record<string, string> = {
    "Vacías": "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    "En celo": "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    "Programadas": "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "Servidas": "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "Diagnóstico": "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "Preñadas": "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "Próximas al parto": "border-rose-400 bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
    "Lactancia": "border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    "Descanso": "border-slate-200 bg-secondary text-muted-foreground",
  };

  return (
    <div className="lux-card overflow-hidden group hover:border-primary/50 transition-all flex flex-col justify-between">
      {/* Header Photo & Badge */}
      <div className="relative h-44 w-full bg-secondary overflow-hidden">
        <img
          src={h.image_url || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80"}
          alt={h.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${statusColors[mare.reproductive_status] || statusColors["Vacías"]}`}>
            {mare.reproductive_status}
          </span>
        </div>

        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-[10px] uppercase font-bold tracking-wider text-white/70">
            {h.code || `YEG-${mare.id.slice(0, 5).toUpperCase()}`} · {h.breed || "Criollo"}
          </div>
          <h3 className="font-display text-xl font-bold truncate leading-tight">{h.name}</h3>
        </div>
      </div>

      {/* Body Info */}
      <div className="p-4 space-y-3 text-xs flex-1">
        <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border text-muted-foreground">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70">Edad</span>
            <span className="font-semibold text-foreground">{h.age ? `${h.age} Años` : "N/E"}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70">Pedigree</span>
            <span className="font-semibold text-foreground truncate block">{h.bloodline || "N/D"}</span>
          </div>
        </div>

        {/* Gestation stats if pregnant */}
        {mare.gestation_days ? (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <div className="flex justify-between font-bold text-xs">
              <span>🤰 Gestación: {mare.gestation_days} Días</span>
              <span>{Math.round((mare.gestation_days / 340) * 100)}%</span>
            </div>
            {mare.expected_foaling_date && (
              <div className="text-[11px] text-emerald-600/90 dark:text-emerald-400 mt-0.5">
                ETA Parto: {new Date(mare.expected_foaling_date).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 text-muted-foreground">
            <div className="flex justify-between">
              <span>Última Monta / Serv.:</span>
              <span className="font-medium text-foreground">{mare.last_service_date ? new Date(mare.last_service_date).toLocaleDateString() : "Sin registro"}</span>
            </div>
            <div className="flex justify-between">
              <span>Último Diagnóstico:</span>
              <span className="font-medium text-foreground">{mare.last_diagnosis_date ? new Date(mare.last_diagnosis_date).toLocaleDateString() : "Pendiente"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-4 pt-0">
        <button
          id={`btn-open-mare-${mare.id}`}
          onClick={() => onOpenProfile(mare)}
          className="w-full py-2.5 rounded-xl border border-border bg-secondary hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          Ver Ficha Completa <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
