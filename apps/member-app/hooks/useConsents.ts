import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useIsAuthenticated } from '../store/useAuthStore'

const CONSENTS_KEY = ['consents'] as const
const CONSENT_HISTORY_KEY = ['consent-history'] as const

export function useConsents() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: CONSENTS_KEY,
    queryFn: api.account.getConsents,
    staleTime: 60_000,
    enabled: isAuthenticated,
  })
}

export function useConsentHistory() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: CONSENT_HISTORY_KEY,
    queryFn: api.account.getConsentHistory,
    staleTime: 60_000,
    enabled: isAuthenticated,
  })
}

export function useSetConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ consentType, consented }: { consentType: string; consented: boolean }) =>
      consented
        ? api.account.giveConsent({ consent_type: consentType, consented: true })
        : api.account.withdrawConsent(consentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSENTS_KEY })
      queryClient.invalidateQueries({ queryKey: CONSENT_HISTORY_KEY })
    },
  })
}

export function useExportMyData() {
  return useMutation({
    mutationFn: () => api.account.exportMyData(),
  })
}

export function useRequestDataErasure() {
  return useMutation({
    mutationFn: (reason: string) => api.account.requestDataErasure(reason),
  })
}
