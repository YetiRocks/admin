import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api, AUTH_BASE } from '../../api'

export const Route = createFileRoute('/auth/')({
  component: AuthDashboard,
})

function AuthDashboard() {
  const [stats, setStats] = useState({ users: 0, roles: 0, providers: 0 })

  useEffect(() => {
    Promise.all([
      api<unknown[]>(`${AUTH_BASE}/users`).then(u => u.length).catch(() => 0),
      api<unknown[]>(`${AUTH_BASE}/roles`).then(r => r.length).catch(() => 0),
      api<unknown[]>(`${AUTH_BASE}/oauth_providers`).then(p => p.length).catch(() => 0),
    ]).then(([users, roles, providers]) => setStats({ users, roles, providers }))
  }, [])

  return (
    <div className="auth-dashboard">
      <h1>Authentication</h1>
      <div className="stat-cards">
        <Link to="/auth/users" className="stat-card">
          <div className="stat-value">{stats.users}</div>
          <div className="stat-label">Users</div>
        </Link>
        <Link to="/auth/roles" className="stat-card">
          <div className="stat-value">{stats.roles}</div>
          <div className="stat-label">Roles</div>
        </Link>
        <div className="stat-card">
          <div className="stat-value">{stats.providers}</div>
          <div className="stat-label">OAuth Providers</div>
        </div>
      </div>
    </div>
  )
}
