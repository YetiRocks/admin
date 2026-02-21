import { useState, useRef, useEffect } from 'react'
import { useSSE } from '../../hooks/useSSE'
import { SpanEntry } from './types'

interface SpansPanelProps {
  paused: boolean
  onTogglePause: () => void
}

export function SpansPanel({ paused, onTogglePause }: SpansPanelProps) {
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const { items, connected, error, clear } = useSSE<SpanEntry>({
    table: 'Span',
    paused,
  })

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

  const searchLower = search.toLowerCase()
  const filtered = items.filter(span => {
    if (search && !span.name.toLowerCase().includes(searchLower) && !span.target.toLowerCase().includes(searchLower)) return false
    return true
  })

  return (
    <div className="panel">
      <div className="panel-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Filter by span name or target..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="toolbar-btn" onClick={clear}>Clear</button>
        <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} title={error || (connected ? 'Connected' : 'Disconnected')} />
        <button className={`toolbar-btn ${paused ? 'btn-active' : ''}`} onClick={onTogglePause}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <div className="span-list" ref={listRef} onScroll={handleScroll}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            {items.length === 0 ? 'Waiting for span events...' : 'No spans match current filters'}
          </div>
        ) : (
          filtered.map((span, i) => (
            <div key={span.id || i} className="span-entry">
              <span className="span-time">{formatTime(span.startTime)}</span>
              <span className="span-name">{span.name}</span>
              <span className="span-target">{span.target}</span>
              {span.durationMs != null && (
                <span className={`span-duration ${durationClass(span.durationMs)}`}>
                  {formatDuration(span.durationMs)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="panel-footer">
        <span>{filtered.length} / {items.length} spans</span>
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

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function durationClass(ms: number): string {
  if (ms > 1000) return 'duration-slow'
  if (ms > 100) return 'duration-medium'
  return 'duration-fast'
}
