import { CustomConfig } from '../types'

interface Props {
  config: CustomConfig
  onChange: (config: CustomConfig) => void
}

export function CustomForm({ config, onChange }: Props) {
  const set = <K extends keyof CustomConfig>(key: K, value: CustomConfig[K]) =>
    onChange({ ...config, [key]: value })

  return (
    <div className="config-form">
      <div className="config-section">
        <h4>Webhook Endpoint</h4>
        <p className="config-help">Send telemetry data as JSON to any HTTP endpoint. Events are batched and flushed periodically.</p>
        <label className="form-label">
          URL
          <input
            className="form-input"
            type="url"
            placeholder="https://your-endpoint.example.com/ingest"
            value={config.url}
            onChange={e => set('url', e.target.value)}
          />
        </label>
        <label className="form-label">
          HTTP Method
          <select
            className="form-input"
            value={config.method}
            onChange={e => set('method', e.target.value as CustomConfig['method'])}
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </label>
      </div>

      <div className="config-section">
        <h4>Headers</h4>
        <label className="form-label">
          Custom Headers
          <textarea
            className="form-input form-textarea"
            placeholder={"Content-Type: application/json\nX-Custom-Header: value"}
            value={config.headers}
            onChange={e => set('headers', e.target.value)}
            rows={3}
          />
          <span className="form-hint">One header per line in <code>Key: Value</code> format.</span>
        </label>
      </div>

      <div className="config-section">
        <h4>Authentication</h4>
        <label className="form-label">
          Auth Type
          <select
            className="form-input"
            value={config.authType}
            onChange={e => set('authType', e.target.value as CustomConfig['authType'])}
          >
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
        </label>

        {config.authType === 'bearer' && (
          <label className="form-label">
            Bearer Token
            <input
              className="form-input"
              type="password"
              placeholder="your-api-token"
              value={config.authToken}
              onChange={e => set('authToken', e.target.value)}
            />
            <span className="form-hint">Sent as Authorization: Bearer &lt;token&gt;</span>
          </label>
        )}

        {config.authType === 'basic' && (
          <>
            <label className="form-label">
              Username
              <input
                className="form-input"
                type="text"
                value={config.basicUser}
                onChange={e => set('basicUser', e.target.value)}
              />
            </label>
            <label className="form-label">
              Password
              <input
                className="form-input"
                type="password"
                value={config.basicPass}
                onChange={e => set('basicPass', e.target.value)}
              />
            </label>
          </>
        )}
      </div>

      <div className="config-section">
        <h4>Batching</h4>
        <p className="config-help">Events are collected into batches before sending to reduce HTTP overhead.</p>
        <label className="form-label">
          Batch Size
          <input
            className="form-input"
            type="number"
            min={1}
            max={10000}
            value={config.batchSize}
            onChange={e => set('batchSize', parseInt(e.target.value) || 100)}
          />
          <span className="form-hint">Maximum events per request. Batch is flushed when this count is reached.</span>
        </label>
        <label className="form-label">
          Flush Interval (seconds)
          <input
            className="form-input"
            type="number"
            min={1}
            max={300}
            value={config.flushIntervalSec}
            onChange={e => set('flushIntervalSec', parseInt(e.target.value) || 10)}
          />
          <span className="form-hint">Partial batches are flushed after this interval.</span>
        </label>
      </div>
    </div>
  )
}
