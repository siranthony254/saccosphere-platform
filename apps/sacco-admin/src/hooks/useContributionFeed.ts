import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

type Contribution = Awaited<ReturnType<typeof api.saccoAdmin.getContributions>>['results'][0]

export function useContributionFeed() {
  const query = useQuery({
    queryKey: ['sacco-admin-contributions-feed'],
    queryFn: () => api.saccoAdmin.getContributions().then((r) => r.results as Contribution[]),
    refetchInterval: 10_000,
  })

  return {
    contributions: query.data ?? [],
    connected: !query.isError && query.isSuccess,
  }
}
