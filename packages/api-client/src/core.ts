/**
 * @saccosphere/api-client — core Axios instance
 *
 * Handles:
 * - Access token attachment on every request
 * - 401 → silent refresh → retry (once)
 * - Response envelope unwrapping { success, data, error }
 * - Idempotency key injection for payment calls
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { getApiUrl, ErrorCode } from '@saccosphere/config'
import type { ZodType } from 'zod'

// ─── IN-MEMORY TOKEN STORE ────────────────────────────────────────────────────
// Access token lives here ONLY — never in localStorage or sessionStorage.

let _accessToken: string | null = null
let _refreshToken: string | null = null

export const setAccessToken = (token: string | null): void => {
  _accessToken = token
}

export const getAccessToken = (): string | null => _accessToken

export const setRefreshToken = (token: string | null): void => {
  _refreshToken = token
}

export const getRefreshToken = (): string | null => _refreshToken

export const clearAccessToken = (): void => {
  _accessToken = null
}

export const clearTokens = (): void => {
  _accessToken = null
  _refreshToken = null
}

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────

const normalizeBaseUrl = (url: string): string => {
  const trimmed = url.replace(/\/+$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: normalizeBaseUrl(getApiUrl()),
  withCredentials: true, // sends httpOnly refresh token cookie automatically
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000, // 15 second timeout
})

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`
    }
    // Add a unique request ID for tracing (helpful in Sentry)
    config.headers['X-Request-ID'] = generateRequestId()
    return config
  },

  (error) => Promise.reject(error)
)

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 — attempt silent token refresh, then retry original request
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Another request already triggered refresh — queue this one
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            original.headers = original.headers ?? {}
            original.headers.Authorization = `Bearer ${newToken}`
            resolve(axiosInstance(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        if (!_refreshToken) {
          throw new Error('No refresh token available')
        }

        const { data } = await axiosInstance.post('/accounts/token/refresh/', {
          refresh: _refreshToken,
        })
        const payload = data.data !== undefined ? data.data : data
        const newToken: string = payload.access
        setAccessToken(newToken)

        // Drain the queue
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        // Retry original
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(original)
      } catch (refreshError) {
        // Refresh failed — force logout
        clearTokens()
        refreshQueue = []

        // Dispatch event with reason so auth stores can clear localStorage
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saccosphere:logout', {
            detail: { reason: 'token_refresh_failed' }
          }))
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── CORE API CALL ────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  field?: string
  fields?: Record<string, string[]>
  details?: Record<string, unknown>
}

export interface ApiCallOptions {
  params?: Record<string, unknown>
  idempotent?: boolean
  responseSchema?: ZodType
}

export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  payload?: unknown,
  options?: ApiCallOptions
): Promise<T> {
  const config: AxiosRequestConfig = { method, url }

  if (payload) config.data = payload
  if (options?.params) config.params = options.params
  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'multipart/form-data',
    }
  }

  if (options?.idempotent) {
    config.headers = {
      ...config.headers,
      'Idempotency-Key': generateRequestId(), // UUID v4
    }
  }

  try {
    const response = await axiosInstance(config)
    const data = response.data.data !== undefined ? response.data.data : response.data
    return options?.responseSchema ? (options.responseSchema.parse(data) as T) : (data as T)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const validationError: ApiError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'The server returned data that does not match the app contract.',
        details: { issues: (error as { issues?: unknown }).issues },
      }
      throw validationError
    }

    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data
      const apiError: ApiError = responseData?.error ?? {
        code: responseData?.error_code ?? ErrorCode.NETWORK_ERROR,
        message:
          responseData?.message ??
          responseData?.detail ??
          'An unexpected error occurred. Please try again.',
        fields: responseData?.errors ?? undefined,
        details: typeof responseData === 'object' ? responseData : undefined,
      }
      throw apiError
    }
    // Network error (no response)
    const networkError: ApiError = {
      code: ErrorCode.NETWORK_ERROR,
      message: 'Unable to reach the server. Check your connection.',
    }
    throw networkError
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

