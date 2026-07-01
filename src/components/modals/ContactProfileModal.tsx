import { useState } from "react";
import { Modal } from "./Modal";
import { useActivityTimeline, useHorseContacts, useCreateActivityLog, useCreateHorseContact, Contact } from "@/lib/hooks/useCRM";
import { useHorses } from "@/lib/hooks/useHorses";
import { useDocuments } from "@/lib/hooks/useVault";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { DocumentDetailsModal } from "./DocumentDetailsModal";
import { Loader2, Calendar, Activity, Link as LinkIcon, Plus, FileText, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
};

export function ContactProfileModal({ open, onClose, contact }: Props) {
  const [activeTab, setActiveTab] = useState<"timeline" | "horses" | "docs">("timeline");

  const { data: timeline = [], isLoading: loadingTimeline } = useActivityTimeline(contact?.id || undefined);
  const { data: linkedHorses = [], isLoading: loadingHorses } = useHorseContacts(contact?.id || undefined);
  const { data: allHorses = [], isLoading: loadingAllHorses } = useHorses(contact?.organization_id || undefined);
  const { data: dbDocuments = [], isLoading: loadingDocs } = useDocuments({ owner_type: "contact", owner_id: contact?.id });
  const createActivityLog = useCreateActivityLog();
  const createHorseContact = useCreateHorseContact();

  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [selectedVaultDoc, setSelectedVaultDoc] = useState<any>(null);

  const [newLogType, setNewLogType] = useState("Llamada");
  const [newLogDetails, setNewLogDetails] = useState("");

  const [newHorseId, setNewHorseId] = useState("");
  const [newRelType, setNewRelType] = useState("Propietario");

  if (!contact) return null;

  const isLoading = loadingTimeline || loadingHorses || loadingAllHorses || loadingDocs;

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogDetails) return;
    
    try {
      await createActivityLog.mutateAsync({
        organization_id: (contact as any).organization_id || "00000000-0000-0000-0000-000000000000",
        user_id: null,
        date: new Date().toISOString(),
        module_source: "crm",
        action_type: newLogType,
        action_details: newLogDetails,
        horse_id: null,
        contact_id: contact.id,
        reference_id: null,
      });
      setNewLogDetails("");
      toast.success("Actividad registrada correctamente");
    } catch (error: any) {
      console.error(error);
      toast.error("Error al registrar actividad: " + error.message);
    }
  };

  const handleLinkHorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHorseId) return;

    let category = "business";
    if (['Propietario', 'Copropietario', 'Cliente', 'Posible Cliente'].includes(newRelType)) category = "ownership";
    else if (['Veterinario'].includes(newRelType)) category = "medical";
    else if (['Herrero', 'Cuidador', 'Entrenador', 'Jinete'].includes(newRelType)) category = "management";

    try {
      await createHorseContact.mutateAsync({
        organization_id: (contact as any).organization_id || "00000000-0000-0000-0000-000000000000",
        horse_id: newHorseId,
        contact_id: contact.id,
        relationship_category: category,
        relationship_type: newRelType,
        start_date: new Date().toISOString(),
        end_date: null,
        is_active: true,
        notes: null,
      });
      setNewHorseId("");
      toast.success("Caballo vinculado correctamente");
    } catch (error: any) {
      console.error(error);
      toast.error("Error al vincular: " + error.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Perfil CRM: ${contact.name}`} size="default">
      
      <div className="px-6 pt-4 border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${activeTab === "timeline" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Historial de Interacciones
        </button>
          <button
            onClick={() => setActiveTab("horses")}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${activeTab === "horses" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Caballos Vinculados
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${activeTab === "docs" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Documentos
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto p-6">
          
          {/* TAB: TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Actividad Reciente
                </h3>
              </div>

              {/* Formulario Manual */}
              <form onSubmit={handleManualLog} className="flex gap-2 bg-secondary/20 p-3 rounded-xl border border-border">
                <select 
                  className="lux-select text-xs py-1.5 w-[110px]"
                  value={newLogType}
                  onChange={e => setNewLogType(e.target.value)}
                >
                  <option value="Llamada">Llamada</option>
                  <option value="Correo">Correo</option>
                  <option value="Reunión">Reunión</option>
                  <option value="Nota">Nota</option>
                </select>
                <input 
                  className="lux-input text-xs py-1.5 flex-1" 
                  placeholder="Detalles de la interacción..." 
                  value={newLogDetails}
                  onChange={e => setNewLogDetails(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  disabled={createActivityLog.isPending}
                  className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
                >
                  {createActivityLog.isPending ? "..." : "Guardar"}
                </button>
              </form>

              {timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm bg-secondary/20 rounded-xl border border-border border-dashed">
                  No hay interacciones registradas aún. Las acciones (citas médicas, herrajes) se registrarán aquí automáticamente.
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {timeline.map((log) => (
                    <div key={log.id} className="relative flex items-center justify-normal group is-active">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card shadow shrink-0 z-10 mr-4">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 lux-card p-3.5 rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{log.module_source}</span>
                          <time className="text-xs text-muted-foreground">{format(new Date(log.date), "dd MMM yyyy, HH:mm", { locale: es })}</time>
                        </div>
                        <div className="text-sm font-medium text-foreground">{log.action_type}</div>
                        {log.action_details && (
                          <div className="text-xs text-muted-foreground mt-1">{log.action_details}</div>
                        )}
                        {log.horses && (
                          <div className="mt-2 text-[10px] uppercase font-bold tracking-wider bg-secondary/50 inline-flex px-2 py-0.5 rounded text-foreground border border-border/50">
                            🐴 {log.horses.name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: HORSES */}
          {activeTab === "horses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" /> Relaciones Activas
                </h3>
              </div>

              {/* Formulario para Vincular Caballo */}
              <form onSubmit={handleLinkHorse} className="flex gap-2 bg-secondary/20 p-3 rounded-xl border border-border">
                <select
                  className="lux-select text-xs py-1.5 flex-1"
                  value={newHorseId}
                  onChange={e => setNewHorseId(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecciona un Caballo...</option>
                  {allHorses.map((h: any) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <select
                  className="lux-select text-xs py-1.5 w-[140px]"
                  value={newRelType}
                  onChange={e => setNewRelType(e.target.value)}
                >
                  <option value="Propietario">Propietario</option>
                  <option value="Copropietario">Copropietario</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Posible Cliente">Posible Cliente</option>
                  <option value="Veterinario">Veterinario</option>
                  <option value="Herrero">Herrero</option>
                  <option value="Cuidador">Cuidador</option>
                  <option value="Entrenador">Entrenador</option>
                  <option value="Jinete">Jinete</option>
                </select>
                <button 
                  type="submit" 
                  disabled={createHorseContact.isPending || !newHorseId}
                  className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
                >
                  {createHorseContact.isPending ? "..." : "Vincular"}
                </button>
              </form>

              {linkedHorses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm bg-secondary/20 rounded-xl border border-border border-dashed">
                  Este contacto no tiene caballos vinculados actualmente.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {linkedHorses.map(rel => (
                    <div key={rel.id} className="lux-card border border-border p-4 flex flex-col justify-between">
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <span>🐴 {rel.horses?.name}</span>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border bg-primary/10 text-primary border-primary/20">
                          {rel.relationship_type}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Desde: {format(new Date(rel.start_date), "MMM yyyy", { locale: es })}
                        </span>
                        {rel.is_active ? (
                          <span className="text-emerald-500 font-medium">Activo</span>
                        ) : (
                          <span className="text-muted-foreground">Inactivo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {activeTab === "docs" && !isLoading && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Bóveda de Documentos
            </h3>
            <button
              onClick={() => setUploadDocOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-95"
            >
              <Upload className="h-3 w-3" /> Subir
            </button>
          </div>
          
          {dbDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-secondary/20 rounded-xl border border-border border-dashed">
              No hay documentos asociados a este contacto.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {dbDocuments.map((doc: any) => (
                <div 
                  key={doc.id} 
                  onClick={() => setSelectedVaultDoc(doc)}
                  className="lux-card p-4 flex flex-col hover:border-primary/30 transition-colors cursor-pointer border border-border"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{doc.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{doc.type}</div>
                    </div>
                  </div>
                  <div className="mt-auto pt-2 border-t border-border flex justify-between items-center text-[10px] font-medium">
                    <span className={doc.verified === "Revisado" ? "text-green-600" : "text-amber-600"}>{doc.verified}</span>
                    {doc.expiration_date && (
                      <span className={new Date(doc.expiration_date) < new Date() ? 'text-destructive' : 'text-muted-foreground'}>
                        Vence: {new Date(doc.expiration_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <UploadDocumentModal open={uploadDocOpen} onClose={() => setUploadDocOpen(false)} defaultContactId={contact.id} />
      <DocumentDetailsModal open={!!selectedVaultDoc} onClose={() => setSelectedVaultDoc(null)} document={selectedVaultDoc} onUploadNewVersion={(doc) => setUploadDocOpen(true)} />
    </Modal>
  );
}
