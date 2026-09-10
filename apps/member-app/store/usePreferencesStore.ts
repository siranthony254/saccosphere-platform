/**
 * usePreferencesStore
 * Device-local, non-sensitive user preferences that survive app restarts.
 *
 * Persisted through expo-secure-store on native (already a dependency, no new
 * native module) and localStorage on web — expo-secure-store has no web
 * implementation and throws (`setValueWithKeyAsync is not a function`) under
 * `expo start --web`.
 *
 * `_hydrated` is false until the persisted value has been read back. Consumers
 * that care about privacy (see lib/money.ts) should treat "not hydrated yet"
 * as "hidden", so a cold start never briefly flashes a balance the user chose
 * to hide.
 */

import { Platform } from 'react-native'
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import type { ThemeId } from '../theme/tokens'

const webStorage: StateStorage = {
  getItem: (name) => {
    try {
      return globalThis.localStorage?.getItem(name) ?? null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      globalThis.localStorage?.setItem(name, value)
    } catch {
      /* private mode / storage disabled */
    }
  },
  removeItem: (name) => {
    try {
      globalThis.localStorage?.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}

const nativeStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
}

const preferencesStorage = Platform.OS === 'web' ? webStorage : nativeStorage

interface PreferencesState {
  /** Mask the member's own balances and amounts across the app. */
  balanceHidden: boolean
  /** Selected theme id, or 'system' to follow the OS light/dark setting. */
  themeId: ThemeId
  /** True once the persisted preferences have been loaded. */
  _hydrated: boolean
  toggleBalanceHidden: () => void
  setBalanceHidden: (hidden: boolean) => void
  setThemeId: (id: ThemeId) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      balanceHidden: false,
      themeId: 'midnight',
      _hydrated: false,
      toggleBalanceHidden: () => set({ balanceHidden: !get().balanceHidden }),
      setBalanceHidden: (hidden) => set({ balanceHidden: hidden }),
      setThemeId: (id) => set({ themeId: id }),
    }),
    {
      name: 'saccosphere_preferences',
      storage: createJSONStorage(() => preferencesStorage),
      partialize: (state) => ({
        balanceHidden: state.balanceHidden,
        themeId: state.themeId,
      }),
      onRehydrateStorage: () => () => {
        usePreferencesStore.setState({ _hydrated: true })
      },
    }
  )
)
