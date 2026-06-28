import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'

export function usePlatformMembers(params?: { search?: string; status?: string }) {
  const { accessToken } = useAuthStore()
  
  return useQuery({
    queryKey: ['platform-members', params],
    queryFn: async () => {
      // Fetch all SACCOs first
      const saccos = await api.saccos.list()
      
      // Fetch members from each SACCO
      const memberPromises = saccos.map(async (sacco) => {
        try {
          const response = await api.saccoAdmin.getMembers({
            search: params?.search,
            status: params?.status,
          })
          // Add SACCO context to each member
          return response.results.map((member) => ({
            ...member,
            sacco_name: sacco.name,
            sacco_id: sacco.id,
          }))
        } catch (error) {
          // Skip SACCOs where the request fails (e.g., no admin access)
          return []
        }
      })
      
      const allMembers = await Promise.all(memberPromises)
      const flattened = allMembers.flat()
      
      return {
        count: flattened.length,
        results: flattened,
      }
    },
    enabled: !!accessToken,
    staleTime: 60_000, // 1 minute
  })
}
