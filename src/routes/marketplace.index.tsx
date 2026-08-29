import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicShell } from "@/components/PublicShell"; // Assuming we want it public or AppShell if logged in?
// Actually, AppShell is better for now, but let's see. The user says "Public Catalog". Let's use AppShell but make it look like a store.
import { AppShell } from "@/components/AppShell";
import { useListings, type MarketplaceFilters as IFilters } from "@/lib/hooks/useMarketplace";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronRight, Store, Medal, Zap, Dna, Sparkles } from "lucide-react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { Modal } from "@/components/modals/Modal";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [{ title: "Mercado Premium — GaitFlow" }],
  }),
  component: MarketplaceHome,
});

const CATEGORIES = [
  { id: "caballos", label: "Caballos", icon: "🐎", filter: { type: "horse", minAge: 4 } },
  { id: "potros", label: "Potros", icon: "🐴", filter: { type: "horse", maxAge: 3 } },
  { id: "yeguas", label: "Yeguas", icon: "🦄", filter: { type: "horse", sex: "Hembra" } },
  { id: "sementales", label: "Sementales", icon: "👑", filter: { type: "horse", sex: "Macho" } }, // Note: we should rely on better filtering but this is visual
  { id: "competencia", label: "Competencia", icon: <Medal className="h-6 w-6" />, filter: { type: "horse" } }, // Ideally by discipline or achievement
  { id: "embriones", label: "Embriones", icon: <Dna className="h-6 w-6" />, filter: { type: "embryo" } },
  { id: "semen", label: "Semen", icon: <Zap className="h-6 w-6" />, filter: { type: "semen" } },
];

function MarketplaceHome() {
  const { data: rawListings = [], isLoading } = useListings();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<IFilters>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activeListings = useMemo(() => {
    return rawListings.filter((l) => {
      const status = (l as any).listing_status || l.status;
      return status === "Active" || status === "active";
    });
  }, [rawListings]);

  // Apply filters
  const filteredListings = useMemo(() => {
    let results = [...activeListings];
    const f = filters;
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      results = results.filter((l) =>
        l.title?.toLowerCase().includes(s) ||
        (l as any).horses?.name?.toLowerCase().includes(s) ||
        (l as any).horses?.breed?.toLowerCase().includes(s) ||
        (l as any).discipline?.toLowerCase().includes(s)
      );
    }
    
    if (f.type && f.type !== "all") results = results.filter((l) => l.type?.toLowerCase() === f.type);
    if (f.minPrice) results = results.filter((l) => Number(l.price) >= f.minPrice!);
    if (f.maxPrice) results = results.filter((l) => Number(l.price) <= f.maxPrice!);
    if (f.breed) results = results.filter((l) => (l as any).horses?.breed?.toLowerCase().includes(f.breed!.toLowerCase()));
    if (f.sex) results = results.filter((l) => (l as any).horses?.sex?.toLowerCase() === f.sex!.toLowerCase());
    if (f.gaitType) results = results.filter((l) => (l as any).horses?.gait_type?.toLowerCase().includes(f.gaitType!.toLowerCase()));
    
    // Age filtering (legacy min/max and new ageMonthsRange)
    if (f.minAge) results = results.filter((l) => ((l as any).horses?.age ?? 0) >= f.minAge!);
    if (f.maxAge) results = results.filter((l) => ((l as any).horses?.age ?? 99) <= f.maxAge!);
    
    if (f.ageMonthsRange) {
      results = results.filter((l) => {
        const h = (l as any).horses;
        if (!h) return false;
        
        // Compute months
        let months = 0;
        if (h.birth_date) {
          const bDate = new Date(h.birth_date);
          const diffTime = Math.abs(new Date().getTime() - bDate.getTime());
          months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
        } else if (h.age) {
          months = h.age * 12;
        } else {
          return false;
        }

        switch (f.ageMonthsRange) {
          case "0-6": return months <= 6;
          case "6-12": return months > 6 && months <= 12;
          case "12-24": return months > 12 && months <= 24;
          case "24-60": return months > 24 && months <= 60; // 2-5 years
          case "60+": return months > 60; // 5+ years
          default: return true;
        }
      });
    }
    if (f.discipline) results = results.filter((l) => {
      const d = ((l as any).discipline || (l as any).horses?.discipline || "").toLowerCase();
      return d.includes(f.discipline!.toLowerCase());
    });
    
    if (f.sortBy === "price_asc") results.sort((a, b) => Number(a.price) - Number(b.price));
    else if (f.sortBy === "price_desc") results.sort((a, b) => Number(b.price) - Number(a.price));
    else if (f.sortBy === "most_viewed") results.sort((a, b) => ((b as any).views_count || 0) - ((a as any).views_count || 0));

    return results;
  }, [activeListings, filters, searchTerm]);

  return (
    <AppShell>
      {/* ── Top Nav / Seller Center Link ── */}
      <div className="flex justify-end mb-4">
        <Link 
          to="/marketplace/seller"
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
        >
          <Store className="h-4 w-4" />
          Mi Inventario Comercial
        </Link>
      </div>

      {/* ── Hero Section ── */}
      <div className="relative rounded-3xl overflow-hidden mb-12 bg-zinc-950">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Equestrian" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        </div>
        
        <div className="relative px-6 py-20 lg:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="h-3 w-3 text-[var(--gold)]" />
            Colección Selecta
          </span>
          <h1 className="text-4xl md:text-6xl font-display text-white font-bold leading-tight mb-6">
            Descubre y adquiere los mejores ejemplares del mundo
          </h1>
          
          {/* Main Search Bar */}
          <div className="w-full max-w-2xl relative flex items-center mt-4">
            <div className="absolute left-4 text-white/50">
              <Search className="h-5 w-5" />
            </div>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar caballo, raza, disciplina, ubicación..."
              className="w-full pl-12 pr-4 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 transition-all shadow-2xl"
            />
            <button 
              onClick={() => {
                const el = document.getElementById("catalog-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="absolute right-2 px-6 py-2 rounded-full bg-[var(--gold)] text-zinc-900 font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Explorar
            </button>
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      <div className="mb-12">
        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          Explorar por Categoría
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setFilters({ ...filters, ...cat.filter });
                const el = document.getElementById("catalog-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="lux-card p-4 flex flex-col items-center justify-center gap-3 text-center hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="text-3xl text-primary group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <span className="text-sm font-semibold">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Catalog Section ── */}
      <div id="catalog-section" className="flex flex-col lg:flex-row gap-8 scroll-mt-24">
        
        {/* Mobile Filters Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-bold">Catálogo</h2>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg text-sm font-semibold"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtros
          </button>
        </div>

        {/* Sidebar Filters (Desktop) */}
        <div className="hidden lg:block lg:w-72 shrink-0">
          <div className="sticky top-24">
            <MarketplaceFilters
              filters={filters}
              onChange={setFilters}
              totalResults={filteredListings.length}
            />
          </div>
        </div>

        {/* Mobile Filters Modal */}
        <Modal open={showMobileFilters} onClose={() => setShowMobileFilters(false)} title="Filtros del Catálogo">
          <div className="pb-8">
            <MarketplaceFilters
              filters={filters}
              onChange={setFilters}
              totalResults={filteredListings.length}
            />
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
            >
              Aplicar Filtros
            </button>
          </div>
        </Modal>

        {/* Results Grid */}
        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Catálogo Público</h2>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredListings.length} {filteredListings.length === 1 ? "resultado" : "resultados"}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-96 bg-secondary rounded-[2rem]" />)}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="lux-card p-16 text-center text-muted-foreground flex flex-col items-center">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="font-display text-2xl text-foreground">No encontramos resultados</h3>
              <p className="mt-2 text-sm max-w-md">
                No hay publicaciones que coincidan con tus filtros actuales. Intenta modificar tu búsqueda o limpiar los filtros.
              </p>
              <button 
                onClick={() => {
                  setFilters({});
                  setSearchTerm("");
                }}
                className="mt-6 px-6 py-2 bg-secondary text-foreground font-semibold rounded-full hover:bg-secondary/80 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing as any}
                  onViewDetail={() => navigate({ to: `/marketplace/listing/$listingId`, params: { listingId: listing.id } })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
