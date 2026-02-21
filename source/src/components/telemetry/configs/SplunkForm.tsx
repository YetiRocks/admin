import { SplunkConfig } from '../types'

interface Props {
  config: SplunkConfig
  onChange: (config: SplunkConfig) => void
}

export function SplunkForm({ config, onChange }: Props) {
  const set = <K extends keyof SplunkConfig>(key: K, value: SplunkConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="config-form">
      <div className="config-section">
        <h4>HTTP Event Collector (HEC)</h4>
        <p className="config-help">Events are sent to Splunk via HEC. Enable HEC in Splunk &gt; Settings &gt; Data Inputs &gt; HTTP Event Collector.</p>
        <label className="form-label">
          HEC Endpoint URL
          <input
            className="form-input"
            type="url"
            placeholder="https://input-prd-p-xxxxx.cloud.splunk.com:8088"
            value={config.hecUrl}
            onChange={e => set('hecUrl', e.target.value)}
          />
          <span className="form-hint">
            The base URL of your HEC endpoint. Port 8088 by default.
            The path /services/collector/event is appended automatically.
          </span>
        </label>
        <label className="form-label">
          HEC Token
          <input
            className="form-input"
            type="password"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={config.hecToken}
            onChange={e => set('hecToken', e.target.value)}
          />
          <span className="form-hint">UUID token generated when creating the HEC input. Sent as Authorization: Splunk &lt;token&gt;.</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Event Metadata</h4>
        <p className="config-help">These fields are set on each HEC event and control where data lands in Splunk.</p>
        <label className="form-label">
          Index
          <input
            className="form-input"
            type="text"
            placeholder="main"
            value={config.index}
            onChange={e => set('index', e.target.value)}
          />
          <span className="form-hint">Target Splunk index. Must exist and be allowed by the HEC token's configuration.</span>
        </label>
        <label className="form-label">
          Source
          <input
            className="form-input"
            type="text"
            placeholder="yeti-telemetry"
            value={config.source}
            onChange={e => set('source', e.target.value)}
          />
          <span className="form-hint">Identifies the data source in Splunk searches (source="yeti-telemetry").</span>
        </label>
        <label className="form-label">
          Source Type
          <input
            className="form-input"
            type="text"
            placeholder="_json"
            value={config.sourceType}
            onChange={e => set('sourceType', e.target.value)}
          />
          <span className="form-hint">Controls field extraction. Use _json for structured JSON events.</span>
        </label>
      </div>

      <div className="config-section">
        <h4>TLS</h4>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={config.verifySsl} onChange={e => set('verifySsl', e.target.checked)} />
            Verify SSL certificate
          </label>
        </div>
        <span className="form-hint">Disable for self-signed certificates in development.</span>
      </div>

      <div className="config-section">
        <h4>Data Selection</h4>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendLogs} onChange={e => set('sendLogs', e.target.checked)} />
            Send Logs
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendMetrics} onChange={e => set('sendMetrics', e.target.checked)} />
            Send Metrics (via HEC metrics events)
          </label>
        </div>
      </div>
    </div>
  )
}
