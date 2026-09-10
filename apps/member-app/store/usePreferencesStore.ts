/**
 * usePreferencesStore
 * Device-local, non-sensitive user preferences that survive app restarts.
 *
 * Persisted through expo-secure-store (already a dependency) so we don't pull
 * in a new native module. The blob is tiny and well under SecureStore's size
 * limit.
 *
 * `_hydrated` is false until the persisted value has been read back. Consumers
 * that care about privacy (see lib/money.ts) should treat "not hydrated yet"
 * as "hidden", so a cold start never briefly flashes a balance the user chose
 * to hide.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
}

interface PreferencesState {
  /** Mask the member's own balances and amounts across the app. */
  balanceHidden: boolean
  /** True once the persisted preferences have been loaded. */
  _hydrated: boolean
  toggleBalanceHidden: () => void
  setBalanceHidden: (hidden: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      balanceHidden: false,
      _hydrated: false,
      toggleBalanceHidden: () => set({ balanceHidden: !get().balanceHidden }),
      setBalanceHidden: (hidden) => set({ balanceHidden: hidden }),
    }),
    {
      name: 'saccosphere_preferences',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ balanceHidden: state.balanceHidden }),
      onRehydrateStorage: () => () => {
        usePreferencesStore.setState({ _hydrated: true })
      },
    }
  )
)
