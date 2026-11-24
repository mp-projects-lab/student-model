const RAW_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000'

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    searchParams.set(key, String(value))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    let detail = `Error HTTP ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: string }
      if (typeof payload.detail === 'string') {
        detail = payload.detail
      }
    } catch {
      // Mantiene el mensaje HTTP por defecto si la respuesta no es JSON
    }
    throw new ApiError(response.status, detail)
  }

  return (await response.json()) as T
}
