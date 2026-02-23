import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api, BASE } from '../../api'
import { AppSummary } from '../../types'
import { NewAppModal } from '../../components/NewAppModal'

export const Route = createFileRoute('/applications/')({
  loader: () => api<AppSummary[]>(`${BASE}/apps`),
  component: ApplicationsList,
})

function ApplicationsList() {
  const apps = Route.useLoaderData()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [showNewApp, setShowNewApp] = useState(false)

  const sorted = [...apps]
    .filter(app => !app.is_extension)
    .sort((a, b) => a.app_id.localeCompare(b.app_id))

  const filtered = filter
    ? sorted.filter(app => app.app_id.toLowerCase().includes(filter.toLowerCase()))
    : sorted

  return (
    <>
      <nav className="demos-subnav" style={{ position: 'relative' }}>
        <input
          type="text"
          className="filter-input"
          placeholder="Filter applications..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <div style={{ position: 'absolute', right: 'var(--space-8)' }}>
          <button className="btn btn-primary btn-sm nav-action-btn" onClick={() => setShowNewApp(true)}>
            New Application
          </button>
        </div>
      </nav>
      <div className="panel">
        {filtered.length === 0 ? (
          <div className="empty-state">No applications found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>App ID</th>
                <th>Status</th>
                <th>Resources</th>
                <th>Tables</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.app_id}>
                  <td style={{ color: '#fff', fontFamily: 'var(--font-family-base)', fontWeight: 500 }}>{app.name}</td>
                  <td>{app.app_id}</td>
                  <td>
                    <span className={`badge ${app.enabled ? 'badge-success' : 'badge-error'}`}>
                      {app.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>{app.resource_count}</td>
                  <td>{app.table_count}</td>
                  <td className="col-actions">
                    <button
                      className="btn btn-sm nav-action-btn"
                      onClick={() => navigate({ to: '/applications/$appId', params: { appId: app.app_id } })}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showNewApp && (
        <NewAppModal
          installedApps={new Set(apps.map(a => a.app_id))}
          onClose={() => setShowNewApp(false)}
        />
      )}
    </>
  )
}
