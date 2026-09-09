import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

// Custom member-profile fields for the current admin's SACCO.
// Backed by /members/admin/field-definitions/ (IsSaccoAdmin, full CRUD).
export function useMemberFieldDefinitions() {
  return useQuery({
    queryKey: ['member-field-definitions'],
    queryFn: () => api.saccoAdmin.getMemberFieldDefinitions(),
  })
}

export function useCreateMemberFieldDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      label: string
      field_type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'FILE'
      is_required?: boolean
      options?: string[] | null
      display_order?: number
    }) => api.saccoAdmin.createMemberFieldDefinition(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-field-definitions'] }),
  })
}

export function useDeleteMemberFieldDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.saccoAdmin.deleteMemberFieldDefinition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-field-definitions'] }),
  })
}
