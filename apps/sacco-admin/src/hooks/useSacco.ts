import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'

export function useSacco() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['sacco', user?.sacco_id],
    queryFn: () => {
      if (!user?.sacco_id) {
        throw new Error('No sacco_id found in user data')
      }
      return api.saccos.get(user.sacco_id)
    },
    enabled: !!user?.sacco_id,
    staleTime: 0, // Always refetch for real-time data
  })
}
