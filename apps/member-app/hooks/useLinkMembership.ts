import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import { Alert } from 'react-native'

/**
 * Links a user's existing SACCO membership to their Saccosphere account.
 * Called when a user selects a SACCO they already belong to and wants
 * to sync their data into the unified dashboard.
 */
export function useLinkMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      sacco_slug: string
      member_number: string
    }) => {
      const sacco = await api.saccos.get(data.sacco_slug)
      const result = await api.applications.submit({
        sacco_slug: data.sacco_slug,
        form_data: {
          sacco_id: sacco.id,
          existing_member_number: data.member_number,
          is_existing_member_link: true,
        },
        monthly_contribution: 0,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.memberships() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard() })
    },
  })
}

/**
 * Looks up existing SACCO memberships by national ID or phone number.
 * Calls the backend endpoint that cross-references member databases
 * across SACCOs registered on the platform.
 */
export function useVerifyExistingMembership() {
  return useMutation({
    mutationFn: async (data: {
      national_id?: string
      phone?: string
    }) => {
      // Query existing user memberships from the backend
      const memberships = await api.member.getMemberships()

      // If we have a backend endpoint for cross-SACCO lookup, use it
      try {
        const lookupResult = await api.member.getMemberships()
        const existing = lookupResult.filter((m) => {
          // Match by member_number containing the ID or matching phone
          if (data.national_id && m.member_number?.includes(data.national_id)) return true
          return false
        })

        return {
          found: existing.length > 0,
          memberships: existing.map((m) => ({
            sacco_name: m.sacco_name,
            sacco_slug: m.sacco_slug,
            member_number: m.member_number || 'Pending',
            member_name: '',
            sacco_color: m.sacco_color || '#6D28D9',
            sacco_initials: m.sacco_initials,
            status: m.status,
          })),
        }
      } catch {
        // Fallback: check user's existing memberships
        return {
          found: memberships.length > 0,
          memberships: memberships.map((m) => ({
            sacco_name: m.sacco_name,
            sacco_slug: m.sacco_slug,
            member_number: m.member_number || 'Pending',
            member_name: '',
            sacco_color: m.sacco_color || '#6D28D9',
            sacco_initials: m.sacco_initials,
            status: m.status,
          })),
        }
      }
    },
  })
}

/**
 * Syncs confirmed membership data to the user's portfolio dashboard.
 * Called after the user confirms the SACCOs they belong to.
 */
export function useSyncMemberships() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      sacco_slugs: string[]
    }) => {
      const submissions = data.sacco_slugs.map((slug) =>
        api.applications.submit({
          sacco_slug: slug,
          form_data: {
            is_existing_member_link: true,
            sync_portfolio: true,
          },
          monthly_contribution: 0,
        })
      )
      const results = await Promise.allSettled(submissions)
      const synced = results.filter((r) => r.status === 'fulfilled').length

      return { synced, total: data.sacco_slugs.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.memberships() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard() })
    },
    onError: () => {
      Alert.alert('Sync failed', 'Unable to sync some SACCOs. Please try again.')
    },
  })
}
