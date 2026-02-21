import { DatadogConfig } from '../types'

interface Props {
  config: DatadogConfig
  onChange: (config: DatadogConfig) => void
}

const DATADOG_SITES = [
  { value: 'datadoghq.com', label: 'US1 (datadoghq.com)' },
  { value: 'us3.datadoghq.com', label: 'US3 (us3.datadoghq.com)' },
  { value: 'us5.datadoghq.com', label: 'US5 (us5.datadoghq.com)' },
  { value: 'datadoghq.eu', label: 'EU1 (datadoghq.eu)' },
  { value: 'ddog-gov.com', label: 'US1-FED (ddog-gov.com)' },
  { value: 'ap1.datadoghq.com', label: 'AP1 (ap1.datadoghq.com)' },
]

export function DatadogForm({ config, onChange }: Props) {
  const set = <K extends keyof DatadogConfig>(key: K, value: DatadogConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="config-form">
      <div className="config-section">
        <h4>Datadog Site</h4>
        <p className="config-help">Select the Datadog site that matches your account region. This determines the intake endpoint URLs.</p>
        <label className="form-label">
          Site
          <select
            className="form-input"
            value={config.site}
            onChange={e => set('site', e.target.value)}
          >
            {DATADOG_SITES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="config-section">
        <h4>Authentication</h4>
        <p className="config-help">API and Application keys are found in Datadog &gt; Organization Settings &gt; API Keys / Application Keys.</p>
        <label className="form-label">
          API Key
          <input
            className="form-input"
            type="password"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={config.apiKey}
            onChange={e => set('apiKey', e.target.value)}
          />
          <span className="form-hint">Required. 32-character hex key used for all data submission.</span>
        </label>
        <label className="form-label">
          Application Key
          <input
            className="form-input"
            type="password"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={config.appKey}
            onChange={e => set('appKey', e.target.value)}
          />
          <span className="form-hint">Optional. 40-character key needed only for reading dashboards/monitors via the Datadog API.</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Tagging</h4>
        <p className="config-help">Tags are attached to all submitted data for filtering in Datadog dashboards.</p>
        <label className="form-label">
          Service Name
          <input
            className="form-input"
            type="text"
            placeholder="yeti"
            value={config.service}
            onChange={e => set('service', e.target.value)}
          />
          <span className="form-hint">Sets the unified service tag <code>service</code>.</span>
        </label>
        <label className="form-label">
          Environment
          <input
            className="form-input"
            type="text"
            placeholder="production"
            value={config.env}
            onChange={e => set('env', e.target.value)}
          />
          <span className="form-hint">Sets the unified service tag <code>env</code>.</span>
        </label>
        <label className="form-label">
          Custom Tags
          <input
            className="form-input"
            type="text"
            placeholder="team:platform, version:1.0"
            value={config.tags}
            onChange={e => set('tags', e.target.value)}
          />
          <span className="form-hint">Comma-separated key:value pairs attached to all data.</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Data Selection</h4>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendLogs} onChange={e => set('sendLogs', e.target.checked)} />
            Send Logs (via /api/v2/logs intake)
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendMetrics} onChange={e => set('sendMetrics', e.target.checked)} />
            Send Metrics (via /api/v2/series intake)
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendTraces} onChange={e => set('sendTraces', e.target.checked)} />
            Send Traces (via /api/v0.2/traces intake)
          </label>
        </div>
      </div>
    </div>
  )
}
