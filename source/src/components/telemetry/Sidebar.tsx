import { NavId, Connector } from './types'

interface Props {
  selected: NavId
  onSelect: (id: NavId) => void
  connectors: Connector[]
  selectedConnector: string | null
  onSelectConnector: (id: string) => void
  onAddConnector: () => void
}

const NAV_ITEMS: { id: NavId; label: string }[] = [
  { id: 'logs', label: 'Logs' },
  { id: 'spans', label: 'Traces' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'status', label: 'System Status' },
]

export function Sidebar({ selected, onSelect, connectors, selectedConnector, onSelectConnector, onAddConnector }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">Telemetry</div>
      <div className="sidebar-list">
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`sidebar-item ${selected === item.id && !selectedConnector ? 'active' : ''}`}
            onClick={() => { onSelect(item.id); onSelectConnector(''); }}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div className="sidebar-header">Connectors</div>
      <div className="sidebar-list">
        {connectors.length === 0 ? (
          <div className="sidebar-empty">No connectors configured</div>
        ) : (
          connectors.map(c => (
            <div
              key={c.id}
              className={`sidebar-item ${selectedConnector === c.id ? 'active' : ''}`}
              onClick={() => onSelectConnector(c.id)}
            >
              {c.name}
              <span className={`badge ${c.enabled ? 'on' : ''}`}>
                {c.enabled ? 'on' : 'off'}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="sidebar-footer">
        <button className="btn btn-primary" onClick={onAddConnector}>
          + Add Connector
        </button>
      </div>
    </div>
  )
}
