/**
 * useLoanApplicationStore
 * Holds multi-step loan application form data.
 * Back button on any step restores filled values from this store.
 */

import { create } from 'zustand'
import type { LoanApplicationInput } from '@saccosphere/schemas'

interface Step1Data {
  loan_product_key: string
  amount_requested: number
  period_months: number
  purpose: string
  disbursement_method: 'mpesa' | 'fosa' | 'bank'
  disbursement_account: string
}

interface LoanApplicationState {
  membershipId: string | null
  saccoSlug: string | null
  step1: Step1Data | null
  guarantorIds: string[]

  setContext: (membershipId: string, saccoSlug: string) => void
  setStep1: (data: Step1Data) => void
  setGuarantors: (ids: string[]) => void
  getFullInput: () => LoanApplicationInput | null
  reset: () => void
}

export const useLoanApplicationStore = create<LoanApplicationState>((set, get) => ({
  membershipId: null,
  saccoSlug: null,
  step1: null,
  guarantorIds: [],

  setContext: (membershipId, saccoSlug) => set({ membershipId, saccoSlug }),
  setStep1: (data) => set({ step1: data }),
  setGuarantors: (ids) => set({ guarantorIds: ids }),

  getFullInput: (): LoanApplicationInput | null => {
    const { membershipId, step1, guarantorIds } = get()
    if (!membershipId || !step1) return null
    return {
      membership_id: membershipId,
      ...step1,
      guarantor_membership_ids: guarantorIds,
    }
  },

  reset: () => set({ membershipId: null, saccoSlug: null, step1: null, guarantorIds: [] }),
}))
