import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

/** Write auth state into a cookie so Next.js middleware (Edge) can read it */
function syncAuthCookie(isAuthenticated: boolean, user: User | null) {
  if (typeof document === "undefined") return;
  if (isAuthenticated && user) {
    const payload = JSON.stringify({
      state: { isAuthenticated: true, user },
    });
    // 7-day expiry, SameSite=Lax so it's sent on top-level navigations
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `interviewai-auth=${encodeURIComponent(payload)}; path=/; expires=${expires}; SameSite=Lax`;
    console.log("[AUTH_COOKIE] Cookie written for middleware:", user.email);
  } else {
    // Clear cookie on logout
    document.cookie = "interviewai-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    console.log("[AUTH_COOKIE] Cookie cleared");
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        console.log("[TOKEN_SAVED] Storing tokens for:", user.email);
        syncAuthCookie(true, user);
        console.log("[AUTH_UPDATED] isAuthenticated = true");
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () => {
        syncAuthCookie(false, null);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "interviewai-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Re-sync cookie after rehydration from localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && state.user) {
          syncAuthCookie(true, state.user);
        }
      },
    }
  )
);
