import { useState, useRef, useEffect } from 'react'
import { useSSE } from '../../hooks/useSSE'
import { LogEntry, LogLevel, LOG_LEVELS } from './types'

interface LogsPanelProps {
  paused: boolean
  onTogglePause: () => void
}

const LEVEL_CLASS: Record<string, string> = {
  TRACE: 'level-trace',
  DEBUG: 'level-debug',
  INFO: 'level-info',
  WARN: 'level-warn',
  ERROR: 'level-error',
}

export function LogsPanel({ paused, onTogglePause }: LogsPanelProps) {
  const [enabledLevels, setEnabledLevels] = useState<Set<LogLevel>>(new Set(LOG_LEVELS))
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const { items, connected, error, clear } = useSSE<LogEntry>({
    table: 'Log',
    paused,
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [items, autoScroll])

  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50)
  }

  const toggleLevel = (level: LogLevel) => {
    setEnabledLevels(prev => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  const searchLower = search.toLowerCase()
  const filtered = items.filter(log => {
    if (!enabledLevels.has(log.level as LogLevel)) return false
    if (search && !log.message.toLowerCase().includes(searchLower) && !log.target.toLowerCase().includes(searchLower)) return false
    return true
  })

  return (
    <div className="panel">
      <div className="panel-toolbar">
        <div className="level-filters">
          {LOG_LEVELS.map(level => (
            <button
              key={level}
              className={`level-btn ${LEVEL_CLASS[level]} ${enabledLevels.has(level) ? 'active' : ''}`}
              onClick={() => toggleLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="Filter by target or message..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="toolbar-btn" onClick={clear}>Clear</button>
        <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} title={error || (connected ? 'Connected' : 'Disconnected')} />
        <button className={`toolbar-btn ${paused ? 'btn-active' : ''}`} onClick={onTogglePause}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <div className="log-list" ref={listRef} onScroll={handleScroll}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            {items.length === 0 ? 'Waiting for log events...' : 'No logs match current filters'}
          </div>
        ) : (
          filtered.map((log, i) => (
            <div key={log.id || i} className={`log-entry ${LEVEL_CLASS[log.level] || ''}`}>
              <span className="log-time">{formatTime(log.timestamp)}</span>
              <span className={`log-level ${LEVEL_CLASS[log.level] || ''}`}>{log.level.padEnd(5)}</span>
              <span className="log-target">{log.target}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
      <div className="panel-footer">
        <span>{filtered.length} / {items.length} events</span>
        {!autoScroll && <button className="toolbar-btn" onClick={() => { setAutoScroll(true) }}>Scroll to bottom</button>}
      </div>
    </div>
  )
}

function formatTime(ts: string): string {
  try {
    const num = parseFloat(ts)
    const d = isNaN(num) ? new Date(ts) : new Date(num * 1000)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    const ms = String(d.getMilliseconds()).padStart(3, '0')
    return `${hh}:${mm}:${ss}.${ms}`
  } catch {
    return ts
  }
}
