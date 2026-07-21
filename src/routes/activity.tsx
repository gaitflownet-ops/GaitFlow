import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useHorses } from "@/lib/hooks/useHorses";
import { useUpdates } from "@/lib/hooks/useUpdates";
import { useApp } from "@/lib/store";
import { useState } from "react";
import { Trophy, HeartPulse, PenLine, Camera, Sparkles, Heart, MessageCircle, Share2, Play, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Actividad del Criadero — GaitFlow" },
    ],
  }),
  component: ActivityPage,
});

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

function ActivityPage() {
  const { data: horses = [] } = useHorses();
  const { data: allUpdates = [], isLoading: loadingUpdates } = useUpdates();
  const [likedUpdates, setLikedUpdates] = useState<Set<string>>(new Set());

  const handleLike = (id: string) => {
    setLikedUpdates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl">Actividad del Criadero</h1>
            <p className="text-muted-foreground mt-1">Bitácora completa de operaciones y novedades.</p>
          </div>
        </div>

        {loadingUpdates ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-secondary rounded-2xl"></div>
            <div className="h-32 bg-secondary rounded-2xl"></div>
            <div className="h-32 bg-secondary rounded-2xl"></div>
          </div>
        ) : allUpdates.length === 0 ? (
          <div className="text-center py-20 lux-card">
            <p className="text-muted-foreground">Sin actividad reciente.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {allUpdates.map((update, i) => {
              const horse = horses.find((h) => h.id === update.horse_id);
              const isLiked = likedUpdates.has(update.id);
              const Icon = getUpdateIcon(update.type);

              return (
                <div
                  key={update.id}
                  className="lux-card p-6 group animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
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
                                Novedad del Criadero
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">• {update.at}</span>
                          </div>
                          <h4 className="mt-1 font-display text-xl leading-tight group-hover:text-primary transition-colors">
                            {update.title}
                          </h4>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {update.body}
                      </p>
                      {update.media_url && (
                        <div className="mt-4 overflow-hidden rounded-2xl bg-black max-h-[400px] relative cursor-pointer">
                          <img
                            src={update.media_url}
                            alt="Update media"
                            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                          />
                          {update.type === "media" && (
                            <span className="absolute inset-0 grid place-items-center bg-black/10">
                              <span className="grid h-16 w-16 place-items-center rounded-full bg-background/90 backdrop-blur shadow-lg">
                                <Play className="h-6 w-6 text-foreground ml-1" />
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-4">
                        <span>Reportado por {update.by}</span>
                        <span className="inline-flex items-center gap-4">
                          <button
                            onClick={() => handleLike(update.id)}
                            className={`inline-flex items-center gap-1.5 transition-colors ${
                              isLiked ? "text-red-500" : "hover:text-foreground"
                            }`}
                          >
                            <Heart
                              className="h-4 w-4"
                              fill={isLiked ? "currentColor" : "none"}
                            />
                            {(update.likes || 0) + (isLiked ? 1 : 0)}
                          </button>
                          <button className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            {update.comments || 0}
                          </button>
                          <button className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <Share2 className="h-4 w-4" />
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
    </AppShell>
  );
}
