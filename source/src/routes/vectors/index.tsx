import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api, VECTORS_BASE } from '../../api'

export const Route = createFileRoute('/vectors/')({
  component: VectorsPage,
})

function VectorsPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Record<string, unknown>>(`${VECTORS_BASE}/vectors`)
      .then(setStatus)
      .catch(e => setError(e.message))
  }, [])

  return (
    <div className="vectors-page">
      <h1>Vector Search</h1>
      {error && <div className="error">{error}</div>}
      {status && (
        <div className="vectors-status">
          <pre>{JSON.stringify(status, null, 2)}</pre>
        </div>
      )}
      {!status && !error && <div>Loading...</div>}
    </div>
  )
}
