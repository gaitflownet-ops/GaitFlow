import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronDown, Filter, Heart, MapPin, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Modal } from "@/components/modals/Modal";
import { PublishListingWizard } from "@/components/marketplace/PublishListingWizard";
import { type EnterpriseListing, useFavorites, usePublicListings, useToggleFavorite } from "@/lib/hooks/useMarketplace";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({ meta: [{ title: "Remates | GaitFlow" }] }),
  component: MarketplaceHome,
});

const CATEGORIES = [
  { id: "all", label: "Todo el catálogo" }, { id: "horse", label: "Ejemplares" },
  { id: "stallion", label: "Reproductores" }, { id: "mare", label: "Yeguas" },
  { id: "foal_male", label: "Potros" }, { id: "foal_female", label: "Potrancas" },
  { id: "breeding_service", label: "Saltos" }, { id: "embryo", label: "Embriones" },
  { id: "semen", label: "Semen" }, { id: "oocyte", label: "Ovocitos" },
  { id: "product", label: "Productos ecuestres" },
];

const GAITS = [
  { id: "P1", label: "P1 · Trote y galope" }, { id: "P2", label: "P2 · Trocha y galope" },
  { id: "P3", label: "P3 · Trocha pura" }, { id: "P4", label: "P4 · Paso fino colombiano" },
];

const formatPrice = (price: number | null | undefined, currency = "COP") =>
  !price ? "Precio a consultar" : new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(price));

const matchesCategory = (listing: EnterpriseListing, category: string) => {
  if (category === "all") return true;
  const type = listing.type?.toLowerCase();
  const subtype = listing.sub_type?.toLowerCase();
  const sex = listing.horses?.sex?.toLowerCase();
  if (category === "stallion") return type === "stallion" || subtype === "stallion" || subtype === "semental" || sex === "macho";
  if (category === "mare") return type === "mare" || subtype === "mare" || sex === "hembra";
  if (category === "breeding_service") return type === "breeding service" || type === "breeding_service";
  if (category === "embryo") return ["embryo", "semen", "oocyte"].includes(type || "");
  return type === category;
};

function ListingCard({ listing, favorite, onFavorite }: { listing: EnterpriseListing; favorite: boolean; onFavorite: () => void }) {
  const navigate = useNavigate();
  const horse = listing.horses;
  const title = listing.title || horse?.name || "Ejemplar GaitFlow";
  const image = listing.images?.[0] || horse?.image_url || "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=85&w=1200";
  const location = [listing.location_city, listing.location_country].filter(Boolean).join(", ") || horse?.location || "Ubicación por confirmar";
  const tags = [horse?.breed, horse?.age ? `${horse.age} años` : null, horse?.sex].filter(Boolean);

  return <article className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl" onClick={() => navigate({ to: "/marketplace/listing/$listingId", params: { listingId: listing.id } })}>
    <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
      <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute left-3 top-3 flex items-center gap-2">
        {listing.is_promoted && <span className="rounded-full bg-[var(--gold)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black">Destacado</span>}
        {listing.discount_percentage ? <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">-{listing.discount_percentage}%</span> : null}
      </div>
      <button type="button" aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} onClick={(event) => { event.stopPropagation(); onFavorite(); }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm backdrop-blur transition hover:scale-105"><Heart className={`h-4 w-4 ${favorite ? "fill-red-500 text-red-500" : ""}`} /></button>
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur"><BadgeCheck className="h-3.5 w-3.5 text-[var(--gold)]" /> Ficha publicada</div>
    </div>
    <div className="p-5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{listing.type || "Ejemplar"}</p>
      <h2 className="truncate font-display text-2xl text-foreground">{title}</h2>
      <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">{tags.map((tag) => <span key={tag} className="rounded-md bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{tag}</span>)}</div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Valor publicado</p>{listing.original_price && <p className="text-xs text-muted-foreground line-through">{formatPrice(listing.original_price, listing.currency)}</p>}<p className="font-display text-xl text-foreground">{formatPrice(listing.price, listing.currency)}</p></div><ArrowRight className="mb-1 h-5 w-5 text-primary transition-transform group-hover:translate-x-1" /></div>
      <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{location}</p>
    </div>
  </article>;
}

function MarketplaceHome() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { data: listings = [], isLoading } = usePublicListings();
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [breed, setBreed] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [gaits, setGaits] = useState<string[]>([]);
  const activeListings = useMemo(() => listings.filter((item) => (item.listing_status || item.status || "Active").toLowerCase() === "active"), [listings]);
  const filteredListings = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = activeListings.filter((listing) => {
      const text = [listing.title, listing.description, listing.horses?.name, listing.horses?.breed, listing.location_city, listing.location_country].filter(Boolean).join(" ").toLowerCase();
      const listingGait = String((listing.horses as any)?.gait_type || "");
      return (!term || text.includes(term)) && matchesCategory(listing, category) && (!breed || listing.horses?.breed?.toLowerCase().includes(breed.toLowerCase())) && (!maxPrice || !listing.price || Number(listing.price) <= Number(maxPrice)) && (!gaits.length || gaits.some((gait) => listingGait.includes(gait)));
    });
    return result.sort((a, b) => sort === "price-low" ? Number(a.price || 0) - Number(b.price || 0) : sort === "price-high" ? Number(b.price || 0) - Number(a.price || 0) : sort === "featured" ? Number(Boolean(b.is_promoted)) - Number(Boolean(a.is_promoted)) : new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [activeListings, breed, category, gaits, maxPrice, search, sort]);
  const favoriteIds = new Set(favorites.map((favorite) => favorite.listing_id));
  const hasFilters = Boolean(search || category !== "all" || breed || maxPrice || gaits.length);
  const featured = filteredListings.filter((listing) => listing.is_promoted).slice(0, 3);
  const clearFilters = () => { setSearch(""); setCategory("all"); setBreed(""); setMaxPrice(""); setGaits([]); };
  const handleFavorite = (listingId: string) => {
    if (!state.user) { navigate({ to: "/login" }); return; }
    toggleFavorite.mutate({ userId: state.user.id, listingId, isFav: favoriteIds.has(listingId) });
  };

  return <AppShell><div className="mx-auto max-w-7xl space-y-8">
    <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(125deg,oklch(0.19_0.025_55),oklch(0.27_0.04_60))] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--gold)]/15 blur-3xl" /><div className="relative max-w-2xl"><p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] text-[var(--gold)]"><Sparkles className="h-3.5 w-3.5" /> REMATES GAITFLOW</p><h1 className="font-display text-4xl leading-tight sm:text-5xl">Encuentra el siguiente gran capítulo de tu criadero.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Explora ejemplares, reproductores y genética con información clara para tomar decisiones de compra con criterio.</p><div className="mt-7 flex flex-wrap gap-3 text-xs text-white/80"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[var(--gold)]" /> Publicaciones activas</span><span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[var(--gold)]" /> Fichas para comparar</span></div></div></section>
    <section className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4"><div className="flex flex-col gap-3 lg:flex-row"><label className="flex flex-1 items-center gap-3 rounded-xl bg-secondary px-4 py-3" aria-label="Buscar en remates"><Search className="h-5 w-5 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Busca por ejemplar, raza, disciplina o ubicación" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda"><X className="h-4 w-4 text-muted-foreground" /></button>}</label><button type="button" onClick={() => setShowFilters((open) => !open)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${showFilters || hasFilters ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}><SlidersHorizontal className="h-4 w-4" /> Filtros</button><button type="button" onClick={() => setShowPublish(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"><Plus className="h-4 w-4" /> Publicar</button></div>{showFilters && <div className="mt-3 space-y-4 border-t border-border pt-4"><div className="grid gap-3 sm:grid-cols-3"><input value={breed} onChange={(event) => setBreed(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Filtrar por raza" /><input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min="0" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Precio máximo (COP)" /><button type="button" onClick={clearFilters} className="rounded-xl border border-border px-3 py-2.5 text-sm font-medium hover:bg-secondary">Limpiar filtros</button></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Andadura CCC</p><div className="flex flex-wrap gap-2">{GAITS.map((gait) => <button key={gait.id} type="button" onClick={() => setGaits((current) => current.includes(gait.id) ? current.filter((value) => value !== gait.id) : [...current, gait.id])} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${gaits.includes(gait.id) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>{gait.label}</button>)}</div></div></div>}</section>
    <div className="flex gap-2 overflow-x-auto pb-1">{CATEGORIES.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${category === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>{item.label}</button>)}</div>
    {featured.length > 0 && !hasFilters && <section><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">Selección curada</p><h2 className="font-display text-3xl">Destacados de la semana</h2></div><span className="hidden text-sm text-muted-foreground sm:block">Publicaciones con mayor visibilidad</span></div><div className="grid gap-5 md:grid-cols-3">{featured.map((listing) => <ListingCard key={listing.id} listing={listing} favorite={favoriteIds.has(listing.id)} onFavorite={() => handleFavorite(listing.id)} />)}</div></section>}
    <section><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-3xl">Catálogo de remates</h2><p className="mt-1 text-sm text-muted-foreground">{filteredListings.length} {filteredListings.length === 1 ? "publicación disponible" : "publicaciones disponibles"}</p></div><label className="inline-flex items-center gap-2 text-sm text-muted-foreground">Ordenar <ChevronDown className="-mr-8 h-4 w-4 pointer-events-none" /><select value={sort} onChange={(event) => setSort(event.target.value)} className="appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-9 text-sm text-foreground outline-none"><option value="recent">Más recientes</option><option value="featured">Destacados</option><option value="price-low">Menor precio</option><option value="price-high">Mayor precio</option></select></label></div>{isLoading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[380px] animate-pulse rounded-2xl bg-secondary" />)}</div> : filteredListings.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} favorite={favoriteIds.has(listing.id)} onFavorite={() => handleFavorite(listing.id)} />)}</div> : <div className="rounded-2xl border border-dashed border-border py-20 text-center"><Filter className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-4 font-display text-2xl">No encontramos coincidencias</h3><p className="mt-2 text-sm text-muted-foreground">Prueba con otra búsqueda o ajusta los filtros.</p><button type="button" onClick={clearFilters} className="mt-5 text-sm font-semibold text-primary hover:underline">Ver todo el catálogo</button></div>}</section>
  </div><Modal open={showPublish} onClose={() => setShowPublish(false)} title="Publicar en Remates"><PublishListingWizard onClose={() => setShowPublish(false)} onSuccess={() => setShowPublish(false)} /></Modal></AppShell>;
}
