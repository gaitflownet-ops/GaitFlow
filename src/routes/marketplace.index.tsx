import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { forecastMarketPrice } from "@/lib/holtWinters";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Brain, TrendingUp, Dna, ShoppingBag, Plus, ArrowUpRight, Loader2, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useHorses } from "@/lib/hooks/useHorses";
import { useListings, useCreateListing, useFavorites, useToggleFavorite } from "@/lib/hooks/useMarketplace";
import { useState } from "react";
import { Modal } from "@/components/modals/Modal";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [{ title: "Mercado — GaitFlow" }],
  }),
  component: MarketplacePage,
});

// Historical sales prices (last 15 months, KWPN sample)
const historicalPrices = [
  45000, 47000, 52000, 55000, 48000, 42000, 40000, 39000, 41000, 46000, 49000, 51000, 46000, 48000,
  53000,
];
const MONTH_LABELS = [
  "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function MarketplacePage() {
  const { data: horses = [] } = useHorses();
  const { data: listings = [], isLoading } = useListings("horse");
  const createListing = useCreateListing();
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { state } = useApp();
  const userId = state.user?.id || "";

  // Modal State
  const [listOpen, setListOpen] = useState(false);
  const [listType, setListType] = useState("horse");
  const [listTitle, setListTitle] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [selectedHorseId, setSelectedHorseId] = useState("");

  const forecast = forecastMarketPrice(historicalPrices, 3);
  const chartData = historicalPrices
    .map((v, i) => ({ month: MONTH_LABELS[i], actual: v }))
    .concat(forecast.map((v, i) => ({ month: `F+${i + 1}`, forecast: Math.round(v) })) as any);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.user) return;

    await createListing.mutateAsync({
      seller_id: state.user.id,
      type: listType,
      title: listTitle,
      price: Number(listPrice) || 0,
      description: listDescription || null,
      horse_id: listType === "horse" && selectedHorseId ? selectedHorseId : null,
      status: "Active",
    });

    setListTitle("");
    setListPrice("");
    setListDescription("");
    setSelectedHorseId("");
    setListOpen(false);
  };

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Plataforma</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Mercado</h1>
          <p className="text-muted-foreground mt-2">
            {listings.length} ejemplares listados · Inteligencia de precios HW activa
          </p>
        </div>
        <button
          onClick={() => setListOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Publicar
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-3 mb-8 border-b border-border pb-4">
        {[
          { to: "/marketplace/", label: "Ejemplares", Icon: ShoppingBag },
          { to: "/marketplace/genetics", label: "Genética", Icon: Dna },
          { to: "/marketplace/stallions", label: "Reproductores", Icon: TrendingUp },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to as any}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* HW Price Forecast */}
      <div className="lux-card p-6 mb-8">
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
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              fill="url(#mktGrad)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--primary))"
              fill="none"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* For Sale Listings */}
      <h2 className="font-display text-2xl mb-6">Ejemplares en Venta</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-secondary rounded-[2rem]" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="lux-card p-12 text-center text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="font-display text-2xl">No hay publicaciones activas</h3>
          <p className="mt-2">
            Añade ejemplares al mercado haciendo clic en "Publicar" arriba.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => {
            const h = l.horses;
            const title = l.title || h?.name || "Ejemplar CCC Premium";
            const imageUrl = h?.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80";
            const priceText = l.price ? `$${Number(l.price).toLocaleString()}` : "Precio a Consultar";
            const isFavorite = favorites.some((f) => f.listing_id === l.id);

            return (
              <div
                key={l.id}
                className="group lux-card overflow-hidden hover:border-primary/40 transition-colors block relative"
              >
                {/* Favorite Button */}
                <button
                  onClick={() => {
                    if (userId) {
                      toggleFavorite.mutate({ userId, listingId: l.id, isFav: isFavorite });
                    }
                  }}
                  className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-background/80 backdrop-blur-md border border-border/30 hover:bg-background transition-colors"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </button>

                <Link
                  to="/showcase/$horseId"
                  params={{ horseId: h?.id || l.id }}
                  className="block"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-medium px-2.5 py-1 rounded-full border border-border/30">
                      {priceText}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {h?.discipline || "Caballo de Paso"}
                    </div>
                    <h3 className="font-display text-2xl mt-1 truncate">{title}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">
                        {h ? `${h.breed} · ${h.age}yo` : l.type.toUpperCase()}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* List Asset Modal */}
      <Modal open={listOpen} onClose={() => setListOpen(false)} title="Publicar en el Mercado">
        <form onSubmit={handleCreateListing} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Tipo de Publicación</label>
            <select
              className="lux-select"
              value={listType}
              onChange={(e) => setListType(e.target.value)}
            >
              <option value="horse">Ejemplar</option>
              <option value="embryo">Embrión</option>
              <option value="semen">Semen</option>
              <option value="breeding service">Salto / Servicio de Reproducción</option>
            </select>
          </div>

          <div>
            <label className="eyebrow block mb-1">Título de la Publicación</label>
            <input
              required
              className="lux-input"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              placeholder="ej. Embrión de Élite"
            />
          </div>

          {listType === "horse" && (
            <div>
              <label className="eyebrow block mb-1">Seleccionar Ejemplar</label>
              <select
                className="lux-select"
                value={selectedHorseId}
                onChange={(e) => setSelectedHorseId(e.target.value)}
              >
                <option value="">Elige un ejemplar...</option>
                {horses.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="eyebrow block mb-1">Precio de Venta ($)</label>
            <input
              type="number"
              className="lux-input"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              placeholder="50000"
            />
          </div>

          <div>
            <label className="eyebrow block mb-1">Descripción</label>
            <textarea
              className="lux-input"
              rows={4}
              value={listDescription}
              onChange={(e) => setListDescription(e.target.value)}
              placeholder="Describe raza, características o detalles del salto..."
            />
          </div>

          <button
            type="submit"
            disabled={createListing.isPending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity"
          >
            {createListing.isPending ? "Creando Publicación..." : "Publicar"}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}

// Inline useApp helper since it's used directly
import { useApp } from "@/lib/store";
