import { useState, useEffect } from 'react'
import { BASE_URL } from '../../hooks/useSSE'
import { TelemetryStatus } from './types'

interface SettingsPanelProps {
  connections: { logs: boolean; spans: boolean; metrics: boolean }
}

export function SettingsPanel({ connections }: SettingsPanelProps) {
  const [status, setStatus] = useState<TelemetryStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch(`${BASE_URL}/telemetry`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStatus(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <div className="settings-content">
        <section className="settings-section">
          <h3>Telemetry System</h3>
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : error ? (
            <div className="error-state">Error: {error}</div>
          ) : status ? (
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Collector</span>
                <span className={`status-value ${status.collector ? 'status-active' : 'status-inactive'}`}>
                  {status.collector ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Writer</span>
                <span className={`status-value ${status.writer ? 'status-active' : 'status-inactive'}`}>
                  {status.writer ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="settings-section">
          <h3>SSE Connections</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Logs Stream</span>
              <span className={`status-value ${connections.logs ? 'status-active' : 'status-inactive'}`}>
                {connections.logs ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Spans Stream</span>
              <span className={`status-value ${connections.spans ? 'status-active' : 'status-inactive'}`}>
                {connections.spans ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Metrics Stream</span>
              <span className={`status-value ${connections.metrics ? 'status-active' : 'status-inactive'}`}>
                {connections.metrics ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3>API Endpoints</h3>
          <div className="endpoint-list">
            <code>GET /yeti-telemetry/telemetry</code>
            <code>GET /yeti-telemetry/Log</code>
            <code>GET /yeti-telemetry/Span</code>
            <code>GET /yeti-telemetry/Metric</code>
            <code>GET /yeti-telemetry/Log?stream=sse</code>
            <code>GET /yeti-telemetry/Span?stream=sse</code>
            <code>GET /yeti-telemetry/Metric?stream=sse</code>
          </div>
        </section>
      </div>
    </div>
  )
}
