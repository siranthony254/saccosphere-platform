import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
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
  })
}

export function useMemberDetail(id: string) {
  return useQuery({
    queryKey: QueryKeys.adminMember(id),
    queryFn: () => api.saccoAdmin.getMember(id),
  })
}
