/**
 * useMockQuery
 *
 * Drop-in replacement for React Query useQuery that returns mock data.
 * Used in every data-fetching hook while MOCK flags are true.
 *
 * Options:
 *   delayMs     — simulates network latency (default: 700ms)
 *   shouldError — set true to test ErrorState components
 *   errorMessage — custom error message when shouldError is true
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'

interface MockQueryOptions {
  delayMs?: number
  shouldError?: boolean
  errorMessage?: string
}

export function useMockQuery<T>(
  key: string,
  mockData: T,
  options: MockQueryOptions = {}
): UseQueryResult<T, Error> {
  const {
    delayMs = 700,
    shouldError = false,
    errorMessage = 'Mock error — testing error state',
  } = options

  return useQuery<T, Error>({
    queryKey: [key, 'mock'],
    queryFn: async (): Promise<T> => {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      if (shouldError) throw new Error(errorMessage)
      return mockData
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
