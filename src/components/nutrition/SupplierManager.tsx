import React, { useState } from "react";
import { useSuppliers, useCreateSupplier, useDeleteSupplier } from "@/lib/hooks/useInventory";
import { Truck, Plus, Trash2, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";

export function SupplierManager() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const { state } = useApp();
  const orgId = state.user?.organization_id;

  const [isAdding, setIsAdding] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_info: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleCreate = async () => {
    if (!newSupplier.name) {
      toast.error("El nombre del proveedor es requerido");
      return;
    }
    try {
      await createSupplier.mutateAsync({
        ...newSupplier,
        organization_id: orgId,
      });
      setIsAdding(false);
      setNewSupplier({ name: "", contact_info: "", email: "", phone: "", address: "", notes: "" });
      toast.success("Proveedor agregado exitosamente");
    } catch (e) {
      toast.error("Error al agregar proveedor");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--primary),0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" /> Agregar Proveedor
        </button>
      </div>

      {isAdding && (
        <div className="lux-card p-6 bg-secondary/20 border-primary/20">
          <h4 className="font-display text-lg mb-4">Registrar Nuevo Proveedor</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="eyebrow block mb-1">Nombre de la Empresa</label>
              <input className="lux-input text-sm" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="Ej. Solla, Finca..." />
            </div>
            <div>
              <label className="eyebrow block mb-1">Persona de Contacto</label>
              <input className="lux-input text-sm" value={newSupplier.contact_info} onChange={e => setNewSupplier({...newSupplier, contact_info: e.target.value})} placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label className="eyebrow block mb-1">Teléfono</label>
              <input className="lux-input text-sm" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} placeholder="+57 300 000 0000" />
            </div>
            <div>
              <label className="eyebrow block mb-1">Correo Electrónico</label>
              <input type="email" className="lux-input text-sm" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="ventas@proveedor.com" />
            </div>
            <div className="lg:col-span-2">
              <label className="eyebrow block mb-1">Dirección / Ubicación</label>
              <input className="lux-input text-sm" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} placeholder="Ej. Vía a Rozo, Valle del Cauca" />
            </div>
            <div className="lg:col-span-3">
              <label className="eyebrow block mb-1">Notas Adicionales</label>
              <textarea className="lux-input text-sm h-20 resize-none" value={newSupplier.notes} onChange={e => setNewSupplier({...newSupplier, notes: e.target.value})} placeholder="Condiciones de entrega, descuentos, productos específicos que proveen..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-full transition-colors">Cancelar</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:opacity-95">Guardar Proveedor</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">Cargando directorio de proveedores...</div>
      ) : suppliers.length === 0 ? (
        <div className="lux-card p-12 text-center text-muted-foreground border-dashed">
          <Truck className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No hay proveedores registrados. Agrega tus vendedores de concentrado y pasto aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suppliers.map((supplier: any) => (
            <div key={supplier.id} className="lux-card p-6 relative group">
              <button onClick={() => deleteSupplier.mutate(supplier.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                <Trash2 className="h-4 w-4" />
              </button>
              
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 rounded-xl bg-secondary text-foreground shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{supplier.name}</h4>
                  <div className="text-sm text-muted-foreground mt-0.5">{supplier.contact_info || "Sin contacto principal"}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" /> <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" /> <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" /> <span>{supplier.address}</span>
                  </div>
                )}
              </div>
              
              {supplier.notes && (
                <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/70 uppercase tracking-widest block mb-1">Notas</span>
                  {supplier.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
