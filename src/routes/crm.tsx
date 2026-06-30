import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Users, Plus, Mail, Phone, Building2, Search, X, Loader2, MessageSquare, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useContacts, useCreateContact, useContactInteractions, useCreateContactInteraction, Contact } from "@/lib/hooks/useCRM";
import { Modal } from "@/components/modals/Modal";
import { ContactProfileModal } from "@/components/modals/ContactProfileModal";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [{ title: "CRM — GaitFlow" }],
  }),
  component: CRMPage,
});

const tagColors: Record<string, string> = {
  client: "bg-blue-500/10 text-blue-500",
  buyer: "bg-purple-500/10 text-purple-500",
  breeder: "bg-emerald-500/10 text-emerald-500",
  vet: "bg-amber-500/10 text-amber-500",
  farrier: "bg-orange-500/10 text-orange-500",
  supplier: "bg-rose-500/10 text-rose-500",
  partner: "bg-primary/10 text-primary",
};

function CRMPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactType, setNewContactType] = useState("client");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactNotes, setNewContactNotes] = useState("");

  // Hook calls
  const { data: contacts = [], isLoading } = useContacts(typeFilter);
  const createContact = useCreateContact();

  const TRANSLATIONS: Record<string, string> = {
    all: "TODOS",
    client: "CLIENTE",
    buyer: "COMPRADOR",
    breeder: "CRIADOR",
    vet: "VETERINARIO",
    farrier: "HERRERO",
    supplier: "PROVEEDOR",
    partner: "ALIADO",
  };

  const getContactTypeTranslation = (type: string) => {
    const map: Record<string, string> = {
      client: "Cliente",
      buyer: "Comprador",
      breeder: "Criador",
      vet: "Veterinario",
      farrier: "Herrero",
      supplier: "Proveedor",
      partner: "Aliado",
    };
    return map[type] || type;
  };

  const filtered = contacts.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContact.mutateAsync({
      name: newContactName,
      type: newContactType,
      email: newContactEmail || null,
      phone: newContactPhone || null,
      notes: newContactNotes || null,
    });
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactNotes("");
    setAddOpen(false);
  };

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Operaciones</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Directorio CRM</h1>
          <p className="text-muted-foreground mt-2">
            {contacts.length} contactos · Veterinarios, clientes, herreros y aliados
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Añadir Contacto
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar contactos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {TRANSLATIONS.all}
          </button>
          {["client", "buyer", "breeder", "vet", "farrier", "supplier", "partner"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {TRANSLATIONS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Contact grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="lux-card p-5 hover:border-primary/50 transition-colors group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-display text-xl shrink-0">
                    {contact.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{contact.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{getContactTypeTranslation(contact.type)}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {contact.notes || "Sin notas adicionales"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${tagColors[contact.type] ?? "bg-secondary text-foreground"}`}
                >
                  {getContactTypeTranslation(contact.type)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedContact(contact);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Ver Perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="lux-card p-10 text-center text-muted-foreground mt-6">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No se encontraron contactos.</p>
        </div>
      )}

      <ContactProfileModal 
        open={!!selectedContact} 
        onClose={() => setSelectedContact(null)} 
        contact={selectedContact} 
      />

      {/* Add Contact Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo Contacto">
        <form onSubmit={handleAddContact} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Nombre Completo</label>
            <input
              required
              className="lux-input"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Ej. Dr. Carlos Pérez"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Tipo de Contacto</label>
            <select
              className="lux-select"
              value={newContactType}
              onChange={(e) => setNewContactType(e.target.value)}
            >
              {["client", "buyer", "breeder", "vet", "farrier", "supplier", "partner"].map((t) => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1">Correo Electrónico</label>
            <input
              type="email"
              className="lux-input"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              placeholder="carlos@ejemplo.com"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Teléfono</label>
            <input
              className="lux-input"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              placeholder="+57 300 000 0000"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Notas Adicionales</label>
            <textarea
              className="lux-input"
              rows={3}
              value={newContactNotes}
              onChange={(e) => setNewContactNotes(e.target.value)}
              placeholder="Detalles sobre el contacto..."
            />
          </div>
          <button
            type="submit"
            disabled={createContact.isPending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity flex justify-center items-center gap-2"
          >
            {createContact.isPending ? "Guardando..." : "Guardar Contacto"}
          </button>
        </form>
      </Modal>

    </AppShell>
  );
}
