import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useHorses } from "@/lib/hooks/useHorses";
import { ArrowUpRight, Loader2, Flame } from "lucide-react";
import { ReputationBadges } from "@/components/ReputationBadges";

export const Route = createFileRoute("/marketplace/stallions")({
  component: StallionsMarketplace,
});

function StallionsMarketplace() {
  const { data: horses = [], isLoading } = useHorses();
  const stallions = horses.filter((h) => h.sex === "Stallion" && h.sale_status === "At Stud");

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-[10px] tracking-widest uppercase mb-4 flex items-center gap-2 w-max">
            <Flame className="h-3 w-3" /> Breeding
          </div>
          <h1 className="font-display text-5xl md:text-6xl">Elite Stallions</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            World-class sires offering proven genetics and exceptional progeny records.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stallions.map((horse) => (
              <Link
                key={horse.id}
                to="/showcase/$horseId"
                params={{ horseId: horse.id }}
                className="group rounded-[2rem] overflow-hidden lux-card border border-border hover:border-[var(--gold)]/50 transition-colors flex flex-col"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img
                    src={
                      horse.image_url ||
                      "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"
                    }
                    alt={horse.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="font-display text-3xl mb-1 text-white">{horse.name}</h2>
                    <p className="text-white/80 text-sm mb-4">
                      {horse.age}y · {horse.breed}
                    </p>
                    <ReputationBadges badges={horse.badges || []} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                        Stud Fee
                      </div>
                      <div className="font-display text-xl">{horse.price || "Private Treaty"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                        Standing at
                      </div>
                      <div className="text-sm">
                        {(horse.location || "USA").split("·")[0]?.trim() || "USA"}
                      </div>
                    </div>
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
