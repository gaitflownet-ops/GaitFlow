import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HeartPulse, Syringe, Wrench, Stethoscope, Calendar } from "lucide-react";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Health & care — Paddock" },
      { name: "description", content: "A simple, modern view of every horse's care." },
    ],
  }),
  component: Health,
});

const records = [
  { horse: "Northern Flame", t: "Spring vaccinations", who: "Dr. Anika Patel", at: "May 14", kind: "vac" },
  { horse: "Ember Rose", t: "Farrier — full reset", who: "Tom Beckett", at: "May 12", kind: "farrier" },
  { horse: "Midnight Oak", t: "Lameness exam — clean", who: "Dr. Rivera", at: "May 10", kind: "vet" },
  { horse: "Northern Flame", t: "Dental floating", who: "Dr. Rivera", at: "Apr 02", kind: "vet" },
  { horse: "Ember Rose", t: "Coggins · negative", who: "Dr. Anika Patel", at: "Mar 28", kind: "vac" },
  { horse: "Midnight Oak", t: "Hoof X-rays", who: "Tom Beckett + Dr. Patel", at: "Mar 12", kind: "farrier" },
];

function Health() {
  return (
    <AppShell>
      <div className="eyebrow">Wellness</div>
      <h1 className="font-display text-4xl lg:text-5xl mt-2">Health & care</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Veterinary, farrier, feeding and reproduction — gathered with calm and clarity.
      </p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "Vaccinations up to date", v: "3 / 3", i: Syringe },
          { k: "Vet visits · 30d", v: "4", i: Stethoscope },
          { k: "Farrier · 30d", v: "3", i: Wrench },
          { k: "Reminders", v: "2", i: Calendar },
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

      <h2 className="font-display text-2xl mt-12">Recent records</h2>
      <div className="mt-5 grid md:grid-cols-2 gap-4">
        {records.map((r, i) => (
          <div key={i} className="lux-card p-5 flex gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary shrink-0">
              {r.kind === "vac" && <Syringe className="h-[18px] w-[18px]" />}
              {r.kind === "vet" && <Stethoscope className="h-[18px] w-[18px]" />}
              {r.kind === "farrier" && <Wrench className="h-[18px] w-[18px]" />}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-display text-lg">{r.t}</h4>
                <span className="text-[11px] text-muted-foreground">{r.at}</span>
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                <span className="text-foreground font-medium">{r.horse}</span> · {r.who}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 lux-card p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <HeartPulse className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-xl">Upcoming reminders</h3>
            <p className="text-[13px] text-muted-foreground mt-1">Midnight Oak — Influenza booster due Friday · Ember Rose — coggins update May 26</p>
          </div>
        </div>
        <button className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium">
          + Add record
        </button>
      </div>

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}
