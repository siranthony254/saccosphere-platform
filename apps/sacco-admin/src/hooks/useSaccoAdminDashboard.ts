import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useSaccoAdminDashboard() {
  return useQuery({
    queryKey: QueryKeys.saccoAdminDashboard(),
    queryFn: api.saccoAdmin.getDashboard,
    staleTime: STALE_TIMES.adminDashboard,
    refetchInterval: 30_000,
  })
}
