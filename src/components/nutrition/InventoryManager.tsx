import React, { useState } from "react";
import { useFeedInventory, useCreateInventoryItem, useDeleteInventoryItem } from "@/lib/hooks/useInventory";
import { Package, AlertTriangle, Plus, Trash2, Search, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";

export function InventoryManager() {
  const { data: inventory = [], isLoading } = useFeedInventory();
  const createItem = useCreateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newItem, setNewItem] = useState({
    product_name: "",
    category: "Concentrado",
    current_stock_kg: 0,
    reorder_point_kg: 0,
    cost_per_kg: 0,
    purchase_date: new Date().toISOString().split("T")[0],
    expiration_date: "",
  });

  const handleCreate = async () => {
    if (!newItem.product_name) {
      toast.error("El nombre del producto es requerido");
      return;
    }
    try {
      await createItem.mutateAsync({
        ...newItem,
        organization_id: orgId,
      });
      setIsAdding(false);
      toast.success("Producto registrado exitosamente en bodega");
    } catch (e) {
      toast.error("Error al registrar en bodega");
    }
  };

  const filteredInventory = inventory.filter((item: any) => 
    (item.product_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar cuido, pasto, pacas, suplementos..." 
            className="lux-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--primary),0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" /> Ingresar Inventario
        </button>
      </div>

      {isAdding && (
        <div className="lux-card p-6 bg-secondary/20 border-primary/20">
          <h4 className="font-display text-lg mb-4">Registrar Nuevo Lote en Bodega</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="eyebrow block mb-1">Nombre del Producto</label>
              <input className="lux-input text-sm" value={newItem.product_name} onChange={e => setNewItem({...newItem, product_name: e.target.value})} placeholder="Ej. Pavo Sport, Pasto Kikuyo..." />
            </div>
            <div>
              <label className="eyebrow block mb-1">Categoría</label>
              <select className="lux-select text-sm" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                <option value="Forraje">Forraje (Pasto/Heno)</option>
                <option value="Concentrado">Concentrado (Cuido)</option>
                <option value="Suplemento">Suplemento</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1">Costo por Kg ($)</label>
              <input type="number" min="0" step="0.01" className="lux-input text-sm" value={newItem.cost_per_kg} onChange={e => setNewItem({...newItem, cost_per_kg: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Stock Actual (Kg)</label>
              <input type="number" min="0" step="0.1" className="lux-input text-sm" value={newItem.current_stock_kg} onChange={e => setNewItem({...newItem, current_stock_kg: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Alerta de Reabastecimiento (Kg)</label>
              <input type="number" min="0" step="0.1" className="lux-input text-sm" value={newItem.reorder_point_kg} onChange={e => setNewItem({...newItem, reorder_point_kg: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Fecha de Compra</label>
              <input type="date" className="lux-input text-sm" value={newItem.purchase_date} onChange={e => setNewItem({...newItem, purchase_date: e.target.value})} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Fecha de Vencimiento</label>
              <input type="date" className="lux-input text-sm" value={newItem.expiration_date} onChange={e => setNewItem({...newItem, expiration_date: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-full transition-colors">Cancelar</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:opacity-95">Guardar en Bodega</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">Cargando inventario de bodega...</div>
      ) : filteredInventory.length === 0 ? (
        <div className="lux-card p-12 text-center text-muted-foreground border-dashed">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No se encontraron productos. Registra tu primer alimento o suplemento para controlar el stock.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item: any) => {
            const isLow = item.current_stock_kg <= item.reorder_point_kg;
            return (
              <div key={item.id} className={`lux-card p-5 relative group transition-all ${isLow ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                <button onClick={() => deleteItem.mutate(item.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="flex gap-3 mb-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isLow ? 'bg-amber-500/20 text-amber-500' : 'bg-secondary text-foreground'}`}>
                    {isLow ? <AlertTriangle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  </div>
                  <div>
                    <h5 className="font-semibold">{item.product_name}</h5>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stock Actual</div>
                    <div className={`font-mono font-semibold ${isLow ? 'text-amber-500' : ''}`}>{item.current_stock_kg} kg</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Punto de Reorden</div>
                    <div className="font-mono text-muted-foreground">{item.reorder_point_kg} kg</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Costo/Kg</div>
                    <div className="font-mono text-muted-foreground">${item.cost_per_kg}</div>
                  </div>
                  {item.expiration_date && (
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence</div>
                      <div className="font-mono text-muted-foreground">{new Date(item.expiration_date).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
