import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { HorseCard } from "@/components/HorseCard";
import { useApp } from "@/lib/store";
import { useState } from "react";
import { useHorses } from "@/lib/hooks/useHorses";
import { useUpdates } from "@/lib/hooks/useUpdates";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
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
import { AddCompetitionModal } from "@/components/modals/AddCompetitionModal";
import {
  PriceForecastCard,
  SeasonalRiskBar,
  FeedRestockAlert,
  RevenueForecastCard,
  GestationProbability,
} from "@/components/hw/HWWidgets";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EquiSales" },
      {
        name: "description",
        content: "The premium operating system for horse owners, farms, and trainers.",
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

function getUpdateIcon(type: string) {
  switch (type) {
    case "competition":
      return Trophy;
    case "health":
    case "farrier":
    case "vet":
    case "dental":
      return HeartPulse;
    case "training":
    case "note":
      return PenLine;
    case "media":
      return Camera;
    default:
      return Sparkles;
  }
}

function Dashboard() {
  const { state, dispatch } = useApp();
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [addHealthOpen, setAddHealthOpen] = useState(false);
  const [addCompetitionOpen, setAddCompetitionOpen] = useState(false);
  const [likedUpdates, setLikedUpdates] = useState<Set<string>>(new Set());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userName = state.user?.name?.split(" ")[0] ?? "User";

  const { data: horses = [], isLoading: loadingHorses } = useHorses();
  const { data: allUpdates = [], isLoading: loadingUpdates } = useUpdates();
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();

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
    } else if (type === "competition") {
      setAddCompetitionOpen(true);
    } else {
      dispatch({ type: "SET_QUICK_ACTION", open: true });
    }
  };

  return (
    <AppShell>
      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border animate-fade-up">
        <img
          src="https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80"
          alt="Stable at dawn"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.18_0.018_60/0.85)] via-[oklch(0.22_0.04_155/0.55)] to-transparent" />
        <div className="relative p-8 lg:p-14 text-primary-foreground">
          <div className="eyebrow !text-primary-foreground/70">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <h1 className="font-display text-4xl lg:text-6xl mt-3 max-w-2xl leading-[1.02]">
            {greeting}, {userName}.
            <span className="block gold-text">Your barn is having a beautiful morning.</span>
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/80 text-[15px]">
            {loadingHorses ? "..." : horses.length} horses in work, one champion overnight, and{" "}
            {loadingMetrics ? "..." : (metrics?.weeklyUpdates ?? allUpdates.length)} updates from
            your team waiting for you.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            {[
              {
                k: "Horses",
                v: loadingMetrics ? "..." : (metrics?.horseCount ?? horses.length).toString(),
                s: "in your barn",
              },
              {
                k: "Win rate",
                v: loadingMetrics ? "..." : `${metrics?.winRate ?? 0}%`,
                s: `${metrics?.wins ?? 0} wins this season`,
              },
              {
                k: "Updates",
                v: loadingMetrics ? "..." : (metrics?.weeklyUpdates ?? 0).toString(),
                s: "this week",
              },
              {
                k: "Earnings",
                v: loadingMetrics ? "..." : `$${(metrics?.seasonEarnings ?? 0).toLocaleString()}`,
                s: "season-to-date",
              },
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
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[13px] font-medium leading-tight text-foreground/90">
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Your Horses */}
      <section className="mt-16 animate-fade-up-delay-2">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-3xl">Your string</h2>
          <Link
            to="/horses"
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingHorses ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-[400px] bg-secondary rounded-[2rem]"></div>
            <div className="h-[400px] bg-secondary rounded-[2rem]"></div>
            <div className="h-[400px] bg-secondary rounded-[2rem]"></div>
          </div>
        ) : horses.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-[2rem] border border-border">
            <h3 className="font-display text-2xl">No horses yet</h3>
            <p className="text-muted-foreground mt-2">
              Add your first horse to start managing your stable.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {horses.map((h, i) => (
              <div
                key={h.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <HorseCard horse={h} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Timeline + side rail */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl">Barn timeline</h2>
          </div>

          {loadingUpdates ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-secondary rounded-2xl"></div>
              <div className="h-32 bg-secondary rounded-2xl"></div>
            </div>
          ) : allUpdates.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No recent activity.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allUpdates.map((update, i) => {
                const horse = horses.find((h) => h.id === update.horse_id);
                const isLiked = likedUpdates.has(update.id);
                const Icon = getUpdateIcon(update.type);

                return (
                  <div
                    key={update.id}
                    className="lux-card p-5 group animate-fade-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground border border-border/50 shadow-sm group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              {horse ? (
                                <Link
                                  to="/horses/$horseId"
                                  params={{ horseId: horse.slug || horse.id }}
                                  className="text-[13px] font-semibold text-primary hover:underline uppercase tracking-widest"
                                >
                                  {horse.name}
                                </Link>
                              ) : (
                                <span className="text-[13px] font-semibold text-primary uppercase tracking-widest">
                                  Stable Update
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">• {update.at}</span>
                            </div>
                            <h4 className="mt-1 font-display text-lg leading-tight group-hover:text-primary transition-colors">
                              {update.title}
                            </h4>
                          </div>
                        </div>
                        <p className="mt-1.5 text-[14px] text-muted-foreground leading-relaxed">
                          {update.body}
                        </p>
                        {update.media_url && (
                          <div className="mt-4 overflow-hidden rounded-xl bg-black max-h-[300px] relative cursor-pointer">
                            <img
                              src={update.media_url}
                              alt="Update media"
                              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                            />
                            {update.type === "media" && (
                              <span className="absolute inset-0 grid place-items-center bg-black/10">
                                <span className="grid h-14 w-14 place-items-center rounded-full bg-background/90 backdrop-blur">
                                  <Play className="h-5 w-5 text-foreground ml-0.5" />
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
                          <span>By {update.by}</span>
                          <span className="inline-flex items-center gap-3">
                            <button
                              onClick={() => handleLike(update.id)}
                              className={`inline-flex items-center gap-1.5 transition-colors ${
                                isLiked ? "text-red-500" : "hover:text-foreground"
                              }`}
                            >
                              <Heart
                                className="h-3.5 w-3.5"
                                fill={isLiked ? "currentColor" : "none"}
                              />
                              {(update.likes || 0) + (isLiked ? 1 : 0)}
                            </button>
                            <button className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {update.comments || 0}
                            </button>
                            <button className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side rail widgets */}
        <div className="space-y-6 lg:mt-14">
          <div className="lux-card p-6 bg-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">Upcoming</h3>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">Feature coming soon.</div>
          </div>
        </div>
      </div>

      <AddUpdateModal open={addUpdateOpen} onOpenChange={setAddUpdateOpen} />
      <AddHealthRecordModal open={addHealthOpen} onOpenChange={setAddHealthOpen} />
      <AddCompetitionModal open={addCompetitionOpen} onOpenChange={setAddCompetitionOpen} />
    </AppShell>
  );
}
