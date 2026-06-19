import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus, Mail, Phone, Tag } from "lucide-react";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "CRM — GaitFlow" },
      { name: "description", content: "Owners, buyers, vets and suppliers in one directory." },
    ],
  }),
  component: CRMPage,
});

const contacts = [
  {
    name: "Alessandra Conti",
    role: "Buyer",
    company: "Conti Equestrian",
    tag: "Hot lead",
    email: "ac@conti.eq",
    phone: "+1 352 555 0117",
  },
  {
    name: "Dr. Aman Patel",
    role: "Veterinarian",
    company: "Ocala Equine Hosp.",
    tag: "Vendor",
    email: "patel@oeh.com",
    phone: "+1 352 555 0192",
  },
  {
    name: "Hiroshi Yamamoto",
    role: "Owner",
    company: "Yamamoto Bloodstock",
    tag: "Client",
    email: "hy@yb.jp",
    phone: "+81 90 4400 8821",
  },
  {
    name: "Marie Dubois",
    role: "Buyer",
    company: "Haras Dubois",
    tag: "Warm lead",
    email: "marie@haras.fr",
    phone: "+33 6 14 22 88 12",
  },
  {
    name: "Tom Hartwell",
    role: "Farrier",
    company: "Hartwell Hoof Care",
    tag: "Vendor",
    email: "tom@hhc.us",
    phone: "+1 352 555 0044",
  },
];

const stages = ["New", "Qualified", "Demo", "Negotiation", "Closed"];

function CRMPage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="eyebrow">Section G.1 · CRM</div>
          <h1 className="font-display text-4xl mt-1">Relationships pipeline</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Owners, buyers, vets, farriers and suppliers — every contact tied to the horses and
            invoices they touch.
          </p>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New contact
        </button>
      </div>

      {/* Pipeline */}
      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">Sales pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stages.map((s, i) => (
            <div key={s} className="lux-card p-5">
              <div className="eyebrow">{s}</div>
              <div className="font-display text-3xl mt-2">{[12, 7, 4, 2, 3][i]}</div>
              <div className="text-[11px] text-muted-foreground mt-1">deals</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section>
        <h2 className="font-display text-2xl mb-4">Directory</h2>
        <div className="lux-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] tracking-widest uppercase">
              <tr>
                <th className="text-left px-5 py-3">Contact</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Tag</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.name} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-4">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.company}</div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{c.role}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-[11px] bg-[var(--gold)]/15 text-[var(--bronze)] border border-[var(--gold)]/40 px-2.5 py-0.5 rounded-full">
                      <Tag className="h-3 w-3" /> {c.tag}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {c.email}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
