import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Database } from "./supabase.types";
import type { UserRole } from "./supabase.types";
import { useRealtimeSync } from "./hooks/useRealtimeSync";

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
    const getFallbackProfile = (user: User): Profile => {
      const meta = user.user_metadata || {};
      return {
        id: user.id,
        name: meta.name || user.email?.split("@")[0] || "New User",
        role: meta.role || "Owner",
        user_role: (meta.user_role as UserRole) || "OWNER",
        stable_id: meta.stable_id || null,
        stable_name: meta.stable_name || null,
        initials: meta.initials || "US",
        phone: meta.phone || null,
        mfa_enabled: false,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    };

    const loadOrCreateProfile = async (user: User) => {
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (existingProfile) {
        return existingProfile;
      }

      if (selectError) {
        console.warn("Could not load profile, using auth metadata fallback.", selectError);
      }

      const fallbackProfile = getFallbackProfile(user);
      const { data: repairedProfile, error: upsertError } = await (supabase.from("profiles") as any)
        .upsert(fallbackProfile, { onConflict: "id" })
        .select("*")
        .single();

      if (upsertError) {
        console.warn("Could not repair profile, using auth metadata fallback.", upsertError);
        return fallbackProfile;
      }

      return repairedProfile;
    };

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
    await supabase.auth.signOut();
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
  return ctx;
}
