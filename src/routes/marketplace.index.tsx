import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { ArrowRight, MapPin, Loader2 } from "lucide-react";
import { useFarms } from "@/lib/hooks/useFarms";

export const Route = createFileRoute("/marketplace/")({
  component: MarketplaceDirectory,
});

function MarketplaceDirectory() {
  const { data: farms = [], isLoading } = useFarms();

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)] text-[10px] tracking-widest uppercase mb-4">
            Ecosystem
          </div>
          <h1 className="font-display text-5xl md:text-6xl">Global Directory</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Explore the world's most prestigious equine facilities, sales rings, and breeding
            operations.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {farms.map((farm) => (
              <Link
                key={farm.id}
                to="/farms/$farmId"
                params={{ farmId: farm.id }}
                className="group rounded-3xl overflow-hidden bg-secondary border border-border/50 hover:border-primary/50 transition-colors block"
              >
                <div className="aspect-[21/9] relative overflow-hidden">
                  <img
                    src={
                      farm.cover_image_url ||
                      "https://images.unsplash.com/photo-1500217032126-787114c000d6?auto=format&fit=crop&q=80"
                    }
                    alt={farm.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                        <MapPin className="h-4 w-4" /> {farm.location}
                      </div>
                      <h2 className="font-display text-3xl">{farm.name}</h2>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-white text-black font-display text-xl flex items-center justify-center shrink-0">
                      {farm.logo_initials}
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-muted-foreground line-clamp-2">{farm.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {(farm.specialties || []).map((spec: string) => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-background rounded-full text-xs uppercase tracking-widest text-muted-foreground border border-border"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-between text-[11px] uppercase tracking-widest text-primary font-medium">
                    <span>View Facility Profile</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
