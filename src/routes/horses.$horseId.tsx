import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { horseById, horses, updates, competitions, team, images } from "@/lib/data";
import { useState } from "react";
import {
  MapPin,
  User,
  Award,
  Trophy,
  HeartPulse,
  Video,
  Wrench,
  PenLine,
  TrendingUp,
  Play,
  Share2,
  Heart,
  ArrowLeft,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/horses/$horseId")({
  loader: ({ params }) => {
    const horse = horseById(params.horseId);
    if (!horse) throw notFound();
    return { horse };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.horse.name} — Paddock` : "Horse — Paddock" },
      { name: "description", content: loaderData?.horse.latestAchievement ?? "Horse profile" },
    ],
  }),
  component: HorseProfile,
  notFoundComponent: () => (
    <AppShell>
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl">Horse not found</h1>
        <Link to="/horses" className="mt-4 inline-block text-primary">Back to barn</Link>
      </div>
    </AppShell>
  ),
});

const tabs = ["Timeline", "Health", "Competitions", "Media", "Team", "Reproduction"] as const;
type Tab = typeof tabs[number];

function HorseProfile() {
  const { horse } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("Timeline");

  const horseUpdates = updates.filter((u) => u.horseId === horse.id);
  const horseComps = competitions.filter((c) => c.horseId === horse.id);
  const otherHorses = horses.filter((h) => h.id !== horse.id);

  return (
    <AppShell>
      <Link to="/horses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> The barn
      </Link>

      {/* HERO */}
      <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-border">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <img src={horse.image} alt={horse.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.018_60/0.92)] via-[oklch(0.18_0.018_60/0.35)] to-transparent" />

          <div className="absolute top-5 right-5 flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur text-foreground hover:bg-background">
              <Heart className="h-4 w-4" />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur text-foreground hover:bg-background">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 text-primary-foreground">
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-[var(--gold)] text-charcoal px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase font-semibold">
                {horse.status}
              </span>
              <span className="rounded-full bg-background/15 border border-primary-foreground/20 px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase">
                {horse.discipline}
              </span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">{horse.name}</h1>
            <p className="mt-3 text-primary-foreground/85 text-[15px] max-w-2xl">
              <span className="gold-text font-medium">{horse.latestAchievement}</span> · {horse.bloodline}
            </p>

            <div className="mt-7 grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-4 max-w-3xl">
              {[
                { k: "Breed", v: horse.breed },
                { k: "Age", v: `${horse.age} yrs` },
                { k: "Sex", v: horse.sex },
                { k: "Color", v: horse.color },
                { k: "Called", v: `"${horse.barnName}"` },
              ].map((s) => (
                <div key={s.k}>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/55">{s.k}</div>
                  <div className="font-display text-xl mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meta strip */}
      <div className="mt-6 lux-card p-5 flex flex-wrap gap-x-8 gap-y-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-[13px] font-semibold text-charcoal">
            MV
          </div>
          <div>
            <div className="eyebrow">Owner</div>
            <div className="text-[14px] font-medium">{horse.owner}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <User className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="eyebrow">Trainer</div>
            <div className="text-[14px] font-medium">{horse.trainer}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <MapPin className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="eyebrow">Stable</div>
            <div className="text-[14px] font-medium">{horse.location}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
            <Award className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="eyebrow">Career</div>
            <div className="text-[14px] font-medium">14 wins · $284k</div>
          </div>
        </div>
        <button className="ml-auto rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-95">
          + Add update
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-10 border-b border-border">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-3 text-[14px] whitespace-nowrap transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
                {active && <span className="absolute bottom-0 inset-x-3 h-[2px] bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {tab === "Timeline" && (
            <ol className="relative space-y-5 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {horseUpdates.length === 0 && (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              )}
              {horseUpdates.map((u) => (
                <li key={u.id} className="relative pl-12">
                  <span className="absolute left-0 top-1.5 grid h-10 w-10 place-items-center rounded-full bg-card border border-border">
                    {u.type === "competition" && <Trophy className="h-4 w-4 text-[var(--gold)]" />}
                    {u.type === "training" && <TrendingUp className="h-4 w-4 text-primary" />}
                    {u.type === "farrier" && <Wrench className="h-4 w-4 text-[var(--leather)]" />}
                    {u.type === "media" && <Video className="h-4 w-4 text-[var(--bronze)]" />}
                    {u.type === "health" && <HeartPulse className="h-4 w-4 text-destructive" />}
                    {u.type === "note" && <PenLine className="h-4 w-4 text-muted-foreground" />}
                  </span>
                  <div className="lux-card p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-xl leading-tight">{u.title}</h3>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{u.at}</span>
                    </div>
                    <p className="mt-1.5 text-[14px] text-muted-foreground leading-relaxed">{u.body}</p>
                    {u.media && (
                      <div className="mt-4 overflow-hidden rounded-xl aspect-[16/9] relative group">
                        <img src={u.media} alt="" className="h-full w-full object-cover" loading="lazy" />
                        {u.type === "media" && (
                          <span className="absolute inset-0 grid place-items-center">
                            <span className="grid h-14 w-14 place-items-center rounded-full bg-background/90 backdrop-blur">
                              <Play className="h-5 w-5 text-foreground ml-0.5" />
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
                      <span>By {u.by}</span>
                      <span className="inline-flex items-center gap-3">
                        <button className="hover:text-foreground">Like</button>
                        <button className="hover:text-foreground">Comment</button>
                        <button className="hover:text-foreground">Share</button>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {tab === "Health" && (
            <div className="space-y-4">
              {[
                { t: "Spring vaccinations", d: "EEE/WEE · West Nile · Rabies · Influenza", w: "Dr. Anika Patel", at: "May 14, 2026" },
                { t: "Dental floating", d: "Routine · no abnormalities", w: "Dr. Rivera", at: "Apr 02, 2026" },
                { t: "Coggins test", d: "Negative · valid 12 months", w: "Dr. Anika Patel", at: "Feb 11, 2026" },
                { t: "Hoof X-rays", d: "Front feet · balanced, no findings", w: "Dr. Patel + Tom Beckett", at: "Jan 22, 2026" },
              ].map((r, i) => (
                <div key={i} className="lux-card p-5 flex gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary shrink-0">
                    <HeartPulse className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="font-display text-lg">{r.t}</h4>
                      <span className="text-[11px] text-muted-foreground">{r.at}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground mt-1">{r.d}</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-2">By {r.w}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Competitions" && (
            <div className="space-y-4">
              {horseComps.length === 0 && <p className="text-sm text-muted-foreground">No competitions logged.</p>}
              {horseComps.map((c) => (
                <div key={c.id} className="lux-card overflow-hidden">
                  <div className="p-5 flex items-start gap-4">
                    <div className="grid place-items-center w-14 h-14 shrink-0 rounded-2xl bg-[var(--gradient-gold)] text-charcoal font-display text-xl">
                      {c.placement.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="font-display text-xl">{c.event}</h4>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="text-[13px] text-muted-foreground mt-1">{c.location} · {c.category}</p>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[12px]">
                        <span className="text-muted-foreground">Rider: <span className="text-foreground">{c.rider}</span></span>
                        <span className="text-muted-foreground">Prize: <span className="text-foreground">{c.prize}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Media" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[images.hero, images.chestnut, images.black, images.stable, images.farm, horse.image].map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl group">
                  <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  {i % 3 === 1 && (
                    <span className="absolute inset-0 grid place-items-center bg-black/10">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-background/90 backdrop-blur">
                        <Play className="h-4 w-4 ml-0.5" />
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "Team" && (
            <div className="grid sm:grid-cols-2 gap-3">
              {team.map((m) => (
                <div key={m.name} className="lux-card p-5 flex gap-4 items-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary font-display text-[15px]">
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-lg leading-tight">{m.name}</div>
                    <div className="text-[12px] text-muted-foreground">{m.role}</div>
                    <div className="text-[11px] text-muted-foreground/80 mt-1 truncate">{m.last}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Reproduction" && (
            <div className="lux-card p-8">
              <div className="eyebrow">Bloodline & breeding</div>
              <h3 className="font-display text-2xl mt-2">{horse.bloodline}</h3>
              <p className="text-muted-foreground text-[14px] mt-3 max-w-prose">
                {horse.sex === "Stallion"
                  ? "Available for select bookings · Spring 2027 season."
                  : horse.sex === "Mare"
                  ? "Open · no scheduled coverings this season."
                  : "Gelded · not part of the breeding program."}
              </p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { k: "Sire", v: horse.bloodline.split("×")[0]?.trim() ?? "—" },
                  { k: "Dam", v: horse.bloodline.split("×")[1]?.trim() ?? "—" },
                  { k: "Foals", v: horse.sex === "Stallion" ? "6 on the ground" : "—" },
                  { k: "Approved registries", v: horse.breed === "Hanoverian" ? "Hanoverian Verband" : "Jockey Club" },
                ].map((s) => (
                  <div key={s.k}>
                    <div className="eyebrow">{s.k}</div>
                    <div className="font-display text-lg mt-1">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="space-y-8">
          <div className="lux-card p-6 bg-gradient-to-br from-[oklch(0.22_0.04_155)] to-[oklch(0.18_0.018_60)] text-primary-foreground border-transparent">
            <div className="eyebrow !text-primary-foreground/60">Season highlight</div>
            <h3 className="font-display text-2xl mt-2 leading-tight">{horse.latestAchievement}</h3>
            <p className="text-[13px] text-primary-foreground/75 mt-3">
              A defining performance — three clean rounds across a demanding week.
            </p>
            <button className="mt-5 inline-flex items-center gap-1.5 text-[12px] text-[var(--gold)]">
              Read the recap <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <h3 className="font-display text-xl mb-4">From the team</h3>
            <div className="lux-card divide-y divide-border">
              {team.slice(0, 4).map((m) => (
                <div key={m.name} className="p-4 flex gap-3 items-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary text-[12px] font-semibold">
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.role}</div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">active</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl mb-4">Other horses</h3>
            <div className="space-y-3">
              {otherHorses.map((h) => (
                <Link
                  key={h.id}
                  to="/horses/$horseId"
                  params={{ horseId: h.id }}
                  className="lux-card p-3 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
                >
                  <img src={h.image} alt="" className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[17px] leading-tight">{h.name}</div>
                    <div className="text-[11px] text-muted-foreground">{h.discipline} · {h.status}</div>
                  </div>
                  <Sparkles className="h-4 w-4 text-[var(--gold)]" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}
