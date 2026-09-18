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
  /** Set once the application has actually been submitted to the backend. */
  membershipId: string | null
  /**
   * The SaccoApplication id returned by submission — required to attach
   * documents via POST /members/applications/{id}/documents/. Null until
   * submitted.
   */
  applicationId: string | null

  setSacco: (slug: string) => void
  setFormData: (data: Record<string, unknown>) => void
  setMonthlyContribution: (amount: number) => void
  addDocument: (id: string) => void
  setRegistrationFeePaid: (paid: boolean) => void
  setSubmissionResult: (result: { membershipId: string; applicationId: string | null }) => void
  reset: () => void
}

export const useMembershipApplicationStore = create<ApplicationState>((set) => ({
  saccoSlug: null,
  formData: {},
  monthlyContribution: 0,
  uploadedDocumentIds: [],
  registrationFeePaid: false,
  membershipId: null,
  applicationId: null,

  setSacco: (slug) => set({ saccoSlug: slug }),
  setFormData: (data) => set({ formData: data }),
  setMonthlyContribution: (amount) => set({ monthlyContribution: amount }),
  addDocument: (id) => set((s) => ({ uploadedDocumentIds: [...s.uploadedDocumentIds, id] })),
  setRegistrationFeePaid: (paid) => set({ registrationFeePaid: paid }),
  setSubmissionResult: ({ membershipId, applicationId }) => set({ membershipId, applicationId }),
  reset: () => set({
    saccoSlug: null, formData: {}, monthlyContribution: 0,
    uploadedDocumentIds: [], registrationFeePaid: false,
    membershipId: null, applicationId: null,
  }),
}))
