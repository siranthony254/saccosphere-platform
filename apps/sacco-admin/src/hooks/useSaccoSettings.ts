
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiCall } from '@saccosphere/api-client'
import type { SaccoConfig } from '@saccosphere/schemas'

type MgmtSettingsResponse = {
  success: boolean
  data: {
    registration_fee?: number
    loan_multiplier?: number
  }
}

type SettingsUiModel = {
  sacco: {
    id: string
    name: string
    sector?: string
    county?: string
    sasra_reg_no?: string
    member_count?: number
  } | null
  settings: {
    registration_fee?: number
    loan_multiplier?: number
  }
}

export function useSaccoSettings() {
  const queryClient = useQueryClient()

  const q = useQuery({
    queryKey: ['sacco-admin-settings'],
    queryFn: async (): Promise<SettingsUiModel> => {
      const res = await apiCallMgmtSettingsGet()
      return {
        sacco: null,
        settings: res.data,
      }
    },
    staleTime: 0,
  })

  const m = useMutation({
    mutationFn: async () => {
      const current = (q.data?.settings ?? {}) as Partial<SaccoConfig>
      await apiCall<void>('PATCH', '/management/settings/', current)
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacco-admin-settings'] })
    },
  })



  return {
    data: q.data
      ? {
          sacco: q.data.sacco ?? { name: 'SACCO', id: '', sector: '', county: '', sasra_reg_no: '', member_count: 0 },
          settings: q.data.settings,
        }
      : null,
    isLoading: q.isLoading,
    error: q.error,
    isPending: m.isPending,
    save: () => m.mutate(),
  }
}

async function apiCallMgmtSettingsGet(): Promise<MgmtSettingsResponse> {
  return apiCall<MgmtSettingsResponse>('GET', '/management/settings/')
}


