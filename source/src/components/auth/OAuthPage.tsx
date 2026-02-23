import { useState, useEffect } from 'react'
import { api, BASE } from './api'
import { OAuthProvider } from './types'
import { AddProviderModal } from './AddProviderModal'

interface OAuthPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  triggerNew?: number
}

export function OAuthPage({ showToast, triggerNew }: OAuthPageProps) {
  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<OAuthProvider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    if (triggerNew && triggerNew > 0) {
      setEditingProvider(null)
      setShowModal(true)
    }
  }, [triggerNew])

  const loadProviders = () => {
    api<{ providers: OAuthProvider[] }>(`${BASE}/oauth_providers`)
      .then((data) => setProviders(data.providers))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProviders() }, [])

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editingProvider) {
        await api(`${BASE}/oauth_providers/${encodeURIComponent(editingProvider.name)}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
        showToast(`Provider "${data.name}" updated`, 'success')
      } else {
        await api(`${BASE}/oauth_providers`, {
          method: 'POST',
          body: JSON.stringify(data),
        })
        showToast(`Provider "${data.name}" added`, 'success')
      }
      setShowModal(false)
      setEditingProvider(null)
      loadProviders()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save provider', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api(`${BASE}/oauth_providers/${encodeURIComponent(deleteTarget)}`, { method: 'DELETE' })
      showToast(`Provider "${deleteTarget}" deleted`, 'success')
      setDeleteTarget(null)
      loadProviders()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
      setDeleteTarget(null)
    }
  }

  if (loading) return <div className="page-body empty-state">Loading...</div>

  return (
    <>
      {providers.length === 0 ? (
        <div className="empty-state">No OAuth providers configured.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Authorize URL</th>
              <th>Scopes</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.name}>
                <td>{provider.name}</td>
                <td><span className="badge badge-info">{provider.type}</span></td>
                <td>{provider.authorize_url}</td>
                <td>{provider.scopes.join(', ')}</td>
                <td className="col-actions">
                  <div className="btn-group">
                    <button
                      className="btn btn-sm"
                      onClick={() => { setEditingProvider(provider); setShowModal(true) }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => setDeleteTarget(provider.name)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Delete Provider?</h2>
            <p className="modal-message">Are you sure you want to delete "{deleteTarget}"? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <AddProviderModal
          provider={editingProvider}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditingProvider(null) }}
        />
      )}
    </>
  )
}
