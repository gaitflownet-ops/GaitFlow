import { useState, useRef } from "react";
import { Modal } from "./Modal";
import { UploadCloud, FileText, Loader2, X, AlertCircle } from "lucide-react";
import { useUploadDocument } from "@/lib/hooks/useVault";
import { DOCUMENT_CATEGORIES, DocumentMainCategory, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/documentTypes";
import { useHorses } from "@/lib/hooks/useHorses";
import { useContacts } from "@/lib/hooks/useCRM";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultHorseId?: string;
  defaultContactId?: string;
};

export function UploadDocumentModal({ open, onClose, defaultHorseId, defaultContactId }: Props) {
  const uploadDoc = useUploadDocument();
  const { data: horses = [] } = useHorses();
  const { data: contacts = [] } = useContacts();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Registro genealógico");
  const [mainCat, setMainCat] = useState<DocumentMainCategory>("CABALLOS");
  const [ownerType, setOwnerType] = useState<string>(defaultHorseId ? "horse" : defaultContactId ? "contact" : "organization");
  const [ownerId, setOwnerId] = useState<string>(defaultHorseId || defaultContactId || "");
  const [issueDate, setIssueDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [accessLevel, setAccessLevel] = useState("private");
  const [error, setError] = useState<string | null>(null);

  const allAllowedTypes = [...ALLOWED_FILE_TYPES.documentos, ...ALLOWED_FILE_TYPES.imagenes];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError("El archivo excede el límite de 25MB.");
      return;
    }

    if (!allAllowedTypes.includes(selected.type)) {
      setError("Formato de archivo no permitido. Sube PDF, DOCX, XLSX o Imágenes.");
      return;
    }

    setFile(selected);
    if (!name) {
      setName(selected.name.replace(/\.[^/.]+$/, "")); // Quitar extensión
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Selecciona un archivo.");
      return;
    }

    try {
      await uploadDoc.mutateAsync({
        file,
        name,
        type: category,
        issue_date: issueDate || undefined,
        expiration_date: expirationDate || undefined,
        access_level: accessLevel,
        owner_type: ownerType,
        owner_id: ownerId || undefined,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || "Error al subir el documento.");
    }
  };

  const handleClose = () => {
    setFile(null);
    setName("");
    setIssueDate("");
    setExpirationDate("");
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Subir Documento" size="lg">
      <form onSubmit={handleSubmit} className="p-7">
        
        {/* File Drop / Select */}
        {!file ? (
          <div 
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-secondary/30 transition-colors cursor-pointer mb-6"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-10 w-10 text-primary opacity-80 mb-3" />
            <h3 className="font-semibold text-lg">Haz clic o arrastra un archivo</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              PDF, DOCX, XLSX, PNG, JPG hasta 25MB
            </p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept={allAllowedTypes.join(",")} 
              onChange={handleFileChange} 
            />
          </div>
        ) : (
          <div className="bg-secondary/40 border border-border rounded-xl p-4 flex items-center gap-4 mb-6">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              type="button" 
              onClick={() => setFile(null)}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre del Documento</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Registro Genealógico Carbonero"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría Principal</label>
            <select
              value={mainCat}
              onChange={(e) => {
                const val = e.target.value as DocumentMainCategory;
                setMainCat(val);
                setCategory(DOCUMENT_CATEGORIES[val][0]);
              }}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {Object.keys(DOCUMENT_CATEGORIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Documento</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {DOCUMENT_CATEGORIES[mainCat].map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asociar a</label>
            <select
              value={ownerType}
              onChange={(e) => {
                setOwnerType(e.target.value);
                setOwnerId("");
              }}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="organization">General (Criadero)</option>
              <option value="horse">Caballo</option>
              <option value="contact">Contacto (CRM)</option>
            </select>
          </div>

          {ownerType === "horse" && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caballo</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Selecciona un caballo...</option>
                {horses.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {ownerType === "contact" && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contacto</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Selecciona un contacto...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha de Emisión (Opcional)</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha de Vencimiento (Opcional)</label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={uploadDoc.isPending || !file}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {uploadDoc.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Subir Documento
          </button>
        </div>
      </form>
    </Modal>
  );
}
