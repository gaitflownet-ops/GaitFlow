import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { usePublicListings, useListings, useFavorites, useToggleFavorite, useApp, type EnterpriseListing } from "@/lib/hooks/useMarketplace";
import { useState, useMemo } from "react";
import { Search, Heart, MapPin, Filter, X, Star, Zap, Dna, ChevronDown, ChevronUp, Plus, SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { PublishListingWizard } from "@/components/marketplace/PublishListingWizard";

export const Route = createFileRoute("/marketplace/")({  
  head: () => ({
    meta: [{ title: "Marketplace — GaitFlow" }],
  }),
  component: MarketplaceHome,
});

// ── Listing Card ────────────────────────────────────────────────────────────
function ListingGridCard({
  listing,
  isFavorite,
  onToggleFavorite,
  isLoggedIn,
}: {
  listing: EnterpriseListing;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isLoggedIn?: boolean;
}) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const h = listing.horses as any;
  const title = listing.title || h?.name || "Ejemplar Premium";
  
  const formatCOP = (p: number | null | undefined) =>
    p ? `COP ${Number(p).toLocaleString("es-CO")}` : "Consultar precio";

  const price = formatCOP(listing.price);
  const originalPrice = listing.original_price ? formatCOP(listing.original_price) : null;

  const fallbackImg = "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80&w=800";
  let imageUrl = fallbackImg;
  if (!imgError) {
    if (listing.images && listing.images.length > 0) imageUrl = listing.images[0];
    else if (h?.image_url) imageUrl = h.image_url;
  }

  let ageDisplay = "";
  if (h?.birth_date) {
    const bDate = new Date(h.birth_date);
    const months = Math.floor((Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    ageDisplay = months < 24 ? `${months}m` : `${Math.floor(months / 12)}a`;
  } else if (h?.age) {
    ageDisplay = `${h.age}a`;
  }

  const isSold = listing.listing_status === "Sold" || listing.status === "Sold";

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert("Inicia sesión para guardar en favoritos");
      return;
    }
    onToggleFavorite?.();
  };

  return (
    <div className="flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={imageUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badges */}
        {listing.discount_percentage && !isSold && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            -{listing.discount_percentage}%
          </div>
        )}
        {isSold ? (
          <div className="absolute top-2 right-2 bg-zinc-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">VENDIDO</div>
        ) : listing.is_promoted ? (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" /> Destacado
          </div>
        ) : null}
        {/* Fav button */}
        <button
          onClick={handleFav}
          className="absolute bottom-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
      </div>
      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-base line-clamp-1 text-foreground">{title}</h3>
        {/* Chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {h?.breed && <span className="bg-secondary text-[10px] font-medium px-2 py-0.5 rounded text-muted-foreground">{h.breed}</span>}
          {ageDisplay && <span className="bg-secondary text-[10px] font-medium px-2 py-0.5 rounded text-muted-foreground">{ageDisplay}</span>}
          {h?.sex && <span className="bg-secondary text-[10px] font-medium px-2 py-0.5 rounded text-muted-foreground">{h.sex}</span>}
          {(h as any)?.gait_type && <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">{(h as any).gait_type}</span>}
        </div>
        {/* Price */}
        <div className="mt-3">
          {originalPrice && !isSold && <div className="text-xs text-muted-foreground line-through">{originalPrice}</div>}
          <div className="text-xl font-bold text-foreground">{isSold ? "VENDIDO" : price}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {listing.location_city ? `${listing.location_city}, ` : ""}{listing.location_country || "Colombia"}
          </div>
        </div>
        {/* CTA */}
        <div className="mt-3">
          <div className="w-full bg-primary/10 text-primary text-sm font-semibold text-center py-2 rounded-lg hover:bg-primary/20 transition-colors">
            Ver ficha completa
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "Todos", emoji: "🏇" },
  { id: "horse", label: "Caballos", emoji: "🐎" },
  { id: "mare", label: "Yeguas", emoji: "🐴" },
  { id: "stallion", label: "Sementales", emoji: "👑" },
  { id: "foal_male", label: "Potros", emoji: "⚡" },
  { id: "foal_female", label: "Potrancas", emoji: "✨" },
  { id: "donkey", label: "Asnales", emoji: "🫏" },
  { id: "mule", label: "Mulares", emoji: "🦌" },
  { id: "embryo", label: "Embriones", emoji: "🧬" },
  { id: "semen", label: "Semen", emoji: "💉" },
  { id: "oocyte", label: "Ovocitos", emoji: "🔬" },
  { id: "breeding_service", label: "Saltos", emoji: "🤝" },
];

const AGE_RANGES = [
  { id: "", label: "Cualquier edad" },
  { id: "0-3", label: "0 a 3 meses" },
  { id: "3-6", label: "3 a 6 meses" },
  { id: "6-12", label: "6 a 12 meses" },
  { id: "12-24", label: "1 a 2 años" },
  { id: "24-60", label: "2 a 5 años" },
  { id: "60-120", label: "5 a 10 años" },
  { id: "120+", label: "Más de 10 años" },
];

const BREEDS = [
  "",
  "Criollo Colombiano",
  "Cuarto de Milla",
  "Paso Fino",
  "Trotón Galopero",
  "Pura Sangre Inglés",
  "Warmblood",
  "Árabe",
  "Appaloosa",
  "Otra",
];

const GAITS = [
  { id: "P1", label: "P1 — Paso Fino" },
  { id: "P2", label: "P2 — Trote y Galope" },
  { id: "P3", label: "P3 — Trocha" },
  { id: "P4", label: "P4 — Trocha y Galope" },
];

// ── FilterSection ─────────────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border pb-4 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function MarketplaceHome() {
  const { state } = useApp();
  const isLoggedIn = !!state.user;
  const navigate = useNavigate();

  // Use public listings (no auth required) — falls back to useListings if public query fails
  const { data: publicData = [], isLoading: publicLoading } = usePublicListings();
  const { data: privateData = [], isLoading: privateLoading } = useListings();
  
  // For logged-in users, merge private (all statuses) with public. For visitors, only public.
  const allListings = isLoggedIn ? privateData : publicData;
  const isLoading = isLoggedIn ? privateLoading : publicLoading;

  const { data: favorites = [] } = useFavorites();
  const toggleFav = useToggleFavorite();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ── State: unified filters ──
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState({
    breed: "",
    gaits: [] as string[],
    ageRange: "",
    minPrice: "",
    maxPrice: "",
    country: "",
    isNegotiable: false,
  });
  const [sortBy, setSortBy] = useState("recent");

  const activeListings = useMemo(() => {
    return allListings.filter(l => {
      const st = (l as any).listing_status || l.status;
      return !st || st === "Active" || st === "active";
    });
  }, [allListings]);

  const filteredListings = useMemo(() => {
    let res = [...activeListings];

    // Search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      res = res.filter(l =>
        l.title?.toLowerCase().includes(s) ||
        l.horses?.name?.toLowerCase().includes(s) ||
        l.horses?.breed?.toLowerCase().includes(s) ||
        l.description?.toLowerCase().includes(s)
      );
    }

    // Category chip — maps to listing.type or listing.sub_type
    if (activeCategory !== "all") {
      res = res.filter(l => {
        const t = l.type?.toLowerCase();
        const st = (l as any).sub_type?.toLowerCase();
        if (activeCategory === "horse") return t === "horse" && !st;
        if (activeCategory === "mare") return t === "horse" && (st === "mare" || l.horses?.sex === "Hembra");
        if (activeCategory === "stallion") return t === "horse" && (st === "stallion" || st === "semental");
        if (activeCategory === "foal_male") return t === "horse" && (st === "foal_male" || st === "potro");
        if (activeCategory === "foal_female") return t === "horse" && (st === "foal_female" || st === "potranca");
        if (activeCategory === "donkey") return t === "donkey" || st === "donkey" || st === "asnal";
        if (activeCategory === "mule") return t === "mule" || st === "mule" || st === "mular";
        if (activeCategory === "embryo") return t === "embryo";
        if (activeCategory === "semen") return t === "semen";
        if (activeCategory === "oocyte") return t === "oocyte" || st === "oocyte";
        if (activeCategory === "breeding_service") return t === "breeding service" || t === "breeding_service";
        return t === activeCategory || st === activeCategory;
      });
    }

    // Breed
    if (filters.breed) {
      res = res.filter(l => l.horses?.breed?.toLowerCase() === filters.breed.toLowerCase());
    }

    // Gaits
    if (filters.gaits.length > 0) {
      res = res.filter(l => {
        const gt = (l.horses as any)?.gait_type;
        return gt && filters.gaits.some(g => gt.includes(g));
      });
    }

    // Age range (months)
    if (filters.ageRange) {
      res = res.filter(l => {
        const h = l.horses as any;
        let months = 0;
        if (h?.birth_date) {
          months = Math.floor((Date.now() - new Date(h.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        } else if (h?.age) {
          months = h.age * 12;
        }
        const [minStr, maxStr] = filters.ageRange.split("-");
        const min = Number(minStr);
        if (filters.ageRange.endsWith("+")) return months >= min;
        const max = Number(maxStr);
        return months >= min && months <= max;
      });
    }

    // Price
    if (filters.minPrice) res = res.filter(l => Number(l.price) >= Number(filters.minPrice));
    if (filters.maxPrice) res = res.filter(l => Number(l.price) <= Number(filters.maxPrice));

    // Country
    if (filters.country) res = res.filter(l => l.location_country === filters.country);

    // Negotiable
    if (filters.isNegotiable) res = res.filter(l => (l as any).is_negotiable || l.negotiation_terms);

    // Sort
    if (sortBy === "price_asc") res.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price_desc") res.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "promoted") res.sort((a, b) => (b.is_promoted ? 1 : 0) - (a.is_promoted ? 1 : 0));

    return res;
  }, [activeListings, searchTerm, activeCategory, filters, sortBy]);

  const promotedListings = useMemo(() => filteredListings.filter(l => l.is_promoted), [filteredListings]);
  const geneticsListings = useMemo(() => activeListings.filter(l => l.type === "embryo" || l.type === "semen" || (l.type as any) === "oocyte"), [activeListings]);
  const discountListings = useMemo(() => activeListings.filter(l => (l.discount_percentage || 0) > 0), [activeListings]);

  const clearFilters = () => {
    setFilters({ breed: "", gaits: [], ageRange: "", minPrice: "", maxPrice: "", country: "", isNegotiable: false });
    setSearchTerm("");
    setActiveCategory("all");
    setSortBy("recent");
  };

  const toggleGait = (g: string) => setFilters(prev => ({
    ...prev,
    gaits: prev.gaits.includes(g) ? prev.gaits.filter(x => x !== g) : [...prev.gaits, g]
  }));

  const hasActiveFilters = searchTerm || activeCategory !== "all" || filters.breed || filters.gaits.length > 0 || filters.ageRange || filters.minPrice || filters.maxPrice || filters.country || filters.isNegotiable;

  const favIds = useMemo(() => new Set(favorites.map((f: any) => f.listing_id)), [favorites]);

  const SidebarFilters = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filtros</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      <FilterSection title="Raza">
        <select
          value={filters.breed}
          onChange={e => setFilters({ ...filters, breed: e.target.value })}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {BREEDS.map(b => <option key={b} value={b}>{b || "Todas las razas"}</option>)}
        </select>
      </FilterSection>

      <FilterSection title="Andar CCC">
        <div className="space-y-2">
          {GAITS.map(g => (
            <label key={g.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.gaits.includes(g.id)}
                onChange={() => toggleGait(g.id)}
                className="rounded border-border text-primary accent-primary"
              />
              {g.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Edad">
        <select
          value={filters.ageRange}
          onChange={e => setFilters({ ...filters, ageRange: e.target.value })}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {AGE_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </FilterSection>

      <FilterSection title="Precio (COP)">
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Precio mínimo"
            value={filters.minPrice}
            onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Precio máximo"
            value={filters.maxPrice}
            onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </FilterSection>

      <FilterSection title="Ubicación">
        <select
          value={filters.country}
          onChange={e => setFilters({ ...filters, country: e.target.value })}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Todos los países</option>
          <option value="Colombia">Colombia</option>
          <option value="México">México</option>
          <option value="Estados Unidos">Estados Unidos</option>
          <option value="Venezuela">Venezuela</option>
          <option value="Ecuador">Ecuador</option>
          <option value="Perú">Perú</option>
          <option value="España">España</option>
        </select>
      </FilterSection>

      <FilterSection title="Condiciones">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isNegotiable}
            onChange={e => setFilters({ ...filters, isNegotiable: e.target.checked })}
            className="rounded border-border accent-primary"
          />
          Solo negociables
        </label>
      </FilterSection>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 w-full space-y-6">

        {/* ── Top Bar: Search + Publish Button ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Buscar ejemplares, razas, ubicaciones..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="p-0.5 hover:bg-secondary rounded">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {/* Publish CTA — solo visible para usuarios logueados */}
          {isLoggedIn && (
            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Publicar ejemplar
            </button>
          )}
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-2 border border-border rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <Filter className="w-4 h-4" /> Filtros
            {hasActiveFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
          </button>
        </div>

        {/* ── Category Chips ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* ── Main Layout: Sidebar + Grid ── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Sidebar */}
          <aside className={`${
            showMobileFilters ? "block" : "hidden"
          } lg:block w-full lg:w-[260px] shrink-0 bg-card border border-border rounded-xl p-5 sticky top-24`}>
            <SidebarFilters />
          </aside>

          {/* Grid Area */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <p className="text-sm">
                <span className="font-bold text-foreground">{filteredListings.length}</span>
                <span className="text-muted-foreground"> resultado{filteredListings.length !== 1 ? "s" : ""}</span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="ml-3 text-xs text-primary hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm outline-none"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="promoted">Destacados primero</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
                {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] bg-secondary rounded-xl" />)}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center gap-4">
                <Search className="w-14 h-14 text-muted-foreground/30" />
                <h3 className="text-xl font-bold">Sin resultados</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  No encontramos publicaciones con esos criterios. Intenta ajustar los filtros.
                </p>
                <button onClick={clearFilters} className="px-6 py-2 bg-secondary rounded-full text-sm font-medium hover:bg-secondary/80 transition-colors">
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              <div className="space-y-14">

                {/* Destacados */}
                {promotedListings.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                      <h2 className="text-lg font-bold">Destacados</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {promotedListings.slice(0, 3).map(l => (
                        <ListingGridCard
                          key={l.id} listing={l}
                          isFavorite={favIds.has(l.id)}
                          onToggleFavorite={() => toggleFav.mutate({ userId: state.user!.id, listingId: l.id, isFav: favIds.has(l.id) } as any)}
                          isLoggedIn={isLoggedIn}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Main Grid */}
                <section className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredListings.map(l => (
                      <ListingGridCard
                        key={l.id} listing={l}
                        isFavorite={favIds.has(l.id)}
                        onToggleFavorite={() => toggleFav.mutate({ userId: state.user!.id, listingId: l.id, isFav: favIds.has(l.id) } as any)}
                        isLoggedIn={isLoggedIn}
                      />
                    ))}
                  </div>
                </section>

                {/* Genética */}
                {geneticsListings.length > 0 && activeCategory === "all" && (
                  <section className="space-y-4 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 text-primary">
                      <Dna className="w-5 h-5" />
                      <h2 className="text-lg font-bold">Genética Premium</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {geneticsListings.slice(0, 3).map(l => (
                        <ListingGridCard key={l.id} listing={l} isLoggedIn={isLoggedIn} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Oportunidades */}
                {discountListings.length > 0 && activeCategory === "all" && (
                  <section className="space-y-4 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 text-red-500">
                      <Zap className="w-5 h-5" />
                      <h2 className="text-lg font-bold">Oportunidades y Descuentos</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {discountListings.slice(0, 3).map(l => (
                        <ListingGridCard key={l.id} listing={l} isLoggedIn={isLoggedIn} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Wizard Modal */}
      {isLoggedIn && (
        <Modal open={showPublishModal} onOpenChange={setShowPublishModal} title="Publicar en Marketplace">
          <PublishListingWizard onClose={() => setShowPublishModal(false)} onSuccess={() => setShowPublishModal(false)} />
        </Modal>
      )}
    </AppShell>
  );
}
