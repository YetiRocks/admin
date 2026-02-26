export const BASE = '/admin'
export const AUTH_BASE = '/yeti-auth'
export const TELEMETRY_BASE = '/yeti-telemetry'
export const VECTORS_BASE = '/yeti-vectors'

export async function api<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  const res = await fetch(url, { ...options, headers, credentials: 'same-origin' })
  if (res.status === 401) {
    window.location.reload()
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : (null as T)
}
