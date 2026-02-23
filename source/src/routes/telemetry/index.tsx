import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LogsPanel } from '../../components/telemetry/LogsPanel'
import { SpansPanel } from '../../components/telemetry/SpansPanel'
import { MetricsPanel } from '../../components/telemetry/MetricsPanel'

type Tab = 'logs' | 'spans' | 'metrics'

export const Route = createFileRoute('/telemetry/')({
  component: TelemetryPage,
})

function TelemetryPage() {
  const [tab, setTab] = useState<Tab>('logs')
  const [paused, setPaused] = useState(false)

  return (
    <>
      <nav className="demos-subnav">
        <button className={`subnav-link ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>Logs</button>
        <button className={`subnav-link ${tab === 'spans' ? 'active' : ''}`} onClick={() => setTab('spans')}>Spans</button>
        <button className={`subnav-link ${tab === 'metrics' ? 'active' : ''}`} onClick={() => setTab('metrics')}>Metrics</button>
      </nav>
      <div className="telemetry-content">
        {tab === 'logs' && <LogsPanel paused={paused} onTogglePause={() => setPaused(p => !p)} />}
        {tab === 'spans' && <SpansPanel paused={paused} onTogglePause={() => setPaused(p => !p)} />}
        {tab === 'metrics' && <MetricsPanel paused={paused} onTogglePause={() => setPaused(p => !p)} />}
      </div>
    </>
  )
}
