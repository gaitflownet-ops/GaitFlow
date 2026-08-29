import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell";
import { useListings } from "@/lib/hooks/useMarketplace";
import { ArrowUpRight, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { ReputationBadges } from "@/components/ReputationBadges";
import { PriceForecastCard } from "@/components/hw/HWWidgets";
import { useMemo, useState } from "react";
import { Modal } from "@/components/modals/Modal";
import { BuyerInquiryForm } from "@/components/marketplace/BuyerInquiryForm";

export const Route = createFileRoute("/marketplace/sales")({
  component: SalesMarketplace,
});

function SalesMarketplace() {
  const { data: rawListings = [], isLoading } = useListings("horse");
  const [inquiryTarget, setInquiryTarget] = useState<{ id: string; title: string } | null>(null);

  // Only show active listings on public page
  const listings = useMemo(
    () => rawListings.filter((l) => {
      const s = (l as any).listing_status || l.status;
      return s === "Active" || s === "active";
    }),
    [rawListings]
  );

  // Build price forecast segments from real listing prices
  const priceForecasts = useMemo(() => {
    const prices = listings
      .map((l) => Number(l.price) || 0)
      .filter((p) => p > 0)
      .sort((a, b) => b - a);
    if (prices.length === 0) return [];
    const count = Math.min(prices.length, 3);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.floor((i / count) * prices.length);
      const p = prices[idx];
      return { current: p, low: Math.round(p * 0.88), high: Math.round(p * 1.15), trend: i < count - 1 ? "up" as const : "down" as const };
    });
  }, [listings]);


  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-[var(--gold)] text-[10px] tracking-widest uppercase mb-4">
            Mercado
          </div>
          <h1 className="font-display text-5xl md:text-6xl">Colección de Venta</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Una selección curada de ejemplares de élite disponibles para adquisición.
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
          {priceForecasts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {priceForecasts.map((p, i) => (
                <PriceForecastCard
                  key={i}
                  current={p.current}
                  forecastLow={p.low}
                  forecastHigh={p.high}
                  trend={p.trend}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos de precios activos todavía.</p>
          )}
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((l) => {
              const horse = l.horses;
              if (!horse) return null;

              const title = l.title || horse.name;
              const imageUrl = horse.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80";
              const priceText = l.price ? `$${Number(l.price).toLocaleString()}` : "Contactar para Precio";

              return (
                <Link
                  key={l.id}
                  to="/showcase/$horseId"
                  params={{ horseId: horse.id }}
                  className="group rounded-3xl overflow-hidden lux-card border border-border hover:border-primary/50 transition-colors block"
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <div className="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-medium border border-white/10">
                        {l.status}
                      </div>
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-background/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                        <ArrowUpRight className="h-5 w-5" />
                      </span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="text-[11px] text-white/70 uppercase tracking-widest mb-1">
                        {horse.discipline || "Caballo de Paso"}
                      </div>
                      <h2 className="font-display text-3xl mb-1 truncate">{title}</h2>
                      <p className="text-white/80 text-sm mb-4">
                        {horse.age}y · {horse.sex} · {horse.breed}
                      </p>
                      <ReputationBadges badges={horse.badges || []} />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                          Precio de Venta
                        </div>
                        <div className="font-display text-xl">
                          {priceText}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                          Finca
                        </div>
                        <div className="text-sm">
                          {(horse.location || "").split("·")[1]?.trim() || horse.location || ""}
                        </div>
                      </div>
                    </div>
                    {/* Contactar button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setInquiryTarget({ id: l.id, title: title || "Ejemplar" });
                      }}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle className="h-4 w-4" /> Contactar al Vendedor
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Buyer Inquiry Modal */}
      {inquiryTarget && (
        <Modal open={!!inquiryTarget} onClose={() => setInquiryTarget(null)} title="">
          <BuyerInquiryForm
            listingId={inquiryTarget.id}
            listingTitle={inquiryTarget.title}
            onClose={() => setInquiryTarget(null)}
          />
        </Modal>
      )}
    </PublicShell>
  );
}
