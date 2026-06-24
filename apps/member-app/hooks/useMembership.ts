import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useMemberships() {
  return useQuery({
    queryKey: QueryKeys.memberships(),
    queryFn: api.member.getMemberships,
    refetchInterval: 30_000,
  })
}

export function useMembership(id: string) {
  return useQuery({
    queryKey: QueryKeys.membership(id),
    queryFn: () => api.member.getMembership(id),
    staleTime: STALE_TIMES.dashboard,
    refetchInterval: 30_000,
  })
}

export function useMembershipBySacco(saccoSlug: string) {
  return useQuery({
    queryKey: ['membership-by-sacco', saccoSlug],
    queryFn: async () => {
      const list = await api.member.getMemberships()
      return list.find((m) => m.sacco_slug === saccoSlug) ?? null
    },
    staleTime: STALE_TIMES.dashboard,
    refetchInterval: 30_000,
  })
}
