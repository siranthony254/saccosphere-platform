import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { saveRefreshToken } from './useAuth'

export function useCapabilities() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['capabilities'],
    queryFn: () => api.auth.getCapabilities(),
    staleTime: 60_000,
  })

  const switchSaccoMutation = useMutation({
    mutationFn: (data: { saccoId: string; refreshToken: string }) =>
      api.auth.setActiveSacco(data.saccoId, data.refreshToken),
    onSuccess: (payload) => {
      // The backend blacklists the OLD refresh token on this call — the
      // in-memory copy is replaced inside api.auth.setActiveSacco itself,
      // but this app's own sessionStorage copy (read back on page reload)
      // needs the same replacement, or a refresh after switching SACCOs
      // resurrects an already-revoked token.
      if (payload?.refresh) saveRefreshToken(payload.refresh)
      queryClient.invalidateQueries()
    },
  })

  const isModuleEnabled = (moduleCode: string): boolean => {
    if (!query.data?.modules) return false
    const mod = query.data.modules.find((m) => m.code === moduleCode)
    return Boolean(mod?.enabled)
  }

  const effectiveSector = query.data?.sector?.effective_code ?? 'OTHER'

  return {
    ...query,
    capabilities: query.data?.capabilities ?? {},
    sector: query.data?.sector,
    effectiveSector,
    modules: query.data?.modules ?? [],
    isModuleEnabled,
    switchSacco: switchSaccoMutation.mutate,
    isSwitchingSacco: switchSaccoMutation.isPending,
  }
}
