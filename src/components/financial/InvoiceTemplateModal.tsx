import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Image as ImageIcon, Save, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { useInvoiceTemplate, useSaveInvoiceTemplate } from "@/lib/hooks/useInvoicing";
import { toast } from "sonner";

export function InvoiceTemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const { data: template, isLoading } = useInvoiceTemplate(orgId);
  const saveMutation = useSaveInvoiceTemplate();

  const [formData, setFormData] = useState({
    logo_url: "",
    primary_color: "#111827",
    layout_style: "modern",
    company_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    default_notes: "",
    default_terms: "",
    footer_text: ""
  });

  useEffect(() => {
    if (template) {
      setFormData({
        logo_url: template.logo_url || "",
        primary_color: template.primary_color || "#111827",
        layout_style: template.layout_style || "modern",
        company_name: template.company_name || "",
        tax_id: template.tax_id || "",
        address: template.address || "",
        phone: template.phone || "",
        email: template.email || "",
        default_notes: template.default_notes || "",
        default_terms: template.default_terms || "",
        footer_text: template.footer_text || "",
      });
    }
  }, [template]);

  if (!orgId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveMutation.mutateAsync({
        organization_id: orgId,
        ...formData
      });
      toast.success("Plantilla guardada correctamente");
      onClose();
    } catch (err) {
      toast.error("Error al guardar la plantilla");
      console.error(err);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-display">Personalizar Factura</Dialog.Title>
            <Dialog.Close className="p-2 hover:bg-secondary rounded-full transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          {isLoading ? (
            <div className="py-8 text-center animate-pulse text-muted-foreground">Cargando...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                {/* Visual */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Apariencia</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">URL del Logo</label>
                    <div className="flex gap-2">
                      <div className="h-10 w-10 shrink-0 bg-secondary rounded-md flex items-center justify-center overflow-hidden border">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain bg-white" />
                        ) : (
                          <ImageIcon size={20} className="text-muted-foreground" />
                        )}
                      </div>
                      <input 
                        type="url" 
                        className="form-input flex-1" 
                        placeholder="https://..."
                        value={formData.logo_url}
                        onChange={e => setFormData({...formData, logo_url: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Color Principal (Hex)</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        className="h-10 w-10 p-1 rounded-md border bg-transparent cursor-pointer shrink-0" 
                        value={formData.primary_color}
                        onChange={e => setFormData({...formData, primary_color: e.target.value})}
                      />
                      <input 
                        type="text" 
                        className="form-input flex-1" 
                        value={formData.primary_color}
                        onChange={e => setFormData({...formData, primary_color: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Estilo</label>
                    <select 
                      className="form-input"
                      value={formData.layout_style}
                      onChange={e => setFormData({...formData, layout_style: e.target.value})}
                    >
                      <option value="modern">Moderno (Recomendado)</option>
                      <option value="classic">Clásico / Formal</option>
                      <option value="minimal">Minimalista</option>
                    </select>
                  </div>
                </div>

                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Datos de la Empresa</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre / Razón Social</label>
                    <input 
                      type="text" className="form-input" 
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">NIT / RUT</label>
                      <input 
                        type="text" className="form-input" 
                        value={formData.tax_id}
                        onChange={e => setFormData({...formData, tax_id: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Teléfono</label>
                      <input 
                        type="text" className="form-input" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email de Contacto</label>
                    <input 
                      type="email" className="form-input" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección Física</label>
                    <textarea 
                      className="form-input text-sm" rows={2}
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Textos */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-muted-foreground">Textos Predeterminados</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Notas al Cliente (Por defecto)</label>
                    <textarea 
                      className="form-input text-sm" rows={3}
                      value={formData.default_notes}
                      onChange={e => setFormData({...formData, default_notes: e.target.value})}
                      placeholder="Ej: Gracias por confiar en nosotros."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Términos y Condiciones</label>
                    <textarea 
                      className="form-input text-sm" rows={3}
                      value={formData.default_terms}
                      onChange={e => setFormData({...formData, default_terms: e.target.value})}
                      placeholder="Ej: El pago debe realizarse a la cuenta Bancolombia #123456 en un plazo máximo de 15 días."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : <><Save size={16}/> Guardar Plantilla</>}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
