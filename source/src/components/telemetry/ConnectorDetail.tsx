import { Connector, ConnectorConfig, CONNECTOR_TYPES } from './types'
import { GrafanaForm } from './configs/GrafanaForm'
import { DatadogForm } from './configs/DatadogForm'
import { OtlpForm } from './configs/OtlpForm'
import { SplunkForm } from './configs/SplunkForm'
import { ElasticForm } from './configs/ElasticForm'
import { CustomForm } from './configs/CustomForm'

interface Props {
  connector: Connector
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onUpdateConfig: (id: string, config: ConnectorConfig) => void
}

const TYPE_HINTS: Record<string, string> = {
  grafana: 'Push metrics via Prometheus remote_write and logs via Loki HTTP API to Grafana Cloud or a self-hosted Grafana stack.',
  datadog: 'Forward logs, metrics, and traces to Datadog using the HTTP intake APIs.',
  otlp: 'Export via OpenTelemetry Protocol (OTLP) over gRPC or HTTP to any OTLP-compatible backend.',
  splunk: 'Send events to Splunk via the HTTP Event Collector (HEC) endpoint.',
  elastic: 'Index logs, metrics, and traces into Elasticsearch or Elastic Cloud via the Bulk API.',
  custom: 'Send batched JSON payloads to any HTTP webhook endpoint.',
}

export function ConnectorDetail({ connector, onToggle, onRemove, onUpdateConfig }: Props) {
  const typeLabel = CONNECTOR_TYPES.find(t => t.id === connector.type)?.label || connector.type
  const cfg = connector.config

  const handleConfigChange = (innerConfig: ConnectorConfig['config']) => {
    onUpdateConfig(connector.id, { ...cfg, config: innerConfig } as ConnectorConfig)
  }

  return (
    <div className="panel">
      <div className="connector-detail">
        <div className="connector-header-row">
          <h2>{connector.name}</h2>
          <span className={`badge-lg ${connector.enabled ? 'on' : ''}`}>
            {connector.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="connector-type-badge">{typeLabel}</div>
        <p className="connector-hint">{TYPE_HINTS[connector.type] || ''}</p>

        {cfg.type === 'grafana' && <GrafanaForm config={cfg.config} onChange={handleConfigChange} />}
        {cfg.type === 'datadog' && <DatadogForm config={cfg.config} onChange={handleConfigChange} />}
        {cfg.type === 'otlp' && <OtlpForm config={cfg.config} onChange={handleConfigChange} />}
        {cfg.type === 'splunk' && <SplunkForm config={cfg.config} onChange={handleConfigChange} />}
        {cfg.type === 'elastic' && <ElasticForm config={cfg.config} onChange={handleConfigChange} />}
        {cfg.type === 'custom' && <CustomForm config={cfg.config} onChange={handleConfigChange} />}

        <div className="connector-actions">
          <button
            className={`btn ${connector.enabled ? '' : 'btn-primary'}`}
            onClick={() => onToggle(connector.id)}
          >
            {connector.enabled ? 'Disable' : 'Enable'}
          </button>
          <button className="btn btn-danger" onClick={() => onRemove(connector.id)}>
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
