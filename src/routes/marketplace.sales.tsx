import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useHorses } from "@/lib/hooks/useHorses";
import { ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { ReputationBadges } from "@/components/ReputationBadges";
import { PriceForecastCard } from "@/components/hw/HWWidgets";

export const Route = createFileRoute("/marketplace/sales")({
  component: SalesMarketplace,
});

function SalesMarketplace() {
  const { data: horses = [], isLoading } = useHorses();
  const saleHorses = horses.filter(
    (h) => h.sale_status === "For Sale" || h.sale_status === "Private Treaty",
  );

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)] text-[10px] tracking-widest uppercase mb-4">
            Marketplace
          </div>
          <h1 className="font-display text-5xl md:text-6xl">Sales Collection</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            A curated selection of elite sport horses available for acquisition.
          </p>
        </div>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            <h2 className="font-display text-2xl">Predictive price intelligence</h2>
            <span className="text-[11px] text-muted-foreground">
              · Holt-Winters · 90-day forecast
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <PriceForecastCard
              current={185000}
              forecastLow={170000}
              forecastHigh={210000}
              trend="up"
            />
            <PriceForecastCard
              current={92000}
              forecastLow={95000}
              forecastHigh={120000}
              trend="up"
            />
            <PriceForecastCard
              current={245000}
              forecastLow={200000}
              forecastHigh={235000}
              trend="down"
            />
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {saleHorses.map((horse) => (
              <Link
                key={horse.id}
                to="/showcase/$horseId"
                params={{ horseId: horse.id }}
                className="group rounded-3xl overflow-hidden lux-card border border-border hover:border-primary/50 transition-colors block"
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

                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-medium border border-white/10">
                      {horse.sale_status}
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-background/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="text-[11px] text-white/70 uppercase tracking-widest mb-1">
                      {horse.discipline}
                    </div>
                    <h2 className="font-display text-3xl mb-1">{horse.name}</h2>
                    <p className="text-white/80 text-sm mb-4">
                      {horse.age}y · {horse.sex} · {horse.color}
                    </p>
                    <ReputationBadges badges={horse.badges || []} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                        Asking Price
                      </div>
                      <div className="font-display text-xl">
                        {horse.price || "Contact for Price"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                        Location
                      </div>
                      <div className="text-sm">
                        {(horse.location || "USA").split("·")[1]?.trim() || horse.location || "USA"}
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
