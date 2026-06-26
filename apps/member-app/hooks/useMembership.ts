import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useMemberships() {
  return useQuery({
    queryKey: QueryKeys.memberships(),
    queryFn: api.member.getMemberships,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // Keep in cache for 5 minutes
  })
}

export function useMembership(id: string) {
  return useQuery({
    queryKey: QueryKeys.membership(id),
    queryFn: () => api.member.getMembership(id),
    staleTime: STALE_TIMES.dashboard,
    gcTime: 300_000,
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
    gcTime: 300_000,
  })
}

export function useLeaveMembership() {
  return useMutation({
    mutationFn: (id: string) => api.member.leaveMembership(id),
  })
}
