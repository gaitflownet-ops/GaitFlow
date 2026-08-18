/**
 * GeneticBankView.tsx — Banco Genético (Requerimiento 7)
 * Módulo independiente para Semen, Embriones y Ovocitos con control estricto de inventario y tanques
 */
import { useState } from "react";
import { Dna, Snowflake, Droplets, FlaskConical, Plus, Package, MapPin, Calendar, Filter } from "lucide-react";
import type { GeneticItem, GeneticMaterialType } from "@/lib/hooks/useBreeding";

interface Props {
  inventory: GeneticItem[];
  onCreateItem: () => void;
}

export function GeneticBankView({ inventory, onCreateItem }: Props) {
  const [selectedType, setSelectedType] = useState<string>("all");

  const displayItems: GeneticItem[] = inventory;

  const filtered = selectedType === "all"
    ? displayItems
    : displayItems.filter((i) => i.material_type === selectedType);

  return (
    <div className="lux-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-blue-500" /> Banco Genético de Élite
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inventario criogénico de Semen, Embriones y Ovocitos con trazabilidad por lote y tanque
          </p>
        </div>

        <button
          onClick={onCreateItem}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Agregar al Banco Genético
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <button
          onClick={() => setSelectedType("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
            selectedType === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
          }`}
        >
          Todos ({displayItems.length})
        </button>
        {["Semen", "Embrión", "Ovocito"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
              selectedType === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary text-muted-foreground"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="lux-card p-5 border-border hover:border-blue-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  {item.material_type === "Semen" ? <Snowflake className="h-4 w-4" /> : item.material_type === "Embrión" ? <Dna className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
                  {item.material_type} · {item.lot_number || `LOT-${item.id.slice(0, 5)}`}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {item.status}
                </span>
              </div>

              <div className="space-y-2 text-xs mb-4">
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
                  <span className="block text-[10px] text-muted-foreground font-semibold">Donador / Padre</span>
                  <span className="font-bold text-foreground text-sm">{item.donor?.name || "Donador Registrado"}</span>
                </div>

                {item.dam && (
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border">
                    <span className="block text-[10px] text-muted-foreground font-semibold">Yegua Madre</span>
                    <span className="font-bold text-foreground text-sm">{item.dam.name}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-border pt-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div>
                    <span className="block text-[10px] text-muted-foreground">Cantidad</span>
                    <strong className="text-foreground text-sm">{item.quantity} Unidades</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-muted-foreground">Ubicación</span>
                    <strong className="text-foreground text-xs truncate block">{item.storage_tank || "Tanque Principal"}</strong>
                  </div>
                </div>
              </div>

              {item.notes && (
                <div className="text-[11px] text-muted-foreground bg-secondary/40 p-2 rounded-lg border border-border">
                  📝 {item.notes}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 mt-3 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Valor Estimado:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-display text-sm">
                ${item.cost_usd ? item.cost_usd.toLocaleString() : "3,500"} USD
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
