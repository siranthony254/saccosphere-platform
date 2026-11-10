import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

interface MemberFilters { status?: string; search?: string; kyc_status?: string }

const uiToBackendStatus: Record<string, string> = {
  active: 'APPROVED',
  under_review: 'UNDER_REVIEW',
  suspended: 'SUSPENDED',
  withdrawn: 'REJECTED',
  applied: 'PENDING',
}

export function useMembers(filters: MemberFilters = {}) {
  const params = {
    ...filters,
    status: filters.status ? uiToBackendStatus[filters.status] ?? filters.status : undefined,
  }
  return useQuery({
    queryKey: QueryKeys.adminMembers(params),
    queryFn: () => api.saccoAdmin.getMembers(params),
    // Was staleTime: 0 + a 30s refetchInterval - polled the full member
    // list every 30s for as long as this page sat open, focused or not.
    // Membership status doesn't change second-to-second; the global
    // refetchOnWindowFocus default (see main.tsx) already covers "this
    // might be stale" when an admin actually comes back to the tab.
    staleTime: 30_000,
  })
}

export function useMemberDetail(id: string) {
  return useQuery({
    queryKey: QueryKeys.adminMember(id),
    queryFn: () => api.saccoAdmin.getMember(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}

export function useOpenSavingsAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { membership_id: string; savings_type_id: string; opening_balance?: number }) =>
      api.saccoAdmin.openSavingsAccount(data),
    onSuccess: (_result, { membership_id }) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.adminMember(membership_id) })
      // Shorter prefix (not the factory call) so it partial-matches every
      // cached filter variant of the members list, not just an empty one.
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })
}
