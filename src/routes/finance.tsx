import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RevenueForecastCard } from "@/components/hw/HWWidgets";
import { Plus, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance — GateFlow" },
      { name: "description", content: "Invoices, expenses and predictive cash flow." },
    ],
  }),
  component: FinancePage,
});

const invoices = [
  { no: "INV-2026-0114", client: "Conti Equestrian", amount: 18500, status: "paid", due: "Mar 12" },
  { no: "INV-2026-0115", client: "Yamamoto Bloodstock", amount: 42000, status: "sent", due: "Apr 02" },
  { no: "INV-2026-0116", client: "Haras Dubois", amount: 7800, status: "overdue", due: "Feb 18" },
  { no: "INV-2026-0117", client: "Magnolia Training", amount: 11200, status: "draft", due: "—" },
  { no: "INV-2026-0118", client: "Conti Equestrian", amount: 3450, status: "paid", due: "Mar 28" },
];

const kpis = [
  { label: "Cash on hand", value: "$184,200", trend: "+8.2%", up: true },
  { label: "Revenue MTD", value: "$72,800", trend: "+14.1%", up: true },
  { label: "Outstanding A/R", value: "$31,540", trend: "-3.4%", up: true },
  { label: "Overdue", value: "$7,800", trend: "+1 invoice", up: false },
];

function FinancePage() {
  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="eyebrow">Section H · Financial Core</div>
          <h1 className="font-display text-4xl mt-1">Financial cockpit</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Invoices, expenses and Holt-Winters cash projection for the next six
            months with anomaly detection.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-secondary px-4 py-2 text-sm inline-flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </button>
          <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> New invoice
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="lux-card p-5">
            <div className="eyebrow">{k.label}</div>
            <div className="font-display text-2xl mt-2">{k.value}</div>
            <div
              className={`mt-1 inline-flex items-center gap-1 text-[12px] font-medium ${
                k.up ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {k.up ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}{" "}
              {k.trend}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <RevenueForecastCard
            series={[42, 48, 51, 47, 55, 62, 58, 64, 70, 73, 71, 78]}
            projection={[82, 88, 91, 95, 99, 104]}
            anomaly="Boarding revenue for March is 12% below seasonal trend — review Magnolia contract."
          />
        </div>
        <div className="lux-card p-5">
          <div className="eyebrow">Burn vs. revenue</div>
          <div className="mt-3 space-y-3 text-[13px]">
            {[
              { l: "Feed & bedding", v: 18500 },
              { l: "Payroll", v: 32400 },
              { l: "Vet & farrier", v: 9800 },
              { l: "Maintenance", v: 4200 },
            ].map((r) => (
              <div key={r.l}>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className="font-medium">${r.v.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--leather)]"
                    style={{ width: `${(r.v / 35000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Invoices</h2>
        <div className="lux-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] tracking-widest uppercase">
              <tr>
                <th className="text-left px-5 py-3">Number</th>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Due</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.no} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-4 font-mono text-[12px]">{i.no}</td>
                  <td className="px-5 py-4 font-medium">{i.client}</td>
                  <td className="px-5 py-4 text-right font-display text-lg">
                    ${i.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{i.due}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full border ${
                        i.status === "paid"
                          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                          : i.status === "overdue"
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : i.status === "sent"
                              ? "bg-[var(--gold)]/15 text-[var(--bronze)] border-[var(--gold)]/40"
                              : "bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {i.status}
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
