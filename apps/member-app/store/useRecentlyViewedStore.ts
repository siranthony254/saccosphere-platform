/**
 * useRecentlyViewedStore
 * Tracks the last few SACCOs a member looked at while browsing Discover, so
 * they can jump straight back in instead of re-searching. Device-local,
 * non-sensitive — persisted the same way as usePreferencesStore.
 */

import { Platform } from 'react-native'
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'

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

const storage = Platform.OS === 'web' ? webStorage : nativeStorage

export interface RecentlyViewedSacco {
  slug: string
  name: string
  color: string
  initials: string
}

const MAX_RECENT = 6

interface RecentlyViewedState {
  items: RecentlyViewedSacco[]
  addRecentlyViewed: (sacco: RecentlyViewedSacco) => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      addRecentlyViewed: (sacco) => {
        const withoutDupe = get().items.filter((item) => item.slug !== sacco.slug)
        set({ items: [sacco, ...withoutDupe].slice(0, MAX_RECENT) })
      },
    }),
    {
      name: 'saccosphere_recently_viewed',
      storage: createJSONStorage(() => storage),
    }
  )
)
