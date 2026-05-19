import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { healthRecords } from "@/lib/data";
import { useState } from "react";
import { HeartPulse, Syringe, Wrench, Stethoscope, Calendar, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { AddHealthRecordModal } from "@/components/modals/AddHealthRecordModal";
import type { HealthRecord } from "@/lib/data";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health & Care — EquiSales" },
      { name: "description", content: "Veterinary, farrier, and wellness records for your horses." },
    ],
  }),
  component: Health,
});

const typeIcon: Record<HealthRecord["type"], React.ElementType> = {
  vaccination: Syringe,
  vet: Stethoscope,
  farrier: Wrench,
  dental: Stethoscope,
  coggins: HeartPulse,
  xray: HeartPulse,
};

const statusColor: Record<HealthRecord["status"], string> = {
  clear: "text-primary bg-primary/10",
  requires_followup: "text-destructive bg-destructive/10",
  pending: "text-[var(--bronze)] bg-[var(--bronze)]/10",
};

function Health() {
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const requiresFollowup = healthRecords.filter((r) => r.status === "requires_followup");
  const upToDate = healthRecords.filter((r) => r.status === "clear").length;

  return (
    <AppShell>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Wellness</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Health & care</h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-[15px]">
            Veterinary, farrier, feeding and reproduction — gathered with calm and clarity.
          </p>
        </div>
        <button
          id="add-health-record-btn"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Add record
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "Vaccinations up to date", v: "3 / 3", i: Syringe },
          { k: "Vet visits · 30d", v: "4", i: Stethoscope },
          { k: "Farrier · 30d", v: "3", i: Wrench },
          { k: "Reminders", v: requiresFollowup.length.toString(), i: Calendar },
        ].map(({ k, v, i: I }) => (
          <div key={k} className="lux-card p-5 flex items-start justify-between">
            <div>
              <div className="eyebrow">{k}</div>
              <div className="font-display text-3xl mt-2">{v}</div>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
              <I className="h-[18px] w-[18px]" />
            </span>
          </div>
        ))}
      </div>

      {/* Alert */}
      {requiresFollowup.length > 0 && (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-start gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive shrink-0">
            <HeartPulse className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-destructive">Action required</p>
            {requiresFollowup.map((r) => (
              <p key={r.id} className="text-[13px] text-muted-foreground mt-1">
                {r.horse} — {r.title}
              </p>
            ))}
          </div>
          <button
            id="schedule-followup-btn"
            onClick={() => setAddOpen(true)}
            className="ml-auto shrink-0 rounded-full bg-destructive text-white px-4 py-2 text-[13px] font-medium hover:opacity-95"
          >
            Schedule
          </button>
        </div>
      )}

      {/* Records */}
      <h2 className="font-display text-2xl mt-12 mb-5">All records</h2>
      <div className="space-y-3">
        {healthRecords.map((r) => {
          const Icon = typeIcon[r.type] ?? HeartPulse;
          const statusClass = statusColor[r.status];
          const isExpanded = expanded === r.id;

          return (
            <div key={r.id} className="lux-card overflow-hidden">
              <button
                id={`health-record-${r.id}`}
                onClick={() => setExpanded(isExpanded ? null : r.id)}
                className="w-full text-left p-5 flex gap-4 hover:bg-secondary/20 transition-colors"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary shrink-0">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-display text-lg">{r.title}</h4>
                    <span className="text-[11px] text-muted-foreground shrink-0">{r.date}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                    <span className="font-medium text-foreground">{r.horse}</span>
                    <span className="text-muted-foreground">{r.professional}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}>
                      {r.status === "clear" ? "Clear" : r.status === "requires_followup" ? "Follow-up needed" : "Pending"}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-border bg-secondary/10">
                  <p className="text-[14px] text-muted-foreground leading-relaxed mt-4">{r.notes}</p>
                  {r.nextDue && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[12px]">
                      <Calendar className="h-3.5 w-3.5" />
                      Next due: {r.nextDue}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddHealthRecordModal open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}
