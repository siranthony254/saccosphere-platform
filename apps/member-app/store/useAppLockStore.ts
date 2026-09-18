/**
 * useAppLockStore
 * Transient (never persisted) idle-lock state — whether the app is
 * currently showing the re-authentication screen, and when it was last
 * backgrounded, so AppLockGuard can decide whether returning to the
 * foreground should require re-auth.
 */

import { create } from 'zustand'

interface AppLockState {
  isLocked: boolean
  backgroundedAt: number | null
  lock: () => void
  unlock: () => void
  setBackgroundedAt: (at: number | null) => void
}

export const useAppLockStore = create<AppLockState>((set) => ({
  isLocked: false,
  backgroundedAt: null,
  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false, backgroundedAt: null }),
  setBackgroundedAt: (at) => set({ backgroundedAt: at }),
}))
