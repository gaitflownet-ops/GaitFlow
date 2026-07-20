import { createContext, useContext, useEffect, useReducer, type ReactNode, useMemo } from "react";
import { supabase } from "./supabase";
import type { Database } from "./supabase.types";
import type { UserRole } from "./supabase.types";
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
  logout: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useRealtimeSync();

  useEffect(() => {
    // 1. Check active session on mount
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          let profile = null;
          try {
            profile = await loadOrCreateProfile(session.user);
          } catch (e) {
            console.error("Failed to load or create profile during init:", e);
          }

          dispatch({
            type: "AUTH_STATE_CHANGE",
            payload: { isAuthenticated: !!profile, user: profile || null },
          });

          // Fetch notifications
          try {
            const { data: notifications } = await supabase
              .from("notifications")
              .select("*")
              .eq("user_id", session.user.id);

            if (notifications) {
              dispatch({ type: "SET_NOTIFICATIONS", payload: notifications });
            }
          } catch (e) {
             console.error("Failed to load notifications:", e);
          }
        } else {
          dispatch({
            type: "AUTH_STATE_CHANGE",
            payload: { isAuthenticated: false, user: null },
          });
        }
      } catch (err) {
        console.error("Critical error in checkSession:", err);
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
        let profile = null;
        try {
          profile = await loadOrCreateProfile(session.user);
        } catch (e) {
          console.error("Failed to load or create profile on SIGNED_IN:", e);
        }

        dispatch({
          type: "AUTH_STATE_CHANGE",
          payload: { isAuthenticated: !!profile, user: profile || null },
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

  return (
    <AppContext.Provider value={{ state, dispatch, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
