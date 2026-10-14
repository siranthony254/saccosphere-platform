import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useNominees(membershipId: string | null) {
  return useQuery({
    queryKey: ['nominees', membershipId],
    queryFn: () => api.member.getNominees(membershipId!),
    enabled: !!membershipId,
  })
}

export function useSetNominees(membershipId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nominees: Parameters<typeof api.member.setNominees>[1]) =>
      api.member.setNominees(membershipId!, nominees),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nominees', membershipId] }),
  })
}
