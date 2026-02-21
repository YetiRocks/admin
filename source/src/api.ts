export const BASE = '/admin'
export const AUTH_BASE = '/yeti-auth'
export const TELEMETRY_BASE = '/yeti-telemetry'
export const VECTORS_BASE = '/yeti-vectors'

let authToken: string | null = localStorage.getItem('yeti_token')

export function setToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('yeti_token', token)
  } else {
    localStorage.removeItem('yeti_token')
  }
}

export function getToken(): string | null {
  return authToken
}

export async function api<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    setToken(null)
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
