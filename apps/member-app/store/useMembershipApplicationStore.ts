/**
 * useMembershipApplicationStore
 * Holds multi-step SACCO membership application form data.
 */

import { create } from 'zustand'

interface ApplicationState {
  saccoSlug: string | null
  formData: Record<string, unknown>
  monthlyContribution: number
  uploadedDocumentIds: string[]
  registrationFeePaid: boolean

  setSacco: (slug: string) => void
  setFormData: (data: Record<string, unknown>) => void
  setMonthlyContribution: (amount: number) => void
  addDocument: (id: string) => void
  setRegistrationFeePaid: (paid: boolean) => void
  reset: () => void
}

export const useMembershipApplicationStore = create<ApplicationState>((set) => ({
  saccoSlug: null,
  formData: {},
  monthlyContribution: 0,
  uploadedDocumentIds: [],
  registrationFeePaid: false,

  setSacco: (slug) => set({ saccoSlug: slug }),
  setFormData: (data) => set({ formData: data }),
  setMonthlyContribution: (amount) => set({ monthlyContribution: amount }),
  addDocument: (id) => set((s) => ({ uploadedDocumentIds: [...s.uploadedDocumentIds, id] })),
  setRegistrationFeePaid: (paid) => set({ registrationFeePaid: paid }),
  reset: () => set({
    saccoSlug: null, formData: {}, monthlyContribution: 0,
    uploadedDocumentIds: [], registrationFeePaid: false,
  }),
}))
