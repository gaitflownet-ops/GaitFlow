import { Link } from "@tanstack/react-router";
import { type Horse } from "@/lib/hooks/useHorses";
import { ArrowUpRight, Camera, MapPin } from "lucide-react";
import { getStatusLabel } from "@/lib/utils";

export function HorseCard({ horse }: { horse: Horse }) {
  const location = horse.location?.split("·")[0]?.trim() || horse.location || "Ubicación pendiente";

  return (
    <div className="group flex flex-col h-full bg-background border border-border/70 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 rounded-[24px] overflow-hidden relative">
      <Link
        to="/horses/$horseId"
        params={{ horseId: horse.slug || horse.id }}
        id={`horse-card-${horse.id}`}
        className="block flex-1 flex flex-col"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary/15 rounded-t-[23px] shrink-0">
          {horse.image_url ? (
            <img
              src={horse.image_url}
              alt={horse.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground/60 bg-muted/40">
              <Camera className="h-9 w-9 mb-2 opacity-40" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sin foto</span>
            </div>
          )}
          
          {/* Status Badge overlayed at top-left */}
          <div className="absolute top-4 left-4 z-10">
            <span className="rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-[9px] tracking-wider font-bold uppercase text-foreground shadow-sm">
              {getStatusLabel(horse.status)}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col justify-between flex-1">
          <div className="space-y-2">
            {/* Eyebrow: Gait or Discipline */}
            <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--gold)]">
              {horse.gait_type || horse.discipline || "Ejemplar"}
            </div>
            
            {/* Horse Name */}
            <h3 className="font-display text-xl leading-snug text-foreground group-hover:text-primary transition-colors font-medium">
              {horse.name}
            </h3>
            
            {/* Breed, Age, Sex */}
            <p className="text-xs text-muted-foreground font-medium">
              {horse.breed || "Criollo Colombiano"} • {horse.age ? `${horse.age} años` : "Edad N/D"} • {horse.sex}
            </p>
          </div>

          {/* Footer stable location info */}
          <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span className="truncate font-medium">{location}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary shrink-0 ml-2 group-hover:opacity-90 transition-opacity">
              <span className="text-[11px]">Ver perfil</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
