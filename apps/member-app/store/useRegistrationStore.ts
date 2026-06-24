/**
 * useRegistrationStore
 * Holds multi-step registration form data across screen navigations.
 * When a user presses back from step 2, step 1 re-reads from here to restore values.
 */

import { create } from 'zustand'
import type { RegisterInput } from '@saccosphere/schemas'

interface RegistrationState {
  step1: RegisterInput | null
  otpVerified: boolean
  kycDocumentIds: string[]
  linkedSaccoSlugs: string[]
  selectedSaccoSlug: string | null

  setStep1: (data: RegisterInput) => void
  setOtpVerified: (verified: boolean) => void
  addKYCDocument: (id: string) => void
  setLinkedSaccos: (slugs: string[]) => void
  setSelectedSaccoSlug: (slug: string | null) => void
  reset: () => void
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  step1: null,
  otpVerified: false,
  kycDocumentIds: [],
  linkedSaccoSlugs: [],
  selectedSaccoSlug: null,

  setStep1: (data) => set({ step1: data }),
  setOtpVerified: (verified) => set({ otpVerified: verified }),
  addKYCDocument: (id) => set((s) => ({ kycDocumentIds: [...s.kycDocumentIds, id] })),
  setLinkedSaccos: (slugs) => set({ linkedSaccoSlugs: slugs }),
  setSelectedSaccoSlug: (slug) => set({ selectedSaccoSlug: slug }),
  reset: () => set({ step1: null, otpVerified: false, kycDocumentIds: [], linkedSaccoSlugs: [], selectedSaccoSlug: null }),
}))
