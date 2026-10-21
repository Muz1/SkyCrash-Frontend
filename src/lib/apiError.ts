import axios from 'axios'

/** Status code and JSON body of a failed API call (null status for network errors). */
export function apiError<T = Record<string, unknown>>(err: unknown): { status: number | null; data: T | null } {
  if (axios.isAxiosError(err)) {
    return { status: err.response?.status ?? null, data: (err.response?.data as T) ?? null }
  }
  return { status: null, data: null }
}

/** The server's short `message`, if it sent one. */
export function apiMessage(err: unknown): string | null {
  const { data } = apiError<{ message?: unknown }>(err)
  return data && typeof data === 'object' && typeof data.message === 'string' ? data.message : null
}

/** The `code` field of a 403 (email-unverified / restricted), if any. */
export function apiCode(err: unknown): string | null {
  const { data } = apiError<{ code?: unknown }>(err)
  return data && typeof data === 'object' && typeof data.code === 'string' ? data.code : null
}
