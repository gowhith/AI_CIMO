import { create } from "zustand";

interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (token: string, user: User) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("ai_cimo_user") || "null"),
  token: localStorage.getItem("ai_cimo_token"),
  setSession: (token, user) => {
    localStorage.setItem("ai_cimo_token", token);
    localStorage.setItem("ai_cimo_user", JSON.stringify(user));
    set({ token, user });
  },
  clear: () => {
    localStorage.removeItem("ai_cimo_token");
    localStorage.removeItem("ai_cimo_user");
    set({ token: null, user: null });
  },
}));
