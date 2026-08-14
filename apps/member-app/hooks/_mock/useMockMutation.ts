import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'

export function useMockMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  options?: Omit<UseMutationOptions<TOutput, Error, TInput>, 'mutationFn'>
): UseMutationResult<TOutput, Error, TInput> {
  return useMutation({
    mutationFn,
    ...options,
  })
}
