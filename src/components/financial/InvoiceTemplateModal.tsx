import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Save, Building2, Palette, FileText, Scale, Eye } from "lucide-react";
import { useApp } from "@/lib/store";
import { useInvoiceTemplate, useSaveInvoiceTemplate } from "@/lib/hooks/useInvoicing";
import { toast } from "sonner";

// ─── Estilos disponibles ──────────────────────────────────────────────────────
const LAYOUT_STYLES = [
  { value: "modern",  label: "Moderno",   desc: "Limpio con acentos en color" },
  { value: "classic", label: "Clásico",   desc: "Formal, estilo corporativo" },
  { value: "minimal", label: "Minimalista", desc: "Simpleza elegante, sin decoración" },
];

const TAX_REGIMES = [
  { value: "no_vat_responsible", label: "No Responsable de IVA" },
  { value: "vat_responsible",    label: "Responsable de IVA (Régimen común)" },
  { value: "simple_regime",      label: "Régimen Simple de Tributación" },
  { value: "special_regime",     label: "Entidad del Régimen Especial" },
];

// ─── Mini Preview ─────────────────────────────────────────────────────────────
function InvoicePreview({ form }: { form: any }) {
  const color = form.primary_color || "#111827";
  const style = form.layout_style || "modern";

  const renderHeader = () => {
    if (style === "minimal") {
      return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "10px", marginBottom: "10px" }}>
          <div>
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" style={{ maxHeight: "28px", maxWidth: "100px", objectFit: "contain", marginBottom: "6px" }} />
            ) : (
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>{form.company_name || "Tu Empresa"}</div>
            )}
            <div style={{ color: "#64748b", fontSize: "8px" }}>{form.tax_id ? `NIT: ${form.tax_id}` : "NIT: 000.000.000-0"}</div>
            {form.city && <div style={{ color: "#64748b", fontSize: "8px" }}>{form.city}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>FACTURA {form.invoice_prefix || "GF"}-2026-0001</div>
          </div>
        </div>
      );
    }
    if (style === "classic") {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "10px", textAlign: "center" }}>
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" style={{ maxHeight: "40px", maxWidth: "120px", objectFit: "contain", marginBottom: "6px" }} />
          ) : (
            <div style={{ fontSize: "16px", fontWeight: 700, color, marginBottom: "4px" }}>{form.company_name || "Tu Empresa"}</div>
          )}
          <div style={{ color: "#64748b", fontSize: "8px" }}>{form.tax_id ? `NIT: ${form.tax_id}` : "NIT: 000.000.000-0"} {form.city ? ` · ${form.city}` : ""}</div>
          <div style={{ color: "#64748b", fontSize: "8px" }}>{form.address} {form.phone ? ` · Tel: ${form.phone}` : ""}</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color, marginTop: "8px" }}>FACTURA N° {form.invoice_prefix || "GF"}-2026-0001</div>
        </div>
      );
    }
    // modern (default)
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${color}`, paddingBottom: "10px", marginBottom: "10px" }}>
        <div>
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" style={{ maxHeight: "36px", maxWidth: "120px", objectFit: "contain", marginBottom: "4px" }} />
          ) : (
            <div style={{ fontSize: "14px", fontWeight: 800, color, marginBottom: "4px" }}>{form.company_name || "Tu Empresa"}</div>
          )}
          <div style={{ color: "#64748b", fontSize: "8px" }}>{form.tax_id ? `NIT: ${form.tax_id}` : "NIT: 000.000.000-0"} {form.city ? ` · ${form.city}` : ""}</div>
          {form.email && <div style={{ color: "#64748b", fontSize: "8px" }}>{form.email}</div>}
        </div>
        <div style={{ textAlign: "right", backgroundColor: color, color: "#fff", padding: "6px 12px", borderRadius: "4px" }}>
          <div style={{ fontSize: "12px", fontWeight: 300, opacity: 0.9 }}>FACTURA</div>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>{form.invoice_prefix || "GF"}-2026-0001</div>
        </div>
      </div>
    );
  };

  const tableHeaderStyle = style === "minimal" 
    ? { borderBottom: "1px solid #111827" } 
    : style === "classic" 
      ? { borderBottom: "1px solid #94a3b8", borderTop: "1px solid #94a3b8", backgroundColor: "#f8fafc" }
      : { borderBottom: `2px solid ${color}`, backgroundColor: `${color}10` };

  return (
    <div className="invoice-preview-shell">
      <div
        className="invoice-preview-doc"
        style={{ fontFamily: style === "classic" ? "serif" : "sans-serif", fontSize: "10px", lineHeight: 1.4, color: "#1e293b" }}
      >
        {renderHeader()}

        {/* Cliente */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "2px" }}>Facturar a:</div>
            <div style={{ fontWeight: 700 }}>Cliente Ejemplo S.A.S</div>
            <div style={{ color: "#64748b", fontSize: "8px" }}>cliente@ejemplo.com</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "8px", color: "#64748b" }}>
            <div>Emisión: {new Date().toLocaleDateString()}</div>
            <div>Vence: {new Date(Date.now() + 15*86400000).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Tabla */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px", marginBottom: "10px" }}>
          <thead>
            <tr style={tableHeaderStyle}>
              {["Descripción","Cant.","Precio","Total"].map(h => (
                <th key={h} style={{ padding: "4px", fontWeight: 700, color: style === "minimal" ? "#111827" : "#374151", textAlign: h === "Descripción" ? "left" : "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { desc: "Mensualidad pensión", qty: 1, price: 1200000 },
              { desc: "Servicio veterinario", qty: 1, price: 350000 },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px" }}>{row.desc}</td>
                <td style={{ padding: "4px", textAlign: "right" }}>{row.qty}</td>
                <td style={{ padding: "4px", textAlign: "right" }}>${row.price.toLocaleString("es-CO")}</td>
                <td style={{ padding: "4px", textAlign: "right", fontWeight: 600 }}>${row.price.toLocaleString("es-CO")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <div style={{ width: "130px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#64748b", padding: "2px 0" }}>
              <span>Subtotal</span><span>$1.550.000</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 800, borderTop: style === "minimal" ? "1px solid #111827" : `1px solid ${color}`, paddingTop: "4px", marginTop: "3px", color: style === "minimal" ? "#111827" : color }}>
              <span>TOTAL</span><span>$1.550.000</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {(form.default_notes || form.footer_text || form.legal_text) && (
          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "auto", paddingTop: "8px", fontSize: "7px", color: "#94a3b8" }}>
            {form.default_notes && <div style={{ marginBottom: "2px" }}><strong>Notas:</strong> {form.default_notes}</div>}
            {form.footer_text && <div>{form.footer_text}</div>}
            {form.legal_text && <div style={{ marginTop: "4px", fontSize: "6px", opacity: 0.7 }}>{form.legal_text}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────
export function InvoiceTemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const orgId = state.user?.organization_id;
  const { data: template, isLoading } = useInvoiceTemplate(orgId);
  const saveMutation = useSaveInvoiceTemplate();
  const [activeSection, setActiveSection] = useState<string>("appearance");

  const [form, setForm] = useState({
    logo_url: "", primary_color: "#d97706", layout_style: "modern",
    company_name: "", tax_id: "", address: "", city: "", phone: "", email: "",
    website: "", tax_regime: "no_vat_responsible", invoice_prefix: "GF",
    default_notes: "", default_terms: "", footer_text: "", legal_text: "",
  });

  useEffect(() => {
    if (template) {
      setForm({
        logo_url:       template.logo_url || "",
        primary_color:  template.primary_color || "#d97706",
        layout_style:   template.layout_style || "modern",
        company_name:   template.company_name || "",
        tax_id:         template.tax_id || "",
        address:        template.address || "",
        city:           (template as any).city || "",
        phone:          template.phone || "",
        email:          template.email || "",
        website:        (template as any).website || "",
        tax_regime:     (template as any).tax_regime || "no_vat_responsible",
        invoice_prefix: (template as any).invoice_prefix || "GF",
        default_notes:  template.default_notes || "",
        default_terms:  template.default_terms || "",
        footer_text:    template.footer_text || "",
        legal_text:     (template as any).legal_text || "",
      });
    }
  }, [template]);

  if (!orgId) return null;

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ organization_id: orgId, ...form } as any);
      toast.success("Plantilla guardada");
      onClose();
    } catch {
      toast.error("Error al guardar");
    }
  };

  const SECTIONS = [
    { id: "appearance", label: "Apariencia",       icon: Palette },
    { id: "company",    label: "Datos Empresa",    icon: Building2 },
    { id: "fiscal",     label: "Info Tributaria",  icon: Scale },
    { id: "texts",      label: "Textos",           icon: FileText },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-4 -translate-x-1/2 w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col bg-card rounded-2xl shadow-2xl z-50 border border-border/50">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <div>
              <Dialog.Title className="text-lg font-display">Diseñar Plantilla de Factura</Dialog.Title>
              <p className="text-xs text-muted-foreground mt-0.5">Los cambios se reflejan en tiempo real en la vista previa.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-primary py-2" onClick={handleSave} disabled={saveMutation.isPending}>
                <Save size={14} /> {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
              <Dialog.Close className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
                <X size={18} />
              </Dialog.Close>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center animate-pulse text-muted-foreground">Cargando plantilla...</div>
          ) : (
            <div className="flex-1 overflow-hidden flex">

              {/* Formulario */}
              <div className="w-[420px] shrink-0 flex flex-col border-r border-border">
                {/* Nav de secciones */}
                <div className="flex border-b border-border">
                  {SECTIONS.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2 ${
                          activeSection === s.id
                            ? "border-amber-500 text-amber-600"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon size={15} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Contenido de sección */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                  {activeSection === "appearance" && (
                    <>
                      <div className="form-group">
                        <label>URL del Logo</label>
                        <div className="flex gap-2 items-center mt-1">
                          <div className="h-12 w-12 shrink-0 bg-secondary rounded-lg border border-border flex items-center justify-center overflow-hidden">
                            {form.logo_url ? (
                              <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain bg-white" />
                            ) : (
                              <span className="text-xl">🏇</span>
                            )}
                          </div>
                          <input type="url" className="form-input flex-1 text-sm" placeholder="https://..." value={form.logo_url} onChange={e => set("logo_url", e.target.value)} />
                        </div>
                        <small>Enlace directo a tu imagen (PNG, SVG recomendado)</small>
                      </div>

                      <div className="form-group">
                        <label>Color Principal</label>
                        <div className="flex gap-3 items-center mt-1">
                          <input type="color" className="h-10 w-10 rounded-lg border border-border p-0.5 cursor-pointer shrink-0 bg-transparent" value={form.primary_color} onChange={e => set("primary_color", e.target.value)} />
                          <input type="text" className="form-input flex-1 text-sm font-mono" value={form.primary_color} onChange={e => set("primary_color", e.target.value)} />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Estilo de Diseño</label>
                        <div className="space-y-2 mt-1">
                          {LAYOUT_STYLES.map(ls => (
                            <button
                              key={ls.value}
                              type="button"
                              onClick={() => set("layout_style", ls.value)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors text-sm ${
                                form.layout_style === ls.value
                                  ? "border-amber-500 bg-amber-500/10"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <span className="font-medium">{ls.label}</span>
                              <span className="text-xs text-muted-foreground">{ls.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Prefijo de Numeración</label>
                        <input type="text" className="form-input text-sm" placeholder="GF" value={form.invoice_prefix} onChange={e => set("invoice_prefix", e.target.value)} />
                        <small>Las facturas se numerarán como: {form.invoice_prefix || "GF"}-2026-0001</small>
                      </div>
                    </>
                  )}

                  {activeSection === "company" && (
                    <>
                      <div className="form-group">
                        <label>Razón Social / Nombre</label>
                        <input type="text" className="form-input text-sm" value={form.company_name} onChange={e => set("company_name", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>NIT / RUT</label>
                          <input type="text" className="form-input text-sm" placeholder="000.000.000-0" value={form.tax_id} onChange={e => set("tax_id", e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Teléfono</label>
                          <input type="tel" className="form-input text-sm" value={form.phone} onChange={e => set("phone", e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Dirección</label>
                        <input type="text" className="form-input text-sm" value={form.address} onChange={e => set("address", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group">
                          <label>Ciudad</label>
                          <input type="text" className="form-input text-sm" placeholder="Bogotá" value={form.city} onChange={e => set("city", e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input type="email" className="form-input text-sm" value={form.email} onChange={e => set("email", e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Sitio Web</label>
                        <input type="url" className="form-input text-sm" placeholder="https://www.tucriadero.com" value={form.website} onChange={e => set("website", e.target.value)} />
                      </div>
                    </>
                  )}

                  {activeSection === "fiscal" && (
                    <>
                      <div className="form-group">
                        <label>Régimen Tributario</label>
                        <select className="form-input text-sm" value={form.tax_regime} onChange={e => set("tax_regime", e.target.value)}>
                          {TAX_REGIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Texto Legal (pie de página obligatorio)</label>
                        <textarea
                          className="form-input text-sm" rows={3}
                          placeholder='Ej: "Somos Grandes Contribuyentes. Autorretenedores del impuesto de renta."'
                          value={form.legal_text}
                          onChange={e => set("legal_text", e.target.value)}
                        />
                        <small>Este texto aparece en letra pequeña al pie de cada factura.</small>
                      </div>
                    </>
                  )}

                  {activeSection === "texts" && (
                    <>
                      <div className="form-group">
                        <label>Nota al Cliente (predeterminada)</label>
                        <textarea className="form-input text-sm" rows={3} placeholder="Ej: Gracias por confiar en nuestro criadero." value={form.default_notes} onChange={e => set("default_notes", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Términos y Condiciones (predeterminados)</label>
                        <textarea className="form-input text-sm" rows={3} placeholder="Ej: El pago debe realizarse en los próximos 15 días..." value={form.default_terms} onChange={e => set("default_terms", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Pie de Página</label>
                        <textarea className="form-input text-sm" rows={2} placeholder="Ej: Criadero GaitFlow — Equinos de élite desde 2010" value={form.footer_text} onChange={e => set("footer_text", e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Vista previa en tiempo real */}
              <div className="flex-1 bg-secondary/30 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border text-xs text-muted-foreground font-medium">
                  <Eye size={14} /> Vista Previa en Tiempo Real
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex justify-center">
                  <InvoicePreview form={form} />
                </div>
              </div>

            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
