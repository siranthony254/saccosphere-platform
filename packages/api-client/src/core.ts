/**
 * @saccosphere/api-client — core Axios instance
 *
 * Handles:
 * - Access token attachment on every request
 * - 401 → silent refresh → retry (once)
 * - Response envelope unwrapping { success, data, error }
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { getApiUrl, ErrorCode } from '@saccosphere/config'
import type { ZodType } from 'zod'

// ─── IN-MEMORY TOKEN STORE ────────────────────────────────────────────────────

let _accessToken: string | null = null
let _refreshToken: string | null = null
let _saccoId: string | null = null

export const setAccessToken = (token: string | null): void => {
  _accessToken = token
}

export const getAccessToken = (): string | null => _accessToken

export const setRefreshToken = (token: string | null): void => {
  _refreshToken = token
}

export const getRefreshToken = (): string | null => _refreshToken

export const setSaccoId = (saccoId: string | null): void => {
  _saccoId = saccoId
}

export const getSaccoId = (): string | null => _saccoId

export const clearAccessToken = (): void => {
  _accessToken = null
}

export const clearTokens = (): void => {
  _accessToken = null
  _refreshToken = null
  _saccoId = null
}

// ─── AUTH EVENT LISTENERS ─────────────────────────────────────────────────────
// Cross-platform hooks the host app registers so it can persist a rotated
// refresh token or react to a forced logout. React Native has a `window`
// global but no `window.addEventListener` / `CustomEvent`, so the old
// window-event approach crashed on native — these callbacks work everywhere.

type TokenRotatedListener = (refreshToken: string) => void
type ForcedLogoutListener = (reason: string) => void

let _tokenRotatedListener: TokenRotatedListener | null = null
let _forcedLogoutListener: ForcedLogoutListener | null = null

export const onTokenRotated = (cb: TokenRotatedListener | null): void => {
  _tokenRotatedListener = cb
}

export const onForcedLogout = (cb: ForcedLogoutListener | null): void => {
  _forcedLogoutListener = cb
}

const canDispatchWindowEvent = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.dispatchEvent === 'function' &&
  typeof CustomEvent === 'function'

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────

const normalizeBaseUrl = (url: string): string => {
  const trimmed = url.replace(/\/+$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: normalizeBaseUrl(getApiUrl()),
  // The backend is JWT-only (no SessionAuthentication, USE_SESSION_AUTH: False)
  // so no cookies are ever needed. Sending credentials would force the browser
  // into strict CORS (exact-origin + Allow-Credentials) for zero benefit.
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // 30s — the Railway backend sleeps when idle and a cold start can take
  // 15–25s, which would otherwise surface as "Unable to reach the server".
  timeout: 30_000,
})

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`
    }
    // NOTE: we intentionally do NOT send an `X-Sacco-ID` header. The deployed
    // backend's CORS_ALLOW_HEADERS only whitelists `x-request-id`, so any
    // `x-sacco-id` header makes the browser's CORS preflight fail and blocks
    // every admin request. The backend's SaccoScopedMixin already falls back
    // to the caller's own SACCO_ADMIN role's SACCO when no header is present,
    // which is what the single-SACCO admin apps need. If multi-SACCO
    // switching is ever required, add `x-sacco-id` to CORS_ALLOW_HEADERS in
    // the backend and restore the header here.
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
      // If no refresh token, just reject the error (public endpoints don't need auth)
      if (!_refreshToken) {
        return Promise.reject(error)
      }

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
        const { data } = await axiosInstance.post('/accounts/token/refresh/', {
          refresh: _refreshToken,
        })
        const payload = data.data !== undefined ? data.data : data
        const newToken: string = payload.access
        const newRefreshToken: string | undefined = payload.refresh

        setAccessToken(newToken)
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken)
          // Persist the rotated token via the host callback (native + web),
          // and keep the window event for existing web listeners.
          _tokenRotatedListener?.(newRefreshToken)
          if (canDispatchWindowEvent()) {
            window.dispatchEvent(new CustomEvent('saccosphere:token_rotated', {
              detail: { refreshToken: newRefreshToken }
            }))
          }
        }

        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(original)
      } catch (refreshError) {
        clearTokens()
        refreshQueue = []
        _forcedLogoutListener?.('token_refresh_failed')
        if (canDispatchWindowEvent()) {
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
  /** HTTP status when the failure came from a server response (undefined for network/timeout/parse errors). */
  status?: number
  field?: string
  fields?: Record<string, string[]>
  details?: Record<string, unknown>
}

export interface ApiCallOptions {
  params?: Record<string, unknown>
  idempotent?: boolean
  responseSchema?: ZodType
}

const GENERIC_BACKEND_MESSAGES = new Set(['Validation error', 'Request failed', 'Internal server error'])

// custom_exception_handler's `errors` field is either a DRF field-error dict
// ({field: [msg, ...]}) or {detail: msg} for non-field errors — flatten
// either into one human-readable string.
const flattenFieldErrors = (errors: unknown): string | null => {
  if (!errors || typeof errors !== 'object') return null
  const parts = Object.entries(errors as Record<string, unknown>).flatMap(([field, messages]) => {
    const list = Array.isArray(messages) ? messages : [messages]
    return list.map((m) => (field === 'detail' || field === 'non_field_errors' ? String(m) : `${field}: ${m}`))
  })
  return parts.length > 0 ? parts.join(' ') : null
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
      'Content-Type': undefined,
    }
  }

  if (options?.idempotent) {
    config.headers = {
      ...config.headers,
      'Idempotency-Key': generateRequestId(), 
    }
  }

  try {
    const response = await axiosInstance(config)
    // Some views wrap a message-only success as {success, message, data: null}
    // (StandardResponseMixin.ok(None, message)) — treat null the same as
    // undefined so the top-level envelope (with `message`) is returned
    // instead of a bare `null` that fails any responseSchema.
    const responseData = response.data.data
    const data = responseData !== undefined && responseData !== null ? responseData : response.data
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
      const fields = responseData?.errors ?? undefined
      const fieldMessage = flattenFieldErrors(fields)
      const backendMessage = responseData?.message ?? responseData?.detail
      // custom_exception_handler always sends a generic placeholder
      // ('Validation error', 'Request failed', ...) alongside the real,
      // field-specific reason in `errors` — prefer the specific one so
      // callers that just show `.message` (most of them) aren't stuck with
      // "Validation error" for every 400.
      const apiError: ApiError = responseData?.error ?? {
        code: responseData?.error_code ?? ErrorCode.NETWORK_ERROR,
        message:
          (fieldMessage && (!backendMessage || GENERIC_BACKEND_MESSAGES.has(backendMessage))
            ? fieldMessage
            : backendMessage) ?? 'An unexpected error occurred. Please try again.',
        fields,
        details: typeof responseData === 'object' ? responseData : undefined,
      }
      apiError.status = error.response.status
      throw apiError
    }
    const isTimeout =
      axios.isAxiosError(error) &&
      (error.code === 'ECONNABORTED' || /timeout/i.test(error.message ?? ''))
    const networkError: ApiError = {
      code: ErrorCode.NETWORK_ERROR,
      message: isTimeout
        ? 'The server is taking too long to respond (it may be waking up). Please try again in a moment.'
        : 'Unable to reach the server. Check your connection.',
    }
    throw networkError
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

