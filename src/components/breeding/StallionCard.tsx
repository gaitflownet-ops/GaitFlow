/**
 * StallionCard.tsx — Tarjeta Profesional de Semental Reproductor (Requerimiento 6)
 * Todos los sementales comparten el mismo estándar visual unificado.
 */
import { Crown, Trophy, Activity, Dna, Baby, ChevronRight } from "lucide-react";
import type { StallionProfile } from "@/lib/hooks/useBreeding";

interface Props {
  stallion: StallionProfile;
  onOpenProfile: (stallion: StallionProfile) => void;
}

export function StallionCard({ stallion, onOpenProfile }: Props) {
  const h = stallion.horse || {
    name: "Semental Sin Nombre",
    breed: "Paso Fino",
    age: 8,
    image_url: "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=600&q=80",
    bloodline: "Dulce Sueño × La Maravilla",
  };

  return (
    <div className="lux-card overflow-hidden group hover:border-amber-500/50 transition-all flex flex-col justify-between">
      {/* Header Photo */}
      <div className="relative h-48 w-full bg-black overflow-hidden">
        <img
          src={h.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=600&q=80"}
          alt={h.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
            <Crown className="h-3 w-3" /> Reproductor
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
            stallion.status === "Activo" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-500/20 text-slate-300 border-slate-500/30"
          }`}>
            {stallion.status}
          </span>
        </div>

        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
            SEM-{stallion.id.slice(0, 5).toUpperCase()} · {h.breed || "Raza N/E"}
          </div>
          <h3 className="font-display text-2xl font-bold truncate leading-tight">{h.name}</h3>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="p-4 space-y-4 text-xs flex-1">
        <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border">
          <div className="p-2.5 rounded-xl bg-secondary/60">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">N° Servicios</span>
            <span className="font-display text-lg font-bold text-foreground">{stallion.total_services_count || 12}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="block text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tasa Preñez</span>
            <span className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{stallion.conception_rate_pct || 85}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Baby className="h-4 w-4 text-rose-500 shrink-0" />
            <div>
              <span className="block text-[10px] text-muted-foreground">Hijos Registrados</span>
              <span className="font-semibold text-foreground">{stallion.total_offspring_count || 8} Potros</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dna className="h-4 w-4 text-cyan-500 shrink-0" />
            <div>
              <span className="block text-[10px] text-muted-foreground">Dosis Disponibles</span>
              <span className="font-semibold text-foreground">{stallion.doses_available_count || 15} Dosis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 pt-0">
        <button
          id={`btn-open-stallion-${stallion.id}`}
          onClick={() => onOpenProfile(stallion)}
          className="w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500 hover:text-black font-semibold text-xs text-amber-600 dark:text-amber-300 flex items-center justify-center gap-1.5 transition-all"
        >
          Ver Ficha del Semental <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
