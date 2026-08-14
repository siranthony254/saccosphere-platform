import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'

export function useMockQuery<T>(
  key: string | readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T>, 'queryKey' | 'queryFn'>
): UseQueryResult<T, Error> {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    ...options,
  })
}
