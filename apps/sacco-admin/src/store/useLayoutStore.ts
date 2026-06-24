import { create } from 'zustand'

interface LayoutState {
  sidebarCollapsed: boolean
  activeNav: string
  toggleSidebar: () => void
  setActiveNav: (nav: string) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarCollapsed: false,
  activeNav: 'dashboard',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveNav: (activeNav) => set({ activeNav }),
}))
