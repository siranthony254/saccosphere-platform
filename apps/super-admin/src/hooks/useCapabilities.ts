import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useCapabilities() {
  const query = useQuery({
    queryKey: ['capabilities'],
    queryFn: () => api.auth.getCapabilities(),
    staleTime: 60_000,
  })

  const isModuleEnabled = (moduleCode: string): boolean => {
    if (!query.data?.modules) return false
    const mod = query.data.modules.find((m) => m.code === moduleCode)
    return Boolean(mod?.enabled)
  }

  return {
    ...query,
    capabilities: query.data?.capabilities ?? {},
    sector: query.data?.sector,
    effectiveSector: query.data?.sector?.effective_code ?? 'OTHER',
    modules: query.data?.modules ?? [],
    isModuleEnabled,
  }
}
