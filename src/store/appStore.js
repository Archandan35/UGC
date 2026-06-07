import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Global, lightweight client store used for UI-only state that should
 * survive route changes (sidebar collapse, theme, last-visited tab,
 * cached profile mini-card, etc).
 *
 * Anything that lives in the database should NOT be mirrored here — keep
 * server data in React Query / on-demand fetches. This store is for
 * presentation state only.
 */
export const useAppStore = create(
  persist(
    (set) => ({
      // Layout
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: !!v }),

      // Theme (kept for future dark-mode work; currently always "light")
      theme: "light",
      setTheme: (theme) => set({ theme }),

      // Last-visited admin tab so refresh lands you back on the same view
      lastAdminTab: "dashboard",
      setLastAdminTab: (tab) => set({ lastAdminTab: tab }),

      // Cached lightweight profile for the navbar (name + avatar only)
      profileMini: null,
      setProfileMini: (profileMini) => set({ profileMini }),
      clearProfileMini: () => set({ profileMini: null }),

      // Banner / announcement dismissals (id -> true)
      dismissedBanners: {},
      dismissBanner: (id) =>
        set((s) => ({
          dismissedBanners: { ...s.dismissedBanners, [id]: true },
        })),
    }),
    {
      name: "odiaexams-app-store",
      version: 1,
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        theme: s.theme,
        lastAdminTab: s.lastAdminTab,
        dismissedBanners: s.dismissedBanners,
      }),
    }
  )
);

export default useAppStore;
