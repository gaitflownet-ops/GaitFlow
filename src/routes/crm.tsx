import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Users, Plus, Mail, Phone, Building2, Search, X, Loader2, MessageSquare, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useContacts, useCreateContact, useContactInteractions, useCreateContactInteraction } from "@/lib/hooks/useCRM";
import { Modal } from "@/components/modals/Modal";

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
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

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

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase())) ||
      c.type.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="eyebrow">Operations</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">CRM Directory</h1>
          <p className="text-muted-foreground mt-2">
            {contacts.length} contacts · Vets, trainers, buyers, farriers &amp; partners
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Contact
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {["all", "client", "buyer", "breeder", "vet", "farrier", "supplier", "partner"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-colors shrink-0 ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {t}
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
              className="lux-card p-5 hover:border-primary/30 transition-colors group flex flex-col justify-between"
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
                    <div className="text-xs text-muted-foreground capitalize">{contact.type}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {contact.notes || "No additional notes"}
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
                  {contact.type}
                </span>
                <button
                  onClick={() => setSelectedContact(contact)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Interactions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="lux-card p-10 text-center text-muted-foreground mt-6">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No contacts found.</p>
        </div>
      )}

      {/* Add Contact Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create New Contact">
        <form onSubmit={handleAddContact} className="space-y-4 p-4">
          <div>
            <label className="eyebrow block mb-1">Full Name</label>
            <input
              required
              className="lux-input"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Contact Type</label>
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
            <label className="eyebrow block mb-1">Email</label>
            <input
              type="email"
              className="lux-input"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Phone</label>
            <input
              className="lux-input"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              placeholder="+1 (555) 012-3456"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Notes</label>
            <textarea
              className="lux-input"
              rows={3}
              value={newContactNotes}
              onChange={(e) => setNewContactNotes(e.target.value)}
              placeholder="Initial details..."
            />
          </div>
          <button
            type="submit"
            disabled={createContact.isPending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-95 transition-opacity flex justify-center items-center gap-2"
          >
            {createContact.isPending ? "Creating..." : "Save Contact"}
          </button>
        </form>
      </Modal>

      {/* Interactions Slide-Over / Modal */}
      {selectedContact && (
        <ContactInteractionsModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </AppShell>
  );
}

function ContactInteractionsModal({ contact, onClose }: { contact: any; onClose: () => void }) {
  const { data: interactions = [], isLoading } = useContactInteractions(contact.id);
  const createInteraction = useCreateContactInteraction();

  const [type, setType] = useState("Note");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary) return;

    await createInteraction.mutateAsync({
      contact_id: contact.id,
      type,
      summary,
      details: details || null,
      date: new Date().toISOString(),
    });

    setSummary("");
    setDetails("");
  };

  return (
    <Modal open={true} onClose={onClose} title={`Interaction History — ${contact.name}`} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        {/* History timeline */}
        <div>
          <h3 className="font-display text-lg mb-4">Past Interactions</h3>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              No recorded interactions yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {interactions.map((i) => (
                <div key={i.id} className="p-3 bg-secondary/35 rounded-xl border border-border/40 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {i.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {i.date ? new Date(i.date).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <div className="font-medium text-foreground">{i.summary}</div>
                  {i.details && (
                    <div className="text-muted-foreground mt-1 leading-relaxed">
                      {i.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add interaction form */}
        <div className="border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6">
          <h3 className="font-display text-lg mb-4">Log New Interaction</h3>
          <form onSubmit={handleLogInteraction} className="space-y-4">
            <div>
              <label className="eyebrow block mb-1">Interaction Type</label>
              <select
                className="lux-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {["Call", "Email", "Meeting", "Note"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1">Summary</label>
              <input
                required
                className="lux-input"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Discussed pricing for horse purchase"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">Additional Details</label>
              <textarea
                className="lux-input"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Buyer requested digital radiographs..."
              />
            </div>
            <button
              type="submit"
              disabled={createInteraction.isPending}
              className="w-full bg-primary text-primary-foreground py-2 rounded-full text-xs font-semibold uppercase tracking-wider hover:opacity-95 transition-opacity"
            >
              {createInteraction.isPending ? "Logging..." : "Log Interaction"}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
