/**
 * useSaccoViewStore
 * Tracks which SACCO the member is currently viewing in the SACCO detail stack.
 * Drives the SACCO switcher — changing this triggers navigation to the new SACCO.
 */

import { create } from 'zustand'

interface SaccoViewState {
  activeSaccoSlug: string | null
  setActiveSacco: (slug: string) => void
  clearActiveSacco: () => void
}

export const useSaccoViewStore = create<SaccoViewState>((set) => ({
  activeSaccoSlug: null,
  setActiveSacco: (slug) => set({ activeSaccoSlug: slug }),
  clearActiveSacco: () => set({ activeSaccoSlug: null }),
}))
