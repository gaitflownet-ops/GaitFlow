import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Users, Plus, Mail, Phone, Building2, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [{ title: "CRM — GateFlow" }],
  }),
  component: CRMPage,
});

// Placeholder contacts (in production, fetched from Supabase)
const placeholderContacts = [
  { id: "1", name: "Dr. Elena Vasquez", role: "Veterinarian", company: "Equine Wellness Group", email: "dr.vasquez@ewg.com", phone: "+1 305 555 0101", tag: "Vet" },
  { id: "2", name: "Marcus Hoffmann", role: "Trainer", company: "Hoffmann Performance", email: "marcus@hoffmannsport.com", phone: "+1 407 555 0202", tag: "Trainer" },
  { id: "3", name: "Stephanie Lorente", role: "Buyer", company: "Lorente Stables", email: "slorente@lorentestables.es", phone: "+34 91 555 0303", tag: "Buyer" },
  { id: "4", name: "Bill Farrelly", role: "Farrier", company: "Farrelly Hoof Services", email: "bill@fhoof.com", phone: "+1 352 555 0404", tag: "Farrier" },
  { id: "5", name: "Isabella Cruz", role: "Owner", company: "Cruz Performance Horses", email: "isabella@cruzhorses.com", phone: "+1 561 555 0505", tag: "Owner" },
];

const tagColors: Record<string, string> = {
  Vet: "bg-blue-500/10 text-blue-500",
  Trainer: "bg-purple-500/10 text-purple-500",
  Buyer: "bg-emerald-500/10 text-emerald-500",
  Farrier: "bg-amber-500/10 text-amber-500",
  Owner: "bg-primary/10 text-primary",
};

function CRMPage() {
  const [search, setSearch] = useState("");
  const filtered = placeholderContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Operations</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">CRM Directory</h1>
          <p className="text-muted-foreground mt-2">
            {placeholderContacts.length} contacts · Vets, trainers, buyers, farriers &amp; partners
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity">
          <Plus className="h-4 w-4" /> Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Contact grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((contact) => (
          <div key={contact.id} className="lux-card p-5 hover:border-primary/30 transition-colors group">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-display text-xl shrink-0">
                {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{contact.name}</div>
                <div className="text-sm text-muted-foreground">{contact.role}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{contact.company}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-3.5 w-3.5" />
                {contact.email}
              </a>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-3.5 w-3.5" />
                {contact.phone}
              </a>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[contact.tag] ?? "bg-secondary text-foreground"}`}>
                {contact.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="lux-card p-10 text-center text-muted-foreground mt-6">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No contacts found for "{search}".</p>
        </div>
      )}
    </AppShell>
  );
}
