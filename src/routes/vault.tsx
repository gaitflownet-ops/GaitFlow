import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FileText, Upload, Download, Search, FolderOpen, ShieldCheck, ShieldAlert, Shield, Clock } from "lucide-react";
import { useDocuments } from "@/lib/hooks/useVault";
import { UploadDocumentModal } from "@/components/modals/UploadDocumentModal";
import { DocumentDetailsModal } from "@/components/modals/DocumentDetailsModal";
import type { Database } from "@/lib/supabase.types";
import { DOCUMENT_CATEGORIES } from "@/lib/documentTypes";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [{ title: "Bóveda de Documentos — GaitFlow" }],
  }),
  component: VaultPage,
});

const getStatusColor = (status: string | null) => {
  if (status === "Revisado") return "text-green-500 bg-green-500/10";
  if (status === "No válido") return "text-destructive bg-destructive/10";
  return "text-amber-500 bg-amber-500/10";
};

const getStatusIcon = (status: string | null) => {
  if (status === "Revisado") return <ShieldCheck className="h-3 w-3" />;
  if (status === "No válido") return <ShieldAlert className="h-3 w-3" />;
  return <Shield className="h-3 w-3" />;
};

function VaultPage() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  
  const { data: documents = [], isLoading } = useDocuments();
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);

  // Derivar categorías principales disponibles
  const categories = ["Todas", ...Object.keys(DOCUMENT_CATEGORIES)];

  const filtered = documents.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    
    let matchCat = true;
    if (filterCat !== "Todas") {
      // Revisa si el tipo del documento pertenece a la categoría principal seleccionada
      const validTypes = DOCUMENT_CATEGORIES[filterCat as keyof typeof DOCUMENT_CATEGORIES] || [];
      matchCat = (validTypes as string[]).includes(d.type);
    }

    return matchSearch && matchCat;
  });

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow">Operaciones</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Bóveda Documental</h1>
          <p className="text-muted-foreground mt-2">
            Centro de gestión inteligente para registros, contratos y sanidad.
          </p>
        </div>
        <button 
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-[var(--shadow-soft)] hover:opacity-95 transition-opacity"
        >
          <Upload className="h-4 w-4" /> Subir Documento
        </button>
      </div>

      {/* Alertas Administrativas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="lux-card p-5 bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <FileText className="h-20 w-20" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Documentos</p>
          <p className="text-3xl font-display mt-2">{documents.length}</p>
        </div>
        <div className="lux-card p-5 bg-card relative overflow-hidden border-l-4 border-l-amber-500">
          <p className="text-sm font-medium text-muted-foreground">Pendientes de Revisión</p>
          <p className="text-3xl font-display mt-2">{documents.filter(d => d.verified === "Pendiente").length}</p>
        </div>
        <div className="lux-card p-5 bg-card relative overflow-hidden border-l-4 border-l-destructive">
          <p className="text-sm font-medium text-muted-foreground">Vencidos o Próximos</p>
          <p className="text-3xl font-display mt-2">
            {documents.filter(d => {
              if (!d.expiration_date) return false;
              const diff = new Date(d.expiration_date).getTime() - new Date().getTime();
              return diff < 15 * 24 * 60 * 60 * 1000; // Menos de 15 días o vencido
            }).length}
          </p>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 md:pb-0 md:mb-0 hide-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Documentos */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><Clock className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="lux-card p-16 text-center text-muted-foreground mt-4">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-display text-foreground mb-1">Sin documentos</p>
          <p className="text-sm">No se encontraron documentos en esta vista. Sube uno nuevo para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc);
                setDetailsOpen(true);
              }}
              className="lux-card p-5 group hover:border-primary/30 transition-colors cursor-pointer flex flex-col h-full relative overflow-hidden"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight truncate pr-4">{doc.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{doc.type}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(doc.verified)}`}>
                  {getStatusIcon(doc.verified)}
                  {doc.verified}
                </div>
                {doc.expiration_date && (
                  <div className={`text-[11px] font-medium ${new Date(doc.expiration_date) < new Date() ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Vence: {format(new Date(doc.expiration_date), "MMM d, yyyy", { locale: es })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadDocumentModal 
        open={uploadOpen} 
        onClose={() => setUploadOpen(false)} 
      />
      <DocumentDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        document={selectedDoc}
        onUploadNewVersion={(doc) => {
          // En un sistema completo, el modal de subida soportaría un "previous_version_id"
          // Por ahora solo abrimos el de subida normal (se puede mejorar)
          setUploadOpen(true);
        }}
      />
    </AppShell>
  );
}
