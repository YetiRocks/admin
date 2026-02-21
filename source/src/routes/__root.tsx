import { createRootRoute, Outlet, Link, useRouter } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../hooks/useToast'
import { api, AUTH_BASE, setToken, getToken } from '../api'

export const Route = createRootRoute({
  component: RootLayout,
})

function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Login failed')
      }
      const data = await res.json()
      onLogin(data.access_token || data.accessToken || data.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={`${import.meta.env.BASE_URL}logo_white.svg`} alt="Yeti" className="login-logo" />
        <h1>Admin</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={loading || !username || !password}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

function RootLayout() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const { ToastContainer } = useToast()
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setAuthenticated(false)
      return
    }
    try {
      await api(`${AUTH_BASE}/auth`)
      setAuthenticated(true)
    } catch {
      setToken(null)
      setAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogin = (token: string) => {
    setToken(token)
    setAuthenticated(true)
  }

  const handleLogout = () => {
    setToken(null)
    setAuthenticated(false)
    router.navigate({ to: '/' })
  }

  if (authenticated === null) {
    return <div className="loading">Loading...</div>
  }

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <div className="admin-nav-left">
          <Link to="/">
            <img src={`${import.meta.env.BASE_URL}logo_white.svg`} alt="Yeti" className="admin-logo" />
          </Link>
        </div>
        <div className="admin-nav-center">
          <Link to="/applications" className="admin-nav-link" activeProps={{ className: 'active' }}>
            Applications
          </Link>
          <Link to="/auth" className="admin-nav-link" activeProps={{ className: 'active' }}>
            Auth
          </Link>
          <Link to="/telemetry" className="admin-nav-link" activeProps={{ className: 'active' }}>
            Telemetry
          </Link>
          <Link to="/vectors" className="admin-nav-link" activeProps={{ className: 'active' }}>
            Vectors
          </Link>
          <Link to="/benchmarks" className="admin-nav-link" activeProps={{ className: 'active' }}>
            Benchmarks
          </Link>
        </div>
        <div className="admin-nav-right">
          <button className="admin-logout" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="admin-content">
        <Outlet />
      </div>

      <ToastContainer />
    </div>
  )
}
