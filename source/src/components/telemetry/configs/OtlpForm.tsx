import { OtlpConfig } from '../types'

interface Props {
  config: OtlpConfig
  onChange: (config: OtlpConfig) => void
}

export function OtlpForm({ config, onChange }: Props) {
  const set = <K extends keyof OtlpConfig>(key: K, value: OtlpConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="config-form">
      <div className="config-section">
        <h4>OTLP Endpoint</h4>
        <p className="config-help">Exports telemetry via the OpenTelemetry Protocol. Compatible with any OTLP receiver: Jaeger, Zipkin, Grafana Alloy, Datadog Agent, AWS X-Ray, etc.</p>
        <label className="form-label">
          Endpoint
          <input
            className="form-input"
            type="url"
            placeholder="http://localhost:4317"
            value={config.endpoint}
            onChange={e => set('endpoint', e.target.value)}
          />
          <span className="form-hint">
            gRPC default: port 4317. HTTP default: port 4318.
            For HTTP the paths /v1/logs, /v1/metrics, /v1/traces are appended automatically.
          </span>
        </label>
      </div>

      <div className="config-section">
        <h4>Protocol</h4>
        <label className="form-label">
          Transport
          <select
            className="form-input"
            value={config.protocol}
            onChange={e => set('protocol', e.target.value as OtlpConfig['protocol'])}
          >
            <option value="grpc">gRPC (OTLP/gRPC)</option>
            <option value="http/protobuf">HTTP/Protobuf (OTLP/HTTP)</option>
          </select>
          <span className="form-hint">gRPC uses HTTP/2 with protobuf. HTTP/Protobuf uses HTTP/1.1 POST with protobuf body. Most collectors support both.</span>
        </label>
        <label className="form-label">
          Compression
          <select
            className="form-input"
            value={config.compression}
            onChange={e => set('compression', e.target.value as OtlpConfig['compression'])}
          >
            <option value="gzip">gzip</option>
            <option value="none">None</option>
          </select>
        </label>
      </div>

      <div className="config-section">
        <h4>Headers</h4>
        <p className="config-help">Additional headers sent with each export request. Used for authentication tokens or routing metadata.</p>
        <label className="form-label">
          Custom Headers
          <textarea
            className="form-input form-textarea"
            placeholder={"Authorization: Bearer <token>\nX-Custom-Header: value"}
            value={config.headers}
            onChange={e => set('headers', e.target.value)}
            rows={3}
          />
          <span className="form-hint">One header per line in <code>Key: Value</code> format. Corresponds to OTEL_EXPORTER_OTLP_HEADERS.</span>
        </label>
      </div>

      <div className="config-section">
        <h4>TLS</h4>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={config.insecure} onChange={e => set('insecure', e.target.checked)} />
            Insecure (skip TLS verification)
          </label>
        </div>
        <span className="form-hint">Enable for local development with self-signed certificates. Corresponds to OTEL_EXPORTER_OTLP_INSECURE.</span>
      </div>

      <div className="config-section">
        <h4>Data Selection</h4>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendLogs} onChange={e => set('sendLogs', e.target.checked)} />
            Send Logs (/v1/logs)
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendMetrics} onChange={e => set('sendMetrics', e.target.checked)} />
            Send Metrics (/v1/metrics)
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={config.sendTraces} onChange={e => set('sendTraces', e.target.checked)} />
            Send Traces (/v1/traces)
          </label>
        </div>
      </div>
    </div>
  )
}
