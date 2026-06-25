import { createContext, useContext, useEffect, useReducer, type ReactNode, useMemo } from "react";
import { supabase } from "./supabase";
import type { Database } from "./supabase.types";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { loadOrCreateProfile } from "./auth-profile";
import { useTasks } from "./hooks/useTasks";
import { usePharmaceuticals } from "./hooks/usePharmaceuticals";
import { useHealthRecords } from "./hooks/useHealth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];

type AppState = {
  isAuthenticated: boolean;
  user: Profile | null;
  authLoading: boolean;
  notifications: AppNotification[];
  quickActionOpen: boolean;
  notificationDropdownOpen: boolean;
};

type Action =
  | { type: "AUTH_STATE_CHANGE"; payload: { isAuthenticated: boolean; user: Profile | null } }
  | { type: "SET_NOTIFICATIONS"; payload: AppNotification[] }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "TOGGLE_QUICK_ACTION" }
  | { type: "SET_QUICK_ACTION"; open: boolean }
  | { type: "TOGGLE_NOTIFICATION_DROPDOWN" }
  | { type: "SET_NOTIFICATION_DROPDOWN"; open: boolean };

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  authLoading: true,
  notifications: [],
  quickActionOpen: false,
  notificationDropdownOpen: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "AUTH_STATE_CHANGE":
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        authLoading: false,
      };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };
    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    case "TOGGLE_QUICK_ACTION":
      return { ...state, quickActionOpen: !state.quickActionOpen };
    case "SET_QUICK_ACTION":
      return { ...state, quickActionOpen: action.open };
    case "TOGGLE_NOTIFICATION_DROPDOWN":
      return {
        ...state,
        notificationDropdownOpen: !state.notificationDropdownOpen,
      };
    case "SET_NOTIFICATION_DROPDOWN":
      return { ...state, notificationDropdownOpen: action.open };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  logout: () => Promise<void>;
  unreadCount: number;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useRealtimeSync();

  useEffect(() => {
    // 1. Check active session on mount
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await loadOrCreateProfile(session.user);

        dispatch({
          type: "AUTH_STATE_CHANGE",
          payload: { isAuthenticated: true, user: profile || null },
        });

        // Fetch notifications
        const { data: notifications } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", session.user.id);

        if (notifications) {
          dispatch({ type: "SET_NOTIFICATIONS", payload: notifications });
        }
      } else {
        dispatch({
          type: "AUTH_STATE_CHANGE",
          payload: { isAuthenticated: false, user: null },
        });
      }
    };

    checkSession();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await loadOrCreateProfile(session.user);

        dispatch({
          type: "AUTH_STATE_CHANGE",
          payload: { isAuthenticated: true, user: profile || null },
        });
      } else if (event === "SIGNED_OUT") {
        dispatch({
          type: "AUTH_STATE_CHANGE",
          payload: { isAuthenticated: false, user: null },
        });
        dispatch({ type: "SET_NOTIFICATIONS", payload: [] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out", e);
    } finally {
      dispatch({
        type: "AUTH_STATE_CHANGE",
        payload: { isAuthenticated: false, user: null },
      });
      window.location.href = "/login";
    }
  };

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{ state, dispatch, logout, unreadCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");

  // Call the queries (they will read from cache or database/localStorage)
  const { data: tasks = [] } = useTasks();
  const { data: pharmaceuticals = [] } = usePharmaceuticals();
  const { data: healthRecords = [] } = useHealthRecords();

  const combinedNotifications = useMemo(() => {
    const stateNotifs = ctx.state.notifications;
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const dynamic: AppNotification[] = [];

    // 1. Low Stock alerts
    pharmaceuticals.forEach((p) => {
      if ((p.stock_quantity ?? 0) <= (p.min_stock_alert ?? 5)) {
        dynamic.push({
          id: `low-stock-${p.id}`,
          user_id: ctx.state.user?.id || "local",
          title: "Low Stock Alert",
          body: `${p.name} stock is low (${p.stock_quantity} ${p.unit} remaining).`,
          kind: "reminder",
          read: false,
          horse_id: null,
          at: "Stock Alert",
          organization_id: ctx.state.user?.organization_id || null,
          created_at: new Date().toISOString(),
        });
      }
    });

    // 2. Expiration alerts
    pharmaceuticals.forEach((p) => {
      if (p.expiry_date) {
        const expDate = new Date(p.expiry_date);
        if (expDate < now) {
          dynamic.push({
            id: `expired-${p.id}`,
            user_id: ctx.state.user?.id || "local",
            title: "Expired Medication Alert",
            body: `${p.name} expired on ${p.expiry_date}.`,
            kind: "health",
            read: false,
            horse_id: null,
            at: "Expired",
            organization_id: ctx.state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        } else if (expDate < thirtyDaysFromNow) {
          dynamic.push({
            id: `expiring-${p.id}`,
            user_id: ctx.state.user?.id || "local",
            title: "Medication Expiring Soon",
            body: `${p.name} will expire on ${p.expiry_date}.`,
            kind: "health",
            read: false,
            horse_id: null,
            at: "Expiring",
            organization_id: ctx.state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    // 3. Task alerts
    tasks.forEach((t) => {
      if (t.status !== "completed" && t.due_date) {
        const dueDate = new Date(t.due_date);
        if (dueDate < now) {
          dynamic.push({
            id: `task-overdue-${t.id}`,
            user_id: ctx.state.user?.id || "local",
            title: "Task Overdue Alert",
            body: `"${t.title}" is overdue (due ${t.due_date}).`,
            kind: "reminder",
            read: false,
            horse_id: t.horse_id,
            at: "Overdue",
            organization_id: ctx.state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        } else if (dueDate < threeDaysFromNow) {
          dynamic.push({
            id: `task-due-${t.id}`,
            user_id: ctx.state.user?.id || "local",
            title: "Task Due Soon",
            body: `"${t.title}" is due on ${t.due_date}.`,
            kind: "reminder",
            read: false,
            horse_id: t.horse_id,
            at: "Due soon",
            organization_id: ctx.state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    // 4. Health Care alerts
    healthRecords.forEach((r) => {
      if (r.next_due && r.status !== "completed" && r.status !== "clear") {
        const nextDue = new Date(r.next_due);
        if (nextDue < now) {
          dynamic.push({
            id: `health-overdue-${r.id}`,
            user_id: ctx.state.user?.id || "local",
            title: "Medical Care Overdue",
            body: `"${r.title}" for ${r.horse_name || "horse"} was due on ${r.next_due}.`,
            kind: "health",
            read: false,
            horse_id: r.horse_id,
            at: "Overdue",
            organization_id: ctx.state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        } else if (nextDue < sevenDaysFromNow) {
          dynamic.push({
            id: `health-due-${r.id}`,
            user_id: ctx.state.user?.id || "local",
            title: "Upcoming Medical Care",
            body: `"${r.title}" for ${r.horse_name || "horse"} is scheduled for ${r.next_due}.`,
            kind: "health",
            read: false,
            horse_id: r.horse_id,
            at: "Upcoming",
            organization_id: ctx.state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    // Process dynamic notifications: if they are already marked read in database notifications list
    const processedDynamic = dynamic.map((d) => {
      const dbNotif = stateNotifs.find((sn) => sn.id === d.id || sn.at === d.id);
      return {
        ...d,
        read: !!(dbNotif?.read),
      };
    });

    // Filter out duplicates (dynamic overrides state if same ID)
    const dynamicIds = new Set(processedDynamic.map((d) => d.id));
    const uniqueStateNotifs = stateNotifs.filter((n) => !dynamicIds.has(n.id));

    // Combine them
    return [...processedDynamic, ...uniqueStateNotifs].sort((a, b) => {
      return (b.created_at || "") > (a.created_at || "") ? 1 : -1;
    });
  }, [ctx.state.notifications, ctx.state.user, tasks, pharmaceuticals, healthRecords]);

  // Compute combined unread count
  const unreadCount = useMemo(() => {
    return combinedNotifications.filter((n) => !n.read).length;
  }, [combinedNotifications]);

  // Intercept dispatch to handle custom dynamic notifications read actions in Supabase
  const customDispatch = async (action: any) => {
    if (action.type === "MARK_NOTIFICATION_READ") {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action.id);
      if (isUuid) {
        await (supabase.from("notifications") as any).update({ read: true }).eq("id", action.id);
      } else {
        const notif = combinedNotifications.find((n) => n.id === action.id);
        if (notif) {
          await (supabase.from("notifications") as any).insert([{
            user_id: ctx.state.user?.id,
            title: notif.title,
            body: notif.body,
            kind: notif.kind,
            read: true,
            at: notif.id,
            organization_id: ctx.state.user?.organization_id || null
          }]);
        }
      }
    } else if (action.type === "MARK_ALL_READ") {
      await (supabase.from("notifications") as any)
        .update({ read: true })
        .eq("user_id", ctx.state.user?.id);

      const unreadDynamic = combinedNotifications.filter((n) => !n.read && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(n.id));
      if (unreadDynamic.length > 0) {
        const inserts = unreadDynamic.map((notif) => ({
          user_id: ctx.state.user?.id,
          title: notif.title,
          body: notif.body,
          kind: notif.kind,
          read: true,
          at: notif.id,
          organization_id: ctx.state.user?.organization_id || null
        }));
        await (supabase.from("notifications") as any).insert(inserts);
      }
    }
    ctx.dispatch(action);
  };

  return {
    state: {
      ...ctx.state,
      notifications: combinedNotifications,
    },
    dispatch: customDispatch,
    logout: ctx.logout,
    unreadCount,
  };
}
