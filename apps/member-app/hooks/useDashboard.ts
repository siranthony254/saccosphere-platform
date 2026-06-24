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
    refetchInterval: 30_000, // Refresh every 30 seconds for real-time
    retry: 2, // Retry twice before giving up
  })
}
