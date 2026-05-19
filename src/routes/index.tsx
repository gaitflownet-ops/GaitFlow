import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HorseCard } from "@/components/HorseCard";
import { horses, updates, notifications, events, images } from "@/lib/data";
import { useApp } from "@/lib/store";
import { useState } from "react";
import {
  Camera,
  Video,
  Trophy,
  HeartPulse,
  PenLine,
  Wrench,
  BellPlus,
  ArrowUpRight,
  TrendingUp,
  CalendarDays,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Play,
} from "lucide-react";
import { AddUpdateModal } from "@/components/modals/AddUpdateModal";
import { AddHealthRecordModal } from "@/components/modals/AddHealthRecordModal";
import { CompetitionDetailModal } from "@/components/modals/CompetitionDetailModal";
import { competitions } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — EquiSales" },
      {
        name: "description",
        content:
          "The premium operating system for horse owners, farms, and trainers.",
      },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { label: "Upload Photo", icon: Camera, type: "photo" as const },
  { label: "Upload Video", icon: Video, type: "video" as const },
  { label: "Add Competition", icon: Trophy, type: "competition" as const },
  { label: "Add Health Record", icon: HeartPulse, type: "health" as const },
  { label: "Add Training Note", icon: PenLine, type: "training" as const },
  { label: "Add Service", icon: Wrench, type: "service" as const },
  { label: "Add Reminder", icon: BellPlus, type: "reminder" as const },
];

function Dashboard() {
  const { state, dispatch } = useApp();
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [addHealthOpen, setAddHealthOpen] = useState(false);
  const [likedUpdates, setLikedUpdates] = useState<Set<string>>(new Set());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userName = state.user?.name?.split(" ")[0] ?? "Marisol";

  const allUpdates = state.updates;

  const handleLike = (id: string) => {
    setLikedUpdates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQuickAction = (type: string) => {
    if (type === "health") {
      setAddHealthOpen(true);
    } else {
      dispatch({ type: "SET_QUICK_ACTION", open: true });
    }
  };

  const handleNotifClick = (id: string, horseId?: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", id });
  };

  return (
    <AppShell>
      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border animate-fade-up">
        <img
          src={images.hero}
          alt="Stable at dawn"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.18_0.018_60/0.85)] via-[oklch(0.22_0.04_155/0.55)] to-transparent" />
        <div className="relative p-8 lg:p-14 text-primary-foreground">
          <div className="eyebrow !text-primary-foreground/70">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
          <h1 className="font-display text-4xl lg:text-6xl mt-3 max-w-2xl leading-[1.02]">
            {greeting}, {userName}.
            <span className="block gold-text">Your barn is having a beautiful morning.</span>
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/80 text-[15px]">
            Three horses in work, one champion overnight, and two updates from your team waiting for
            you.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            {[
              { k: "Horses", v: "3", s: "in your barn" },
              { k: "Win rate", v: "68%", s: "this season" },
              { k: "Updates", v: `${allUpdates.length}`, s: "this week" },
              { k: "Earnings", v: "$71.5k", s: "season-to-date" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-2xl bg-background/10 backdrop-blur-md border border-primary-foreground/15 p-4"
              >
                <div className="text-[10px] tracking-[0.18em] uppercase text-primary-foreground/60">
                  {s.k}
                </div>
                <div className="font-display text-2xl mt-1">{s.v}</div>
                <div className="text-[11px] text-primary-foreground/70">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-10 animate-fade-up-delay-1">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="eyebrow">Quick actions</div>
            <h2 className="font-display text-2xl mt-1">Everything in under 15 seconds</h2>
          </div>
          <span className="text-xs text-muted-foreground hidden md:block">
            Tap to capture · sync to the horse
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickActions.map(({ label, icon: Icon, type }) => (
            <button
              key={label}
              id={`dashboard-quick-${type}`}
              onClick={() => handleQuickAction(type)}
              className="lux-card p-4 text-left flex flex-col gap-3 hover:-translate-y-0.5 transition-transform active:scale-95"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[13px] font-medium leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Horses */}
      <section className="mt-12 animate-fade-up-delay-2">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="eyebrow">Your horses</div>
            <h2 className="font-display text-3xl mt-1">The barn</h2>
          </div>
          <Link
            to="/horses"
            id="dashboard-view-all-horses"
            className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {horses.map((h) => (
            <HorseCard key={h.id} horse={h} />
          ))}
        </div>
      </section>

      {/* Timeline + side rail */}
      <section className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <div className="eyebrow">Today across the barn</div>
              <h2 className="font-display text-3xl mt-1">Timeline</h2>
            </div>
            <button
              id="dashboard-add-update"
              onClick={() => setAddUpdateOpen(true)}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              + Add update
            </button>
          </div>
          <ol className="relative space-y-5 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {allUpdates.map((u) => (
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
                  <p className="mt-1.5 text-[14px] text-muted-foreground leading-relaxed">
                    {u.body}
                  </p>
                  {u.media && (
                    <div className="mt-4 overflow-hidden rounded-xl aspect-[16/8] relative group cursor-pointer">
                      <img
                        src={u.media}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {u.type === "media" && (
                        <span className="absolute inset-0 grid place-items-center bg-black/10">
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
                      <button
                        id={`like-${u.id}`}
                        onClick={() => handleLike(u.id)}
                        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${likedUpdates.has(u.id) ? "text-destructive" : ""}`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${likedUpdates.has(u.id) ? "fill-current" : ""}`} />
                        {(u.likes ?? 0) + (likedUpdates.has(u.id) ? 1 : 0)}
                      </button>
                      <button
                        id={`comment-${u.id}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {u.comments ?? 0}
                      </button>
                      <button id={`share-${u.id}`} className="hover:text-foreground">
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        to="/horses/$horseId"
                        params={{ horseId: u.horseId }}
                        className="text-primary hover:underline"
                        id={`timeline-view-horse-${u.id}`}
                      >
                        View horse →
                      </Link>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-8">
          {/* Notifications */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-display text-xl">Concierge</h3>
              <Link to="/notifications" className="text-[11px] text-primary hover:underline" id="concierge-view-all">
                View all
              </Link>
            </div>
            <div className="lux-card divide-y divide-border">
              {state.notifications.slice(0, 4).map((n) => (
                <button
                  key={n.id}
                  id={`dashboard-notif-${n.id}`}
                  onClick={() => handleNotifClick(n.id, n.horseId)}
                  className={`w-full text-left p-4 flex gap-3 hover:bg-secondary/40 transition-colors ${!n.read ? "bg-primary/[0.03]" : ""}`}
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      n.kind === "win"
                        ? "bg-[var(--gold)]"
                        : n.kind === "media"
                          ? "bg-[var(--bronze)]"
                          : n.kind === "health"
                            ? "bg-destructive"
                            : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className={`text-[13px] leading-tight ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1.5">{n.at}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-display text-xl">Upcoming</h3>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {events.map((e) => (
                <Link
                  key={e.id}
                  to="/horses/$horseId"
                  params={{ horseId: e.horseId }}
                  id={`event-${e.id}`}
                  className="lux-card p-4 flex gap-4 hover:-translate-y-0.5 transition-transform block"
                >
                  <div className="grid place-items-center w-14 shrink-0 rounded-xl bg-secondary text-center py-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {e.date.split(" ")[0]}
                    </div>
                    <div className="font-display text-2xl leading-none">{e.date.split(" ")[1]}</div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug">{e.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {e.time} · {e.where}
                    </p>
                    <p className="text-[11px] text-primary mt-1.5 inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {e.horse}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <footer className="mt-20 hairline pt-6 pb-24 lg:pb-6 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>EquiSales · Premium Equine Platform</span>
        <span className="tracking-[0.2em] uppercase">v2.0 · Prototype</span>
      </footer>

      <AddUpdateModal open={addUpdateOpen} onClose={() => setAddUpdateOpen(false)} />
      <AddHealthRecordModal open={addHealthOpen} onClose={() => setAddHealthOpen(false)} />
    </AppShell>
  );
}
