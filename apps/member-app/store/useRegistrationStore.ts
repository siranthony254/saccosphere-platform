/**
 * useRegistrationStore
 * Holds multi-step registration form data across screen navigations.
 * When a user presses back from step 2, step 1 re-reads from here to restore values.
 */

import { create } from 'zustand'
import type { RegisterInput } from '@saccosphere/schemas'

interface KYCDocuments {
  id_front: { uri: string; name: string; type: string } | null
  id_back: { uri: string; name: string; type: string } | null
  passport: { uri: string; name: string; type: string } | null
  huduma: { uri: string; name: string; type: string } | null
}

interface RegistrationState {
  step1: RegisterInput & { google_id_token?: string } | null
  idNumber: string
  dateOfBirth: string
  documentType: 'id_card' | 'passport' | 'huduma_card'
  otpVerified: boolean
  kycDocumentIds: string[]
  kycDocuments: KYCDocuments
  linkedSaccoSlugs: string[]
  selectedSaccoSlug: string | null

  setStep1: (data: RegisterInput & { google_id_token?: string }) => void
  setIDInfo: (idNumber: string, dateOfBirth: string, docType: 'id_card' | 'passport' | 'huduma_card') => void
  setOtpVerified: (verified: boolean) => void
  addKYCDocument: (id: string) => void
  setKYCDocuments: (docs: Partial<KYCDocuments>) => void
  setLinkedSaccos: (slugs: string[]) => void
  setSelectedSaccoSlug: (slug: string | null) => void
  reset: () => void
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  step1: null,
  idNumber: '',
  dateOfBirth: '',
  documentType: 'id_card',
  otpVerified: false,
  kycDocumentIds: [],
  kycDocuments: { id_front: null, id_back: null, passport: null, huduma: null },
  linkedSaccoSlugs: [],
  selectedSaccoSlug: null,

  setStep1: (data) => set({ step1: data }),
  setIDInfo: (idNumber, dateOfBirth, documentType) => set({ idNumber, dateOfBirth, documentType }),
  setOtpVerified: (verified) => set({ otpVerified: verified }),
  addKYCDocument: (id) => set((s) => ({ kycDocumentIds: [...s.kycDocumentIds, id] })),
  setKYCDocuments: (docs) => set((s) => ({ kycDocuments: { ...s.kycDocuments, ...docs } })),
  setLinkedSaccos: (slugs) => set({ linkedSaccoSlugs: slugs }),
  setSelectedSaccoSlug: (slug) => set({ selectedSaccoSlug: slug }),
  reset: () => set({
    step1: null,
    idNumber: '',
    dateOfBirth: '',
    documentType: 'id_card',
    otpVerified: false,
    kycDocumentIds: [],
    kycDocuments: { id_front: null, id_back: null, passport: null, huduma: null },
    linkedSaccoSlugs: [],
    selectedSaccoSlug: null
  }),
}))
