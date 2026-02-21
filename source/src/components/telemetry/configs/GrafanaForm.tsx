import { GrafanaConfig } from '../types'

interface Props {
  config: GrafanaConfig
  onChange: (config: GrafanaConfig) => void
}

export function GrafanaForm({ config, onChange }: Props) {
  const set = <K extends keyof GrafanaConfig>(key: K, value: GrafanaConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="config-form">
      <div className="config-section">
        <h4>Prometheus Remote Write</h4>
        <p className="config-help">Metrics are pushed via Prometheus remote_write protocol to your Grafana Cloud or Mimir instance.</p>
        <label className="form-label">
          Remote Write URL
          <input
            className="form-input"
            type="url"
            placeholder="https://prometheus-prod-01-us-east-0.grafana.net/api/prom/push"
            value={config.prometheusUrl}
            onChange={e => set('prometheusUrl', e.target.value)}
          />
          <span className="form-hint">Found in Grafana Cloud &gt; Prometheus &gt; Details. Ends with /api/prom/push</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Loki</h4>
        <p className="config-help">Logs are pushed via the Loki HTTP API.</p>
        <label className="form-label">
          Loki Push URL
          <input
            className="form-input"
            type="url"
            placeholder="https://logs-prod-us-central1.grafana.net/loki/api/v1/push"
            value={config.lokiUrl}
            onChange={e => set('lokiUrl', e.target.value)}
          />
          <span className="form-hint">Found in Grafana Cloud &gt; Loki &gt; Details. Ends with /loki/api/v1/push</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Authentication</h4>
        <p className="config-help">Uses HTTP Basic Auth. The user ID is your Grafana Cloud instance ID (numeric). The API key is a Grafana Cloud API token with MetricsPublisher and/or logs:write scope.</p>
        <label className="form-label">
          Instance / User ID
          <input
            className="form-input"
            type="text"
            placeholder="123456"
            value={config.userId}
            onChange={e => set('userId', e.target.value)}
          />
        </label>
        <label className="form-label">
          API Key
          <input
            className="form-input"
            type="password"
            placeholder="glc_..."
            value={config.apiKey}
            onChange={e => set('apiKey', e.target.value)}
          />
          <span className="form-hint">Generate at grafana.com &gt; My Account &gt; API Keys</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Data Selection</h4>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendLogs} onChange={e => set('sendLogs', e.target.checked)} />
            Send Logs (via Loki)
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendMetrics} onChange={e => set('sendMetrics', e.target.checked)} />
            Send Metrics (via Prometheus remote_write)
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendTraces} onChange={e => set('sendTraces', e.target.checked)} />
            Send Traces (via Tempo OTLP endpoint)
          </label>
        </div>
      </div>
    </div>
  )
}
