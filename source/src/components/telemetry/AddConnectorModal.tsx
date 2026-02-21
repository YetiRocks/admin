import { useState } from 'react'
import { ConnectorType, CONNECTOR_TYPES, Connector, DEFAULT_CONFIGS } from './types'

interface Props {
  onClose: () => void
  onAdd: (connector: Connector) => void
}

export function AddConnectorModal({ onClose, onAdd }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ConnectorType>('grafana')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      enabled: true,
      config: structuredClone(DEFAULT_CONFIGS[type]),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Connector</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <label className="form-label">
            Name
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Production Grafana"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="form-label">
            Type
            <select
              className="form-input"
              value={type}
              onChange={e => setType(e.target.value as ConnectorType)}
            >
              {CONNECTOR_TYPES.map(ct => (
                <option key={ct.id} value={ct.id}>{ct.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!name.trim()}>
            Add Connector
          </button>
        </div>
      </div>
    </div>
  )
}
