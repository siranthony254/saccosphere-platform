
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useSacco } from './useSacco'


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
    interest_rate?: number
    max_repayment_period?: number
    min_guarantors?: number
  }
}

export function useSaccoSettings() {
  const queryClient = useQueryClient()
  const { data: sacco } = useSacco()

  const q = useQuery({
    queryKey: ['sacco-admin-settings'],
    queryFn: async (): Promise<SettingsUiModel> => {
      const settings = await api.saccoAdmin.getSettings()
      return {
        sacco: sacco ? {
          id: sacco.id,
          name: sacco.name,
          sector: sacco.sector,
          county: sacco.county,
          sasra_reg_no: sacco.sasra_reg_no,
          member_count: sacco.member_count,
        } : null,
        settings,
      }
    },
    staleTime: 0,
    enabled: !!sacco,
  })

  const m = useMutation({
    mutationFn: async (settings: any) => {
      await api.saccoAdmin.updateSettings(settings)
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
    save: (settings: any) => m.mutate(settings),
  }
}


