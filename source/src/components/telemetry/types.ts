export interface LogEntry {
  id: string
  timestamp: string
  level: string
  target: string
  message: string
  fields?: string
}

export interface SpanEntry {
  id: string
  name: string
  target: string
  level: string
  startTime: string
  endTime?: string
  durationMs?: number
  fields?: string
}

export interface MetricEntry {
  id: string
  name: string
  value: number
  attributes?: string
  timestamp: string
}

export interface TelemetryStatus {
  collector: boolean
  writer: boolean
}

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export const LOG_LEVELS: LogLevel[] = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']

export type NavId = 'logs' | 'spans' | 'metrics' | 'status' | 'connector'

// --- Connector configs per provider ---

export interface GrafanaConfig {
  prometheusUrl: string
  lokiUrl: string
  userId: string
  apiKey: string
  sendLogs: boolean
  sendMetrics: boolean
  sendTraces: boolean
}

export interface DatadogConfig {
  site: string
  apiKey: string
  appKey: string
  service: string
  env: string
  tags: string
  sendLogs: boolean
  sendMetrics: boolean
  sendTraces: boolean
}

export interface OtlpConfig {
  endpoint: string
  protocol: 'grpc' | 'http/protobuf'
  headers: string
  compression: 'none' | 'gzip'
  insecure: boolean
  sendLogs: boolean
  sendMetrics: boolean
  sendTraces: boolean
}

export interface SplunkConfig {
  hecUrl: string
  hecToken: string
  index: string
  source: string
  sourceType: string
  verifySsl: boolean
  sendLogs: boolean
  sendMetrics: boolean
}

export interface ElasticConfig {
  nodeUrls: string
  apiKey: string
  username: string
  password: string
  logIndex: string
  metricIndex: string
  traceIndex: string
  pipeline: string
  verifySsl: boolean
  sendLogs: boolean
  sendMetrics: boolean
  sendTraces: boolean
}

export interface CustomConfig {
  url: string
  method: 'POST' | 'PUT'
  headers: string
  authType: 'none' | 'bearer' | 'basic'
  authToken: string
  basicUser: string
  basicPass: string
  batchSize: number
  flushIntervalSec: number
}

export type ConnectorConfig =
  | { type: 'grafana'; config: GrafanaConfig }
  | { type: 'datadog'; config: DatadogConfig }
  | { type: 'otlp'; config: OtlpConfig }
  | { type: 'splunk'; config: SplunkConfig }
  | { type: 'elastic'; config: ElasticConfig }
  | { type: 'custom'; config: CustomConfig }

export interface Connector {
  id: string
  name: string
  type: ConnectorType
  enabled: boolean
  config: ConnectorConfig
}

export type ConnectorType = 'grafana' | 'datadog' | 'otlp' | 'splunk' | 'elastic' | 'custom'

export const CONNECTOR_TYPES: { id: ConnectorType; label: string }[] = [
  { id: 'grafana', label: 'Grafana' },
  { id: 'datadog', label: 'Datadog' },
  { id: 'otlp', label: 'OTLP' },
  { id: 'splunk', label: 'Splunk' },
  { id: 'elastic', label: 'Elasticsearch' },
  { id: 'custom', label: 'Custom' },
]

export const DEFAULT_CONFIGS: Record<ConnectorType, ConnectorConfig> = {
  grafana: {
    type: 'grafana',
    config: {
      prometheusUrl: 'https://prometheus-prod-01-us-east-0.grafana.net/api/prom/push',
      lokiUrl: 'https://logs-prod-us-central1.grafana.net/loki/api/v1/push',
      userId: '',
      apiKey: '',
      sendLogs: true,
      sendMetrics: true,
      sendTraces: true,
    },
  },
  datadog: {
    type: 'datadog',
    config: {
      site: 'datadoghq.com',
      apiKey: '',
      appKey: '',
      service: '',
      env: '',
      tags: '',
      sendLogs: true,
      sendMetrics: true,
      sendTraces: true,
    },
  },
  otlp: {
    type: 'otlp',
    config: {
      endpoint: 'http://localhost:4317',
      protocol: 'grpc',
      headers: '',
      compression: 'gzip',
      insecure: false,
      sendLogs: true,
      sendMetrics: true,
      sendTraces: true,
    },
  },
  splunk: {
    type: 'splunk',
    config: {
      hecUrl: 'https://input-prd-p-xxxxx.cloud.splunk.com:8088',
      hecToken: '',
      index: 'main',
      source: 'yeti-telemetry',
      sourceType: '_json',
      verifySsl: true,
      sendLogs: true,
      sendMetrics: true,
    },
  },
  elastic: {
    type: 'elastic',
    config: {
      nodeUrls: 'https://localhost:9200',
      apiKey: '',
      username: '',
      password: '',
      logIndex: 'yeti-logs',
      metricIndex: 'yeti-metrics',
      traceIndex: 'yeti-traces',
      pipeline: '',
      verifySsl: true,
      sendLogs: true,
      sendMetrics: true,
      sendTraces: true,
    },
  },
  custom: {
    type: 'custom',
    config: {
      url: '',
      method: 'POST',
      headers: 'Content-Type: application/json',
      authType: 'none',
      authToken: '',
      basicUser: '',
      basicPass: '',
      batchSize: 100,
      flushIntervalSec: 10,
    },
  },
}
