/**
 * useMockMutation
 *
 * Drop-in replacement for React Query useMutation for form submissions.
 * Used in mutation hooks (loan apply, payment, membership apply) while MOCK is true.
 */

import { useMutation, UseMutationResult } from '@tanstack/react-query'

interface MockMutationOptions {
  delayMs?: number
  shouldError?: boolean
  errorMessage?: string
}

export function useMockMutation<TInput, TOutput>(
  mockFn: (input: TInput) => TOutput,
  options: MockMutationOptions = {}
): UseMutationResult<TOutput, Error, TInput> {
  const {
    delayMs = 1000,
    shouldError = false,
    errorMessage = 'Mock mutation error',
  } = options

  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (input: TInput): Promise<TOutput> => {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      if (shouldError) throw new Error(errorMessage)
      return mockFn(input)
    },
    retry: false,
  })
}
