import { Modal } from "./Modal";
import { FileText, Download, ShieldCheck, ShieldAlert, Shield, Clock, Upload, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Database } from "@/lib/supabase.types";
import { useVerifyDocument, useDeleteDocument } from "@/lib/hooks/useVault";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

type Props = {
  open: boolean;
  onClose: () => void;
  document: DocumentRow | null;
  onUploadNewVersion?: (doc: DocumentRow) => void;
};

export function DocumentDetailsModal({ open, onClose, document, onUploadNewVersion }: Props) {
  const verifyDoc = useVerifyDocument();
  const deleteDoc = useDeleteDocument();

  if (!document) return null;

  const handleDownload = () => {
    window.open(document.file_url, "_blank");
  };

  const handleVerify = async (status: "Revisado" | "No válido" | "Pendiente") => {
    await verifyDoc.mutateAsync({ id: document.id, status });
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar este documento permanentemente?")) {
      await deleteDoc.mutateAsync(document);
      onClose();
    }
  };

  const sizeMB = document.file_size ? (parseInt(document.file_size) / 1024 / 1024).toFixed(2) : "0";

  return (
    <Modal open={open} onClose={onClose} title="Detalles del Documento" size="lg">
      <div className="p-7">
        
        {/* Header Info */}
        <div className="flex items-start gap-4 mb-8">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl truncate">{document.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {document.type} · Versión {document.version} · {sizeMB} MB
            </p>
          </div>
          <button 
            onClick={handleDownload}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary hover:bg-primary/20 text-primary transition-colors shrink-0"
            title="Descargar"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {/* Status & Verification */}
        <div className="bg-secondary/40 border border-border rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estado de Verificación</h4>
            <div className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${
              document.verified === "Revisado" ? "bg-green-500/10 text-green-600" :
              document.verified === "No válido" ? "bg-destructive/10 text-destructive" :
              "bg-amber-500/10 text-amber-600"
            }`}>
              {document.verified === "Revisado" && <ShieldCheck className="h-3.5 w-3.5" />}
              {document.verified === "No válido" && <ShieldAlert className="h-3.5 w-3.5" />}
              {document.verified === "Pendiente" && <Shield className="h-3.5 w-3.5" />}
              {document.verified}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleVerify("Revisado")}
              disabled={verifyDoc.isPending || document.verified === "Revisado"}
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-xs font-medium hover:bg-green-500/10 hover:text-green-600 transition-colors disabled:opacity-50"
            >
              Marcar como Revisado
            </button>
            <button 
              onClick={() => handleVerify("No válido")}
              disabled={verifyDoc.isPending || document.verified === "No válido"}
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            >
              Marcar como No válido
            </button>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Fecha de Emisión</p>
            <p>{document.issue_date ? format(new Date(document.issue_date), "PP", { locale: es }) : "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Fecha de Vencimiento</p>
            <p className={document.expiration_date && new Date(document.expiration_date) < new Date() ? "text-destructive font-medium" : ""}>
              {document.expiration_date ? format(new Date(document.expiration_date), "PP", { locale: es }) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Subido el</p>
            <p>{document.created_at ? format(new Date(document.created_at), "PPp", { locale: es }) : "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Nivel de Acceso</p>
            <p className="capitalize">{document.access_level}</p>
          </div>
          
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Integridad SHA-256</p>
            <p className="font-mono text-[11px] break-all bg-secondary/50 p-2 rounded-lg border border-border">
              {document.integrity_hash || "No disponible"}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-border flex justify-between items-center">
          <button
            onClick={handleDelete}
            disabled={deleteDoc.isPending}
            className="inline-flex items-center gap-2 text-sm text-destructive hover:underline disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onClose();
                onUploadNewVersion?.(document);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 transition-opacity"
            >
              <Upload className="h-4 w-4" /> Subir Nueva Versión
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
