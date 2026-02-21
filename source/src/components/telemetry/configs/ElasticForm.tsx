import { ElasticConfig } from '../types'

interface Props {
  config: ElasticConfig
  onChange: (config: ElasticConfig) => void
}

export function ElasticForm({ config, onChange }: Props) {
  const set = <K extends keyof ElasticConfig>(key: K, value: ElasticConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="config-form">
      <div className="config-section">
        <h4>Cluster Connection</h4>
        <p className="config-help">Connect to Elasticsearch or OpenSearch. For Elastic Cloud, use the Cloud ID endpoint URL.</p>
        <label className="form-label">
          Node URLs
          <input
            className="form-input"
            type="text"
            placeholder="https://localhost:9200"
            value={config.nodeUrls}
            onChange={e => set('nodeUrls', e.target.value)}
          />
          <span className="form-hint">Comma-separated list of node URLs for client-side load balancing.</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Authentication</h4>
        <p className="config-help">Choose API Key auth (recommended for Elastic Cloud) or basic username/password. If both are provided, API Key takes precedence.</p>
        <label className="form-label">
          API Key
          <input
            className="form-input"
            type="password"
            placeholder="base64-encoded-api-key"
            value={config.apiKey}
            onChange={e => set('apiKey', e.target.value)}
          />
          <span className="form-hint">Base64-encoded API key. Create via POST /_security/api_key or Kibana &gt; Stack Management &gt; API Keys.</span>
        </label>
        <div className="form-divider">or</div>
        <label className="form-label">
          Username
          <input
            className="form-input"
            type="text"
            placeholder="elastic"
            value={config.username}
            onChange={e => set('username', e.target.value)}
          />
        </label>
        <label className="form-label">
          Password
          <input
            className="form-input"
            type="password"
            value={config.password}
            onChange={e => set('password', e.target.value)}
          />
        </label>
      </div>

      <div className="config-section">
        <h4>Index Configuration</h4>
        <p className="config-help">Data is indexed using the Bulk API. Each telemetry type goes to its own index pattern. Index templates or data streams should be configured in Elasticsearch.</p>
        <label className="form-label">
          Log Index
          <input
            className="form-input"
            type="text"
            placeholder="yeti-logs"
            value={config.logIndex}
            onChange={e => set('logIndex', e.target.value)}
          />
          <span className="form-hint">Index name or data stream for log documents. A date suffix (-YYYY.MM.dd) is appended.</span>
        </label>
        <label className="form-label">
          Metric Index
          <input
            className="form-input"
            type="text"
            placeholder="yeti-metrics"
            value={config.metricIndex}
            onChange={e => set('metricIndex', e.target.value)}
          />
        </label>
        <label className="form-label">
          Trace Index
          <input
            className="form-input"
            type="text"
            placeholder="yeti-traces"
            value={config.traceIndex}
            onChange={e => set('traceIndex', e.target.value)}
          />
        </label>
        <label className="form-label">
          Ingest Pipeline
          <input
            className="form-input"
            type="text"
            placeholder="(optional)"
            value={config.pipeline}
            onChange={e => set('pipeline', e.target.value)}
          />
          <span className="form-hint">Optional pipeline name applied to all bulk requests for field enrichment or transformation.</span>
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
            Send Metrics
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendTraces} onChange={e => set('sendTraces', e.target.checked)} />
            Send Traces
          </label>
        </div>
      </div>
    </div>
  )
}
