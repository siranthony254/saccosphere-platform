import type { ApiError } from '@saccosphere/api-client'

/**
 * Flattens an ApiError's field-level validation errors (if any) into one
 * readable string; falls back to the error's own message, then to the
 * caller-supplied fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as Partial<ApiError>
  const fieldMessages = apiError.fields
    ? Object.entries(apiError.fields)
        .flatMap(([field, messages]) => {
          const fieldErrors = Array.isArray(messages) ? messages : [String(messages)]
          return fieldErrors.map((message) => `${field}: ${message}`)
        })
        .join('\n')
    : ''

  return fieldMessages || apiError.message || fallback
}
