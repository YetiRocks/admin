import { useState, useEffect } from 'react'
import { useSSE, BASE_URL } from '../../hooks/useSSE'
import { MetricEntry } from './types'

interface MetricsPanelProps {
  paused: boolean
  onTogglePause: () => void
}

// Friendly display labels for known metric names
const SYSTEM_LABELS: Record<string, string> = {
  'system.cpu.usage_percent': 'System CPU',
  'process.cpu.usage_percent': 'Process CPU',
  'system.memory.used_bytes': 'Memory Used',
  'system.memory.total_bytes': 'Memory Total',
  'process.memory.rss_bytes': 'Process Memory',
  'system.fd.open_count': 'Open FDs',
  'telemetry.events_dropped': 'Events Dropped',
}

// Display order: CPU metrics first, then memory, then health indicators
const SYSTEM_ORDER: string[] = [
  'system.cpu.usage_percent',
  'process.cpu.usage_percent',
  'system.memory.used_bytes',
  'system.memory.total_bytes',
  'process.memory.rss_bytes',
  'system.fd.open_count',
  'telemetry.events_dropped',
]

function compactNumber(value: number, decimals = 1): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(decimals)}k`
  return value.toFixed(decimals)
}

function formatMetricValue(name: string, value: number): string {
  if (name.endsWith('_bytes') || name.includes('.bytes')) {
    return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }
  if (name.endsWith('_percent') || name.includes('.percent')) {
    return `${value.toFixed(1)}%`
  }
  if (name.endsWith('_ms') || name.includes('.latency_ms')) {
    return `${value.toFixed(1)} ms`
  }
  if (name.endsWith('.count') || name.endsWith('.errors') || name.endsWith('.dropped') || name.endsWith('.rate_limited')) {
    return compactNumber(value, 0)
  }
  return typeof value === 'number' ? compactNumber(value) : String(value)
}

function parseAppId(attributes?: string): string | null {
  if (!attributes || attributes === '{}') return null
  try {
    let parsed = JSON.parse(attributes)
    if (typeof parsed === 'string') parsed = JSON.parse(parsed)
    return parsed.app_id || null
  } catch {
    return null
  }
}

/** Composite key for deduplication: name + app_id */
function metricKey(m: MetricEntry): string {
  const appId = parseAppId(m.attributes)
  return appId ? `${m.name}:${appId}` : m.name
}

/** Per-app combined stats */
interface AppStats {
  appId: string
  isExtension: boolean
  rps?: MetricEntry
  p95Latency?: MetricEntry
  errorPercent?: MetricEntry
  rateLimited?: MetricEntry
}

function buildAppStats(metrics: MetricEntry[], extensionIds: Set<string>): Map<string, AppStats> {
  const statsMap = new Map<string, AppStats>()
  for (const m of metrics) {
    if (!m.name.startsWith('app.')) continue
    const appId = parseAppId(m.attributes) || 'unknown'
    if (!statsMap.has(appId)) {
      statsMap.set(appId, { appId, isExtension: extensionIds.has(appId) })
    }
    const stats = statsMap.get(appId)!
    if (m.name === 'app.requests.peak_rps') stats.rps = m
    else if (m.name === 'app.requests.p95_latency_ms') stats.p95Latency = m
    else if (m.name === 'app.requests.error_percent') stats.errorPercent = m
    else if (m.name === 'app.requests.rate_limited') stats.rateLimited = m
  }
  return statsMap
}

/** Metric names that should show warning color when value > 0 */
const WARNING_WHEN_NONZERO = new Set(['telemetry.events_dropped'])

function MetricCard({ m }: { m: MetricEntry }) {
  const label = SYSTEM_LABELS[m.name] || m.name
  const val = typeof m.value === 'number'
    ? formatMetricValue(m.name, m.value)
    : String(m.value)
  const isWarning = WARNING_WHEN_NONZERO.has(m.name) && typeof m.value === 'number' && m.value > 0

  return (
    <div className="metric-card">
      <div className="metric-name">{label}</div>
      <div className={`metric-value ${isWarning ? 'stat-warning' : ''}`}>{val}</div>
      <div className="metric-time">{formatTime(m.timestamp)}</div>
    </div>
  )
}

function fmtOrDash(entry: MetricEntry | undefined, decimals = 1): string {
  if (!entry) return '—'
  return compactNumber(entry.value, decimals)
}

function AppCard({ stats }: { stats: AppStats }) {
  const hasData = stats.rps || stats.p95Latency || stats.errorPercent
  const errPct = stats.errorPercent?.value ?? 0
  const rateLimited = stats.rateLimited?.value ?? 0

  return (
    <div className="metric-card app-card">
      <div className="metric-name">{stats.appId}</div>
      <div className="app-stats-row">
        <div className="app-stat">
          <span className="app-stat-value">{fmtOrDash(stats.rps)}</span>
          <span className="app-stat-label">peak r/s</span>
        </div>
        <div className="app-stat">
          <span className="app-stat-value">{fmtOrDash(stats.p95Latency)}</span>
          <span className="app-stat-label">p95 ms</span>
        </div>
        <div className="app-stat">
          <span className={`app-stat-value ${hasData && errPct > 0 ? 'stat-error' : ''}`}>{fmtOrDash(stats.errorPercent)}</span>
          <span className="app-stat-label">err%</span>
        </div>
        {rateLimited > 0 && (
          <div className="app-stat">
            <span className="app-stat-value stat-warning">{Math.round(rateLimited)}</span>
            <span className="app-stat-label">rate limited</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function MetricsPanel({ paused, onTogglePause }: MetricsPanelProps) {
  const { items, connected, error, clear } = useSSE<MetricEntry>({
    table: 'Metric',
    paused,
  })

  // Fetch extension IDs from the app registry (authoritative source)
  const [extensionIds, setExtensionIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    fetch(`${BASE_URL}/telemetry`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.apps)) {
          const extIds = new Set<string>(
            data.apps.filter((a: { is_extension?: boolean }) => a.is_extension).map((a: { id: string }) => a.id)
          )
          setExtensionIds(extIds)
        }
      })
      .catch(() => { /* fallback: no extension classification */ })
  }, [])

  // Deduplicate by composite key, keeping newest value.
  // SSE appends newer items to the end, so last occurrence wins.
  const latestMetrics = new Map<string, MetricEntry>()
  for (const m of items) {
    latestMetrics.set(metricKey(m), m)
  }
  const metrics = Array.from(latestMetrics.values())

  // Separate system vs app vs other
  const system: MetricEntry[] = []
  const other: MetricEntry[] = []
  for (const m of metrics) {
    if (m.name.startsWith('system.') || m.name.startsWith('process.') || m.name.startsWith('telemetry.')) {
      system.push(m)
    } else if (!m.name.startsWith('app.')) {
      other.push(m)
    }
  }
  const appStats = buildAppStats(metrics, extensionIds)
  const allApps = Array.from(appStats.values()).sort((a, b) => a.appId.localeCompare(b.appId))
  const extensions = allApps.filter(a => a.isExtension)
  const applications = allApps.filter(a => !a.isExtension)

  return (
    <div className="panel">
      <div className="panel-toolbar">
        <span className="toolbar-label">Metrics ({metrics.length} unique)</span>
        <button className="toolbar-btn" onClick={clear}>Clear</button>
        <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} title={error || (connected ? 'Connected' : 'Disconnected')} />
        <button className={`toolbar-btn ${paused ? 'btn-active' : ''}`} onClick={onTogglePause}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <div className="metrics-content">
        {metrics.length === 0 ? (
          <div className="empty-state">Waiting for metric events...</div>
        ) : (
          <>
            {system.length > 0 && (
              <div className="metrics-section">
                <div className="metrics-section-header">System</div>
                <div className="metrics-grid">
                  {system
                    .sort((a, b) => {
                      const ai = SYSTEM_ORDER.indexOf(a.name)
                      const bi = SYSTEM_ORDER.indexOf(b.name)
                      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
                    })
                    .map(m => <MetricCard key={metricKey(m)} m={m} />)}
                </div>
              </div>
            )}
            {extensions.length > 0 && (
              <div className="metrics-section">
                <div className="metrics-section-header">Extensions</div>
                <div className="metrics-grid">
                  {extensions.map(s => <AppCard key={s.appId} stats={s} />)}
                </div>
              </div>
            )}
            {applications.length > 0 && (
              <div className="metrics-section">
                <div className="metrics-section-header">Applications</div>
                <div className="metrics-grid">
                  {applications.map(s => <AppCard key={s.appId} stats={s} />)}
                </div>
              </div>
            )}
            {other.length > 0 && (
              <div className="metrics-section">
                <div className="metrics-section-header">Other</div>
                <div className="metrics-grid">
                  {other.map(m => <MetricCard key={metricKey(m)} m={m} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="panel-footer">
        <span>{items.length} total events received</span>
      </div>
    </div>
  )
}

function formatTime(ts: string): string {
  try {
    const num = parseFloat(ts)
    const d = isNaN(num) ? new Date(ts) : (num > 1e12 ? new Date(num) : new Date(num * 1000))
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    const ms = String(d.getMilliseconds()).padStart(3, '0')
    return `${hh}:${mm}:${ss}.${ms}`
  } catch {
    return ts
  }
}
