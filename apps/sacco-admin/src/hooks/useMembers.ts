import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import type { AdminMember } from '@saccosphere/schemas'

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
    staleTime: 0,          // always consider stale → refetch on focus
    refetchInterval: 30_000, // poll every 30 s for real-time member count / status
  })
}

export function useMemberDetail(id: string) {
  return useQuery({
    queryKey: QueryKeys.adminMember(id),
    queryFn: () => api.saccoAdmin.getMember(id),
    staleTime: 0,
    refetchInterval: 60_000, // refresh detail every 60 s
    enabled: !!id,
  })
}
