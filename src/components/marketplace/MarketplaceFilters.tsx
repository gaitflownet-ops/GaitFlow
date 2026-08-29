/**
 * MarketplaceFilters.tsx — Advanced sidebar filter panel for the public marketplace catalog.
 * Supports: search text, listing type, price range, breed, sex, age, discipline, country, sort.
 */
import { useState } from "react";
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { MarketplaceFilters } from "@/lib/hooks/useMarketplace";

interface Props {
  filters: MarketplaceFilters;
  onChange: (filters: MarketplaceFilters) => void;
  totalResults: number;
}

const BREEDS = [
  "Paso Fino Colombiano", "Caballo Criollo Colombiano", "Cuarto de Milla",
  "Pura Sangre Inglés", "Warmblood", "Andaluz", "Lusitano", "Árabe",
  "Appaloosa", "Paint Horse", "Morgan", "Tennessee Walking Horse",
];
const DISCIPLINES = [
  "Paso Fino", "Salto", "Doma Clásica", "Polo", "Endurance",
  "Trabajo de Llano", "Show Jumping", "Western", "Trail", "Vaquejada",
];
const COUNTRIES = [
  "Colombia", "México", "Estados Unidos", "Venezuela", "Argentina",
  "Brasil", "Chile", "España", "Panamá", "Ecuador", "Perú",
];

export function MarketplaceFilters({ filters, onChange, totalResults }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch: Partial<MarketplaceFilters>) => onChange({ ...filters, ...patch });
  const reset = () => onChange({});

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    filters.breed ||
    filters.sex ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.discipline ||
    filters.country ||
    filters.minAge ||
    filters.maxAge;

  return (
    <div className="lux-card p-4 mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, raza, descripción..."
          value={filters.search || ""}
          onChange={(e) => update({ search: e.target.value || undefined })}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {filters.search && (
          <button
            onClick={() => update({ search: undefined })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Quick Type Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: undefined, label: "Todos" },
          { value: "horse", label: "🐎 Ejemplares" },
          { value: "embryo", label: "🧬 Embriones" },
          { value: "semen", label: "💉 Semen" },
          { value: "breeding service", label: "🤝 Servicios" },
        ].map(({ value, label }) => (
          <button
            key={label}
            onClick={() => update({ type: value })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filters.type === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Precio Mín. (USD)
          </label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice || ""}
            onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Precio Máx. (USD)
          </label>
          <input
            type="number"
            placeholder="Sin límite"
            value={filters.maxPrice || ""}
            onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtros Avanzados
        {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in duration-200">
          {/* Breed */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Raza
            </label>
            <select
              value={filters.breed || ""}
              onChange={(e) => update({ breed: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              <option value="">Todas las razas</option>
              {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Sex */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Sexo
            </label>
            <div className="flex gap-2">
              {["", "Yegua", "Macho", "Potro"].map((s) => (
                <button
                  key={s || "all"}
                  onClick={() => update({ sex: s || undefined })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    (filters.sex || "") === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border text-muted-foreground"
                  }`}
                >
                  {s || "Todos"}
                </button>
              ))}
            </div>
          </div>

          {/* Gait Type (Andar) */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Andar (CCC)
            </label>
            <select
              value={filters.gaitType || ""}
              onChange={(e) => update({ gaitType: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              <option value="">Todos los andares</option>
              <option value="p1">P1 — Paso Fino</option>
              <option value="p2">P2 — Trote y Galope</option>
              <option value="p3">P3 — Trocha</option>
              <option value="p4">P4 — Trocha y Galope</option>
            </select>
          </div>

          {/* Age Range */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Edad
            </label>
            <select
              value={filters.ageMonthsRange || ""}
              onChange={(e) => update({ ageMonthsRange: e.target.value || undefined, minAge: undefined, maxAge: undefined })}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              <option value="">Todas las edades</option>
              <option value="0-6">0 - 6 meses (Destetos)</option>
              <option value="6-12">6 - 12 meses</option>
              <option value="12-24">1 - 2 años</option>
              <option value="24-60">2 - 5 años</option>
              <option value="60+">Mayores a 5 años</option>
            </select>
          </div>

          {/* Discipline */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Disciplina
            </label>
            <select
              value={filters.discipline || ""}
              onChange={(e) => update({ discipline: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              <option value="">Todas las disciplinas</option>
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              País del Establo
            </label>
            <select
              value={filters.country || ""}
              onChange={(e) => update({ country: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none"
            >
              <option value="">Todos los países</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Sort & Results Summary */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{totalResults}</span> publicaciones
        </span>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">Ordenar:</label>
          <select
            value={filters.sortBy || "newest"}
            onChange={(e) => update({ sortBy: e.target.value as any })}
            className="text-xs px-2 py-1 bg-secondary border border-border rounded-lg focus:outline-none"
          >
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
            <option value="most_viewed">Más vistos</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={reset}
              className="text-xs text-red-500 hover:text-red-400 font-semibold flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
