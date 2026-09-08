import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

/**
 * Files a membership application for a SACCO the user says they already belong to.
 *
 * The backend has no "link an existing member number" concept — MembershipApplySerializer
 * only creates a new PENDING application that a SACCO admin then reviews. So this is just
 * an ordinary application; any member number the user knows cannot be sent through this API
 * and is settled with the SACCO during review.
 */
export function useLinkMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { sacco_slug: string }) =>
      api.applications.submit({ sacco_slug: data.sacco_slug, form_data: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.memberships() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard() })
    },
  })
}
