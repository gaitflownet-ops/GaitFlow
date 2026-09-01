import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListings, useFavorites, useToggleFavorite, type EnterpriseListing } from "@/lib/hooks/useMarketplace";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronRight, Heart, MapPin, Eye, Filter, X, ChevronDown, ChevronUp, Star, Zap, Dna, Users } from "lucide-react";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [{ title: "Marketplace — GaitFlow" }],
  }),
  component: MarketplaceHome,
});

function ListingGridCard({ listing, isFavorite, onToggleFavorite }: { listing: EnterpriseListing, isFavorite?: boolean, onToggleFavorite?: () => void }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const h = listing.horses;
  const title = listing.title || h?.name || "Ejemplar Premium";
  const price = listing.price ? `COP ${Number(listing.price).toLocaleString('es-CO')}` : "Precio a consultar";
  const originalPrice = listing.original_price ? `COP ${Number(listing.original_price).toLocaleString('es-CO')}` : null;
  
  let imageUrl = "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80";
  if (listing.images && listing.images.length > 0) imageUrl = listing.images[0];
  else if (h?.image_url) imageUrl = h.image_url;
  
  let ageDisplay = "";
  if (h?.birth_date) {
    const bDate = new Date(h.birth_date);
    const diffMonths = Math.floor(Math.abs(Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    ageDisplay = diffMonths < 24 ? `${diffMonths} meses` : `${Math.floor(diffMonths / 12)} años`;
  } else if (h?.age) {
    ageDisplay = `${h.age} años`;
  }

  const isSold = listing.listing_status === "Sold" || listing.status === "Sold";

  return (
    <div className="flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })}>
        <img src={imgError ? "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80" : imageUrl} alt={title} onError={() => setImgError(true)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        {listing.discount_percentage && !isSold && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-{listing.discount_percentage}%</div>
        )}
        {isSold ? (
          <div className="absolute top-2 right-2 bg-zinc-800 text-white text-xs font-bold px-2 py-1 rounded">Vendido</div>
        ) : listing.is_promoted ? (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">Destacado</div>
        ) : null}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })}>
          {title}
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {h?.breed && <span className="bg-secondary text-secondary-foreground text-[10px] font-medium px-2 py-0.5 rounded">{h.breed}</span>}
          {ageDisplay && <span className="bg-secondary text-secondary-foreground text-[10px] font-medium px-2 py-0.5 rounded">{ageDisplay}</span>}
          {h?.sex && <span className="bg-secondary text-secondary-foreground text-[10px] font-medium px-2 py-0.5 rounded">{h.sex}</span>}
        </div>
        <div className="mt-4 mt-auto">
          {originalPrice && !isSold && <div className="text-sm text-muted-foreground line-through">{originalPrice}</div>}
          <div className="text-2xl font-bold text-foreground">{price}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">📍 {listing.location_country || "Colombia"} {listing.location_city ? `- ${listing.location_city}` : ""}</div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">Ver Ficha</button>
          {onToggleFavorite && (
            <button onClick={onToggleFavorite} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors">
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const TOP_CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "horses", label: "Caballos" },
  { id: "foals", label: "Potros" },
  { id: "mares", label: "Yeguas" },
  { id: "stallions", label: "Sementales" },
  { id: "embryos", label: "Embriones" },
  { id: "semen", label: "Semen" },
  { id: "sport", label: "Deporte" },
];

function MarketplaceHome() {
  const { data: rawListings = [], isLoading } = useListings();
  const { data: favorites = [] } = useFavorites();
  const toggleFav = useToggleFavorite();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [chipCategory, setChipCategory] = useState("all");

  const [filters, setFilters] = useState({
    categories: [] as string[],
    breed: "",
    gaitType: [] as string[],
    ageRange: "",
    minPrice: "",
    maxPrice: "",
    country: ""
  });
  
  const [sortBy, setSortBy] = useState("recent");

  const activeListings = useMemo(() => {
    return rawListings.filter(l => {
      const st = (l as any).listing_status || l.status;
      return st === "Active" || st === "active";
    });
  }, [rawListings]);

  // Derived sections
  const promotedListings = useMemo(() => activeListings.filter(l => l.is_promoted), [activeListings]);
  const geneticsListings = useMemo(() => activeListings.filter(l => l.type === "embryo" || l.type === "semen"), [activeListings]);
  const opportunitiesListings = useMemo(() => activeListings.filter(l => (l.discount_percentage || 0) > 0), [activeListings]);

  // Apply filters
  const filteredListings = useMemo(() => {
    let res = [...activeListings];
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      res = res.filter(l => l.title?.toLowerCase().includes(s) || l.horses?.name?.toLowerCase().includes(s));
    }
    
    if (searchCategory !== "all") {
      // simple match for demo
      if (searchCategory === "horse") res = res.filter(l => l.type === "horse");
      if (searchCategory === "embryo") res = res.filter(l => l.type === "embryo");
      if (searchCategory === "semen") res = res.filter(l => l.type === "semen");
    }

    if (chipCategory !== "all") {
      if (chipCategory === "horses") res = res.filter(l => l.type === "horse");
      if (chipCategory === "embryos") res = res.filter(l => l.type === "embryo");
      if (chipCategory === "semen") res = res.filter(l => l.type === "semen");
      if (chipCategory === "mares") res = res.filter(l => l.horses?.sex === "Hembra");
      if (chipCategory === "stallions") res = res.filter(l => l.horses?.sex === "Macho");
    }

    if (filters.categories.length > 0) {
      res = res.filter(l => filters.categories.includes(l.type || "horse"));
    }
    if (filters.breed) {
      res = res.filter(l => l.horses?.breed?.toLowerCase() === filters.breed.toLowerCase());
    }
    if (filters.gaitType.length > 0) {
      res = res.filter(l => {
        const gt = (l.horses as any)?.gait_type;
        return gt && filters.gaitType.includes(gt);
      });
    }
    if (filters.minPrice) {
      res = res.filter(l => Number(l.price) >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      res = res.filter(l => Number(l.price) <= Number(filters.maxPrice));
    }
    if (filters.country) {
      res = res.filter(l => l.location_country === filters.country);
    }
    
    // Sort
    if (sortBy === "price_asc") res.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price_desc") res.sort((a, b) => Number(b.price) - Number(a.price));

    return res;
  }, [activeListings, filters, searchTerm, searchCategory, chipCategory, sortBy]);

  const handleToggleCategory = (cat: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
  };

  const handleToggleGait = (gait: string) => {
    setFilters(prev => ({
      ...prev,
      gaitType: prev.gaitType.includes(gait) 
        ? prev.gaitType.filter(g => g !== gait) 
        : [...prev.gaitType, gait]
    }));
  };

  const clearFilters = () => {
    setFilters({ categories: [], breed: "", gaitType: [], ageRange: "", minPrice: "", maxPrice: "", country: "" });
    setSearchTerm("");
    setSearchCategory("all");
    setChipCategory("all");
    setSortBy("recent");
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 w-full space-y-8">
        
        {/* BARRA BÚSQUEDA PRINCIPAL */}
        <div className="bg-card p-2 rounded-full border border-border shadow-sm flex items-center max-w-4xl mx-auto">
          <select 
            value={searchCategory} 
            onChange={(e) => setSearchCategory(e.target.value)}
            className="bg-transparent border-none outline-none px-4 py-2 text-sm font-medium border-r border-border shrink-0"
          >
            <option value="all">Todas las categorías</option>
            <option value="horse">Caballos</option>
            <option value="embryo">Embriones</option>
            <option value="semen">Semen</option>
          </select>
          <div className="flex-1 flex items-center px-4">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar ejemplares, razas, ubicaciones..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none px-3 py-2 text-sm"
            />
          </div>
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 shrink-0">
            Buscar
          </button>
        </div>

        {/* CATEGORÍAS HORIZONTALES SCROLLEABLES */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-5xl mx-auto">
          {TOP_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setChipCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${chipCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* LAYOUT 2 COLUMNAS */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR FILTROS 280px */}
          <div className="w-full lg:w-[280px] shrink-0 bg-card border border-border rounded-xl p-5 space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</h3>
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary">Limpiar</button>
            </div>

            {/* Categoría */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Categoría</h4>
              {["horse", "embryo", "semen"].map(cat => (
                <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={filters.categories.includes(cat)} onChange={() => handleToggleCategory(cat)} className="rounded border-border text-primary focus:ring-primary" />
                  <span>{cat === "horse" ? "Caballos" : cat === "embryo" ? "Embriones" : "Semen"}</span>
                </label>
              ))}
            </div>

            {/* Raza */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Raza</h4>
              <select 
                value={filters.breed} 
                onChange={(e) => setFilters({...filters, breed: e.target.value})}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todas las razas</option>
                <option value="Criollo Colombiano">Criollo Colombiano</option>
                <option value="Cuarto de Milla">Cuarto de Milla</option>
                <option value="Paso Fino">Paso Fino</option>
                <option value="Trotón Galopero">Trotón Galopero</option>
              </select>
            </div>

            {/* Andar CCC */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Andar CCC</h4>
              {["Trote y Galope (P1)", "Trocha y Galope (P2)", "Trocha Pura (P3)", "Paso Fino (P4)"].map(gait => (
                <label key={gait} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={filters.gaitType.includes(gait)} onChange={() => handleToggleGait(gait)} className="rounded border-border text-primary focus:ring-primary" />
                  <span>{gait}</span>
                </label>
              ))}
            </div>

            {/* Edad */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Edad</h4>
              <select 
                value={filters.ageRange} 
                onChange={(e) => setFilters({...filters, ageRange: e.target.value})}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Cualquier edad</option>
                <option value="0-1">0 a 1 año</option>
                <option value="1-3">1 a 3 años</option>
                <option value="3-5">3 a 5 años</option>
                <option value="5+">Más de 5 años</option>
              </select>
            </div>

            {/* Precio */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Precio (COP)</h4>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" 
                />
                <span className="text-muted-foreground">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
            </div>

            {/* País */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">País</h4>
              <select 
                value={filters.country} 
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="Colombia">Colombia</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="México">México</option>
              </select>
            </div>

            <button onClick={clearFilters} className="w-full py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">
              Limpiar filtros
            </button>
          </div>

          {/* GRID PRODUCTOS */}
          <div className="flex-1 min-w-0 space-y-12">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-3 rounded-xl shadow-sm">
              <div className="text-sm font-medium">
                Mostrando <span className="font-bold text-primary">{filteredListings.length}</span> resultados
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-medium outline-none"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Precio: Menor a Mayor</option>
                  <option value="price_desc">Precio: Mayor a Menor</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[4/3] bg-secondary rounded-xl" />)}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold">No se encontraron resultados</h3>
                <p className="text-muted-foreground mt-2 max-w-md">Prueba ajustando los filtros o buscando con otros términos.</p>
                <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-secondary rounded-full font-medium hover:bg-secondary/80">
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              <div className="space-y-16">
                
                {/* Sección Destacados (Only if no strict search/filter applied, or just show them top) */}
                {promotedListings.length > 0 && (
                  <div className="space-y-6 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-l-4 border-amber-500">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                      <h2 className="text-2xl font-bold">Ejemplares Destacados</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {promotedListings.slice(0,3).map(listing => (
                        <ListingGridCard key={listing.id} listing={listing} isFavorite={favorites.some((f:any) => f.listing_id === listing.id)} onToggleFavorite={() => toggleFav.mutate(listing.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Grid */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Todos los Resultados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredListings.map(listing => (
                      <ListingGridCard key={listing.id} listing={listing} isFavorite={favorites.some((f:any) => f.listing_id === listing.id)} onToggleFavorite={() => toggleFav.mutate(listing.id)} />
                    ))}
                  </div>
                </div>

                {/* Sección Genética Premium */}
                {geneticsListings.length > 0 && !filters.categories.includes('horse') && (
                  <div className="space-y-6 pt-10 border-t border-border">
                    <div className="flex items-center gap-2 text-primary">
                      <Dna className="w-6 h-6" />
                      <h2 className="text-2xl font-bold">Genética Premium</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {geneticsListings.slice(0,3).map(listing => (
                        <ListingGridCard key={listing.id} listing={listing} isFavorite={favorites.some((f:any) => f.listing_id === listing.id)} onToggleFavorite={() => toggleFav.mutate(listing.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sección Oportunidades */}
                {opportunitiesListings.length > 0 && !filters.categories.includes('embryo') && (
                  <div className="space-y-6 pt-10 border-t border-border">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <Zap className="w-6 h-6 fill-red-500 text-red-500" />
                      <h2 className="text-2xl font-bold">Oportunidades y Descuentos</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {opportunitiesListings.slice(0,3).map(listing => (
                        <ListingGridCard key={listing.id} listing={listing} isFavorite={favorites.some((f:any) => f.listing_id === listing.id)} onToggleFavorite={() => toggleFav.mutate(listing.id)} />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
