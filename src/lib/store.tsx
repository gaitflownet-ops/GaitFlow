import { createContext, useContext, useReducer, type ReactNode } from "react";
import { notifications as initialNotifications, updates as initialUpdates } from "./data";

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Trainer" | "Farm" | "Vet" | "Farrier";
  stableName: string;
  initials: string;
  phone?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  at: string;
  kind: "win" | "media" | "health" | "service" | "reminder";
  read: boolean;
  horseId?: string;
};

type AppState = {
  isAuthenticated: boolean;
  user: User | null;
  notifications: AppNotification[];
  updates: typeof initialUpdates;
  quickActionOpen: boolean;
  notificationDropdownOpen: boolean;
};

type Action =
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "ADD_UPDATE"; update: (typeof initialUpdates)[0] }
  | { type: "TOGGLE_QUICK_ACTION" }
  | { type: "SET_QUICK_ACTION"; open: boolean }
  | { type: "TOGGLE_NOTIFICATION_DROPDOWN" }
  | { type: "SET_NOTIFICATION_DROPDOWN"; open: boolean };

// ─── Default user (prototype: always logged in) ───────────────────────────────

const DEFAULT_USER: User = {
  id: "marisol-vega",
  name: "Marisol Vega",
  email: "marisol@liveoakstables.com",
  role: "Owner",
  stableName: "Live Oak Stables",
  initials: "MV",
  phone: "+1 (352) 555-0182",
};

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: AppState = {
  isAuthenticated: false, // starts false — login page sets to true
  user: null,
  notifications: initialNotifications.map((n) => ({ ...n, read: false })),
  updates: initialUpdates,
  quickActionOpen: false,
  notificationDropdownOpen: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, isAuthenticated: true, user: action.payload };
    case "LOGOUT":
      return { ...state, isAuthenticated: false, user: null };
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
    case "ADD_UPDATE":
      return { ...state, updates: [action.update, ...state.updates] };
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
  login: (user?: User) => void;
  logout: () => void;
  unreadCount: number;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = (user: User = DEFAULT_USER) => {
    dispatch({ type: "LOGIN", payload: user });
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
  };

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, unreadCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { DEFAULT_USER };
