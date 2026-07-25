import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useLiquidityStatus() {
  return useQuery({
    queryKey: ['liquidity-status'],
    queryFn: api.saccoAdmin.getLiquidityStatus,
    staleTime: 30_000,
  })
}

export function useNPLDashboard() {
  return useQuery({
    queryKey: ['npl-dashboard'],
    queryFn: api.saccoAdmin.getNPLDashboard,
    staleTime: 30_000,
  })
}
