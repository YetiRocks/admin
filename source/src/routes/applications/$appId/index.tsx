import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api, TELEMETRY_BASE } from '../../../api'

const parentRoute = getRouteApi('/applications/$appId')

export const Route = createFileRoute('/applications/$appId/')({
  component: OverviewPage,
})

interface LogEntry { id: string; timestamp: string; level: string; message: string; target: string }
interface SpanEntry { id: string; timestamp: string; name: string; target: string; duration_ms?: number }
interface MetricEntry { id: string; name: string; value: number; unit?: string; timestamp: string }

function OverviewPage() {
  const { appId } = Route.useParams()
  const { detail, schema, counts } = parentRoute.useLoaderData()

  const config = detail?.config
  const tables = schema?.tables || []
  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0)

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [spans, setSpans] = useState<SpanEntry[]>([])
  const [metrics, setMetrics] = useState<MetricEntry[]>([])

  useEffect(() => {
    api<LogEntry[]>(`${TELEMETRY_BASE}/Log/?limit=50`)
      .then(data => setLogs(data.filter(l => l.target?.includes(appId) || l.message?.includes(appId)).slice(0, 20)))
      .catch(() => setLogs([]))

    api<SpanEntry[]>(`${TELEMETRY_BASE}/Span/?limit=50`)
      .then(data => setSpans(data.filter(s => s.target?.includes(appId) || s.name?.includes(appId)).slice(0, 20)))
      .catch(() => setSpans([]))

    api<MetricEntry[]>(`${TELEMETRY_BASE}/Metric/?limit=50`)
      .then(data => setMetrics(data.filter(m => m.name?.includes(appId)).slice(0, 20)))
      .catch(() => setMetrics([]))
  }, [appId])

  const formatTime = (ts: string) => {
    try {
      const d = new Date(parseFloat(ts) * 1000)
      return d.toLocaleTimeString()
    } catch { return ts }
  }

  return (
    <div className="overview-grid">
      {/* Top Left: Status */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{config?.name || appId}</span>
          <span className={`status-dot ${config?.enabled !== false ? 'connected' : 'disconnected'}`} />
        </div>
        <div className="panel-body overview-status">
          {config?.description && <p className="overview-desc">{config.description}</p>}
          <div className="overview-stats-grid">
            <div className="overview-stat">
              <div className="overview-stat-value">{config?.version || '-'}</div>
              <div className="overview-stat-label">Version</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{detail?.resource_count ?? 0}</div>
              <div className="overview-stat-label">Resources</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{tables.length}</div>
              <div className="overview-stat-label">Tables</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{totalRecords.toLocaleString()}</div>
              <div className="overview-stat-label">Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Right: Logs */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Logs</span>
          <span className="panel-badge">{logs.length}</span>
        </div>
        <div className="log-list">
          {logs.length === 0 ? (
            <div className="empty-state">No logs</div>
          ) : logs.map(l => (
            <div key={l.id} className="log-entry">
              <span className="log-time">{formatTime(l.timestamp)}</span>
              <span className={`log-level level-${l.level.toLowerCase()}`}>{l.level}</span>
              <span className="log-message">{l.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Left: Spans */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Traces</span>
          <span className="panel-badge">{spans.length}</span>
        </div>
        <div className="span-list">
          {spans.length === 0 ? (
            <div className="empty-state">No traces</div>
          ) : spans.map(s => (
            <div key={s.id} className="span-entry">
              <span className="span-time">{formatTime(s.timestamp)}</span>
              <span className="span-name">{s.name}</span>
              <span className="span-target">{s.target}</span>
              {s.duration_ms != null && (
                <span className={`span-duration ${s.duration_ms < 10 ? 'duration-fast' : s.duration_ms < 100 ? 'duration-medium' : 'duration-slow'}`}>
                  {s.duration_ms.toFixed(1)}ms
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Right: Metrics */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Metrics</span>
          <span className="panel-badge">{metrics.length}</span>
        </div>
        <div className="metrics-grid" style={{ padding: 'var(--space-3)', alignContent: 'start' }}>
          {metrics.length === 0 ? (
            <div className="empty-state">No metrics</div>
          ) : metrics.map(m => (
            <div key={m.id} className="metric-card">
              <div className="metric-name">{m.name}</div>
              <div className="metric-value">{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
