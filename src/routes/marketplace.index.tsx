import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { forecastMarketPrice } from "@/lib/holtWinters";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Brain, TrendingUp, Dna, ShoppingBag, Plus, Loader2, Store,
} from "lucide-react";
import {
  useListings,
  useFavorites,
  useToggleFavorite,
  type MarketplaceFilters as IFilters,
} from "@/lib/hooks/useMarketplace";
import { useState, useMemo } from "react";
import { Modal } from "@/components/modals/Modal";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { PublishListingWizard } from "@/components/marketplace/PublishListingWizard";
import { SellerDashboard } from "@/components/marketplace/SellerDashboard";
import { BuyerInquiryForm } from "@/components/marketplace/BuyerInquiryForm";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [{ title: "Mercado — GaitFlow" }],
  }),
  component: MarketplacePage,
});

// Holt-Winters forecast using real listing price data as base
const FALLBACK_PRICES = [45000, 47000, 52000, 55000, 48000, 42000, 40000, 39000, 41000, 46000, 49000, 51000, 46000, 48000, 53000];
const MONTH_LABELS = ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type MainTab = "catalog" | "seller";

function MarketplacePage() {
  const { state } = useApp();
  const userId = state.user?.id || "";

  const { data: rawListings = [], isLoading } = useListings();
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const [mainTab, setMainTab] = useState<MainTab>("catalog");
  const [publishOpen, setPublishOpen] = useState(false);
  const [inquiryTarget, setInquiryTarget] = useState<{ id: string; title: string } | null>(null);
  const [filters, setFilters] = useState<IFilters>({});

  // Build HW chart from real listing prices if available, else fallback
  const chartData = useMemo(() => {
    const prices = rawListings.length >= 5
      ? rawListings.slice(0, 15).map((l) => Number(l.price) || 0).filter((p) => p > 0)
      : FALLBACK_PRICES;

    const historicalPrices = prices.length >= 5 ? prices : FALLBACK_PRICES;
    const labels = MONTH_LABELS.slice(0, historicalPrices.length);
    const forecast = forecastMarketPrice(historicalPrices, 3);

    return [
      ...historicalPrices.map((v, i) => ({ month: labels[i] || `M${i + 1}`, actual: v })),
      ...forecast.map((v, i) => ({ month: `F+${i + 1}`, forecast: Math.round(v) })),
    ];
  }, [rawListings]);

  // Apply filters client-side on top of already-fetched listings
  const filteredListings = useMemo(() => {
    let results = rawListings.filter((l) => {
      const status = (l as any).listing_status || l.status;
      return status === "Active" || status === "active";
    });

    const f = filters;
    if (f.type && f.type !== "all") results = results.filter((l) => l.type?.toLowerCase() === f.type);
    if (f.search) {
      const s = f.search.toLowerCase();
      results = results.filter((l) =>
        l.title?.toLowerCase().includes(s) ||
        (l as any).horses?.name?.toLowerCase().includes(s) ||
        (l as any).horses?.breed?.toLowerCase().includes(s) ||
        l.description?.toLowerCase().includes(s)
      );
    }
    if (f.minPrice) results = results.filter((l) => Number(l.price) >= f.minPrice!);
    if (f.maxPrice) results = results.filter((l) => Number(l.price) <= f.maxPrice!);
    if (f.breed) results = results.filter((l) => (l as any).horses?.breed?.toLowerCase().includes(f.breed!.toLowerCase()));
    if (f.sex) results = results.filter((l) => (l as any).horses?.sex?.toLowerCase() === f.sex!.toLowerCase());
    if (f.minAge) results = results.filter((l) => ((l as any).horses?.age ?? 0) >= f.minAge!);
    if (f.maxAge) results = results.filter((l) => ((l as any).horses?.age ?? 99) <= f.maxAge!);
    if (f.discipline) results = results.filter((l) => {
      const d = ((l as any).discipline || (l as any).horses?.discipline || "").toLowerCase();
      return d.includes(f.discipline!.toLowerCase());
    });
    if (f.country) results = results.filter((l) => {
      const c = ((l as any).location_country || "").toLowerCase();
      return c.includes(f.country!.toLowerCase());
    });

    // Sort
    if (f.sortBy === "price_asc") results = [...results].sort((a, b) => Number(a.price) - Number(b.price));
    else if (f.sortBy === "price_desc") results = [...results].sort((a, b) => Number(b.price) - Number(a.price));
    else if (f.sortBy === "most_viewed") results = [...results].sort((a, b) => ((b as any).views_count || 0) - ((a as any).views_count || 0));

    return results;
  }, [rawListings, filters]);

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="flex items-baseline justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="eyebrow">Plataforma</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Mercado GaitFlow</h1>
          <p className="text-muted-foreground mt-2">
            {rawListings.filter((l) => {
              const s = (l as any).listing_status || l.status;
              return s === "Active" || s === "active";
            }).length} publicaciones activas · Inteligencia de precios HW activa
          </p>
        </div>
        <button
          onClick={() => setPublishOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Publicar
        </button>
      </div>

      {/* ── Public Sub-nav ── */}
      <div className="flex gap-3 mb-6 border-b border-border pb-4 overflow-x-auto">
        {[
          { to: "/marketplace/", label: "Catálogo", Icon: ShoppingBag },
          { to: "/marketplace/genetics", label: "Genética", Icon: Dna },
          { to: "/marketplace/stallions", label: "Reproductores", Icon: TrendingUp },
          { to: "/marketplace/sales", label: "Vitrina Pública", Icon: Store },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to as any}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary shrink-0"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* ── Main Tab: Catalog / Seller Panel ── */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setMainTab("catalog")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            mainTab === "catalog" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Catálogo Completo
        </button>
        <button
          onClick={() => setMainTab("seller")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            mainTab === "seller" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Mi Panel de Vendedor
        </button>
      </div>

      {/* ── Seller Dashboard Panel ── */}
      {mainTab === "seller" && <SellerDashboard />}

      {/* ── Catalog Panel ── */}
      {mainTab === "catalog" && (
        <div className="space-y-6">
          {/* HW Price Forecast */}
          <div className="lux-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="font-display text-xl">Tendencia y Pronóstico de Precio HW</h3>
              </div>
              <div className="text-xs text-muted-foreground hidden md:flex gap-4">
                <span>
                  <span className="inline-block w-6 h-0.5 bg-primary rounded align-middle mr-1" />
                  Real
                </span>
                <span>
                  <span className="inline-block w-6 h-0.5 bg-primary/40 border-dashed border-t border-primary/40 align-middle mr-1" />
                  Pronóstico
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v?.toLocaleString()}`} />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="url(#mktGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" fill="none" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Advanced Filters */}
          <MarketplaceFilters
            filters={filters}
            onChange={setFilters}
            totalResults={filteredListings.length}
          />

          {/* Listings Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-80 bg-secondary rounded-[2rem]" />)}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="lux-card p-12 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <h3 className="font-display text-2xl">
                {Object.keys(filters).some((k) => (filters as any)[k]) ? "Sin resultados para esa búsqueda" : "No hay publicaciones activas"}
              </h3>
              <p className="mt-2 text-sm">
                {Object.keys(filters).some((k) => (filters as any)[k])
                  ? "Prueba ajustando los filtros."
                  : 'Añade ejemplares al mercado haciendo clic en "Publicar" arriba.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const isFavorite = favorites.some((f: any) => f.listing_id === listing.id);
                return (
                  <ListingCard
                    key={listing.id}
                    listing={listing as any}
                    isFavorite={isFavorite}
                    onToggleFavorite={() => {
                      if (userId) toggleFavorite.mutate({ userId, listingId: listing.id, isFav: isFavorite });
                    }}
                    onInquire={() => setInquiryTarget({ id: listing.id, title: listing.title || (listing as any).horses?.name || "Ejemplar" })}
                    onViewDetail={() => {
                      // Future: navigate to listing detail page
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Publish Wizard Modal ── */}
      <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title="">
        <PublishListingWizard onClose={() => setPublishOpen(false)} onSuccess={() => setPublishOpen(false)} />
      </Modal>

      {/* ── Buyer Inquiry Modal ── */}
      {inquiryTarget && (
        <Modal open={!!inquiryTarget} onClose={() => setInquiryTarget(null)} title="">
          <BuyerInquiryForm
            listingId={inquiryTarget.id}
            listingTitle={inquiryTarget.title}
            onClose={() => setInquiryTarget(null)}
          />
        </Modal>
      )}
    </AppShell>
  );
}
