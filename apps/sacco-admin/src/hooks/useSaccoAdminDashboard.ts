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

export function useDisbursementsDashboard() {
  return useQuery({
    queryKey: ['disbursements-dashboard'],
    queryFn: api.saccoAdmin.getDisbursementsDashboard,
    staleTime: STALE_TIMES.adminDashboard,
    refetchInterval: 30_000,
  })
}

export function useContributionsDashboard() {
  return useQuery({
    queryKey: ['contributions-dashboard'],
    queryFn: api.saccoAdmin.getContributionsDashboard,
    staleTime: STALE_TIMES.adminDashboard,
    refetchInterval: 30_000,
  })
}
