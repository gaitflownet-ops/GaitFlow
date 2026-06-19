import { useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Bell, Trophy, Video, HeartPulse, Wrench, BellOff, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
};

const kindIcon = {
  win: Trophy,
  media: Video,
  health: HeartPulse,
  service: Wrench,
  reminder: Bell,
};

const kindColor = {
  win: "bg-[var(--gold)]",
  media: "bg-[var(--bronze)]",
  health: "bg-destructive",
  service: "bg-[var(--leather)]",
  reminder: "bg-primary",
};

export function NotificationDropdown({ open, onClose }: Props) {
  const { state, dispatch, unreadCount } = useApp();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleNotifClick = async (id: string, horseId?: string | null) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", id });
    onClose();
    // Update Supabase in the background
    await (supabase.from("notifications") as any).update({ read: true }).eq("id", id);
    if (horseId) {
      navigate({ to: "/horses/$horseId", params: { horseId } });
    }
  };

  const markAll = async () => {
    dispatch({ type: "MARK_ALL_READ" });
    if (state.user) {
      await (supabase.from("notifications") as any)
        .update({ read: true })
        .eq("user_id", state.user.id);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[360px] rounded-2xl border border-border bg-card shadow-[var(--shadow-modal)] z-50 animate-slide-in-down overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="font-display text-lg">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-[var(--gold)] text-[oklch(0.18_0.018_60)] text-[10px] font-semibold px-1">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            id="mark-all-read-btn"
            className="text-[12px] text-primary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
        {state.notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <BellOff className="h-8 w-8 opacity-40" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          state.notifications.slice(0, 6).map((n) => {
            const Icon = kindIcon[n.kind as keyof typeof kindIcon] ?? Bell;
            const dotClass = kindColor[n.kind as keyof typeof kindColor] ?? "bg-primary";
            return (
              <button
                key={n.id}
                id={`notif-${n.id}`}
                onClick={() => handleNotifClick(n.id, n.horse_id)}
                className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-secondary/60 transition-colors ${!n.read ? "bg-primary/[0.04]" : ""}`}
              >
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.read ? "bg-secondary" : "bg-primary/10"} text-primary`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] leading-snug ${!n.read ? "font-semibold" : "font-medium"}`}
                  >
                    {n.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{n.at}</p>
                </div>
                {!n.read && <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border">
        <Link
          to="/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-[13px] text-primary hover:underline"
          id="view-all-notifs-btn"
        >
          View all notifications <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
