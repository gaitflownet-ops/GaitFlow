import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FolderLock, FileText, ShieldCheck, AlertTriangle, Upload } from "lucide-react";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Document Vault — GateFlow" },
      { name: "description", content: "Secure vault for contracts, passports and registries." },
    ],
  }),
  component: DocumentsPage,
});

const categories = [
  { name: "Passports & Registries", count: 24, icon: ShieldCheck },
  { name: "Sale Contracts", count: 11, icon: FileText },
  { name: "Vet Certificates", count: 38, icon: FileText },
  { name: "Insurance & Liability", count: 9, icon: FolderLock },
];

const docs = [
  { name: "Northern_Flame_USEF_Passport.pdf", owner: "Northern Flame", category: "Passport", expires: "Mar 2027", status: "valid" },
  { name: "Coggins_Test_Royal_Cadence.pdf", owner: "Royal Cadence", category: "Vet", expires: "Jul 2026", status: "warning" },
  { name: "Bill_of_Sale_Madeira_2024.pdf", owner: "Madeira", category: "Contract", expires: "—", status: "valid" },
  { name: "Insurance_Policy_LiveOak.pdf", owner: "Live Oak Stables", category: "Insurance", expires: "Jan 2026", status: "expired" },
  { name: "Stallion_Service_Contract_Vega.pdf", owner: "Vega Bloodstock", category: "Contract", expires: "Dec 2026", status: "valid" },
];

function DocumentsPage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="eyebrow">Section G.2 · Document Vault</div>
          <h1 className="font-display text-4xl mt-1">Encrypted document vault</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Passports, registries, contracts and insurance with expiration tracking
            and role-based access.
          </p>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {categories.map(({ name, count, icon: Icon }) => (
          <div key={name} className="lux-card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary mb-3">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="font-display text-2xl">{count}</div>
            <div className="text-[12px] text-muted-foreground">{name}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Recent documents</h2>
        <div className="lux-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] tracking-widest uppercase">
              <tr>
                <th className="text-left px-5 py-3">File</th>
                <th className="text-left px-5 py-3">Linked to</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Expires</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.name} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-4 font-medium inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" /> {d.name}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{d.owner}</td>
                  <td className="px-5 py-4 text-muted-foreground">{d.category}</td>
                  <td className="px-5 py-4 text-muted-foreground">{d.expires}</td>
                  <td className="px-5 py-4">
                    {d.status === "valid" && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> Valid
                      </span>
                    )}
                    {d.status === "warning" && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-[var(--gold)]/15 text-[var(--bronze)] border border-[var(--gold)]/40 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Renewing
                      </span>
                    )}
                    {d.status === "expired" && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-destructive/15 text-destructive border border-destructive/30 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Expired
                      </span>
                    )}
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
