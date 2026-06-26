import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useDashboard() {
  return useQuery({
    queryKey: QueryKeys.dashboard(),
    queryFn: async () => {
      try {
        const data = await api.member.getDashboard()
        return data
      } catch (error) {
        // Return a default empty dashboard state instead of throwing
        // This prevents the app from crashing when the API is unavailable
        console.warn('Dashboard fetch failed, returning empty state:', error)
        return {
          total_balance: 0,
          total_savings: 0,
          active_loans_balance: 0,
          sacco_count: 0,
          memberships: [],
          recent_transactions: [],
        }
      }
    },
    staleTime: STALE_TIMES.dashboard,
    gcTime: 300_000, // Keep in cache for 5 minutes
    refetchInterval: 60_000, // Refresh every minute instead of 30 seconds
    retry: 2, // Retry twice before giving up
  })
}

export function useDashboardState() {
  return useQuery({
    queryKey: ['dashboard-state'],
    queryFn: api.member.getState,
    staleTime: 60_000,
  })
}

export function useDashboardActivity(limit?: number) {
  return useQuery({
    queryKey: ['dashboard-activity', limit],
    queryFn: () => api.member.getActivity({ limit }),
    staleTime: 60_000,
  })
}
