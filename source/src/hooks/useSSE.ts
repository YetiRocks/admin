import { useState, useEffect, useRef, useCallback } from 'react'

const BASE_URL = window.location.origin + '/yeti-telemetry'

interface UseSSEOptions<T> {
  table: string
  maxItems?: number
  paused?: boolean
  parse?: (data: string) => T | null
}

interface UseSSEResult<T> {
  items: T[]
  connected: boolean
  error: string | null
  clear: () => void
}

export function useSSE<T>({ table, maxItems = 1000, paused = false, parse }: UseSSEOptions<T>): UseSSEResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pausedRef = useRef(paused)

  pausedRef.current = paused

  const clear = useCallback(() => {
    setItems([])
  }, [])

  // Fetch existing records on mount so data appears immediately
  useEffect(() => {
    fetch(`${BASE_URL}/${table}?limit=500&sort=-id`)
      .then(res => res.json())
      .then((records: T[]) => {
        if (records.length > 0) {
          setItems(records)
        }
      })
      .catch(() => { /* ignore — SSE will provide data */ })
  }, [table])

  useEffect(() => {
    const url = `${BASE_URL}/${table}?stream=sse`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      setError(null)
    }

    // Server sends "event: message" for connection confirmation
    es.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'connected') {
          setConnected(true)
        }
      } catch {
        // ignore
      }
    })

    // Server sends "event: update" for actual data
    es.addEventListener('update', (event: MessageEvent) => {
      if (pausedRef.current) return
      try {
        const parsed = parse ? parse(event.data) : JSON.parse(event.data) as T
        if (parsed) {
          setItems(prev => {
            const next = [...prev, parsed]
            return next.length > maxItems ? next.slice(-maxItems) : next
          })
        }
      } catch {
        // skip unparseable messages
      }
    })

    es.onerror = () => {
      setConnected(false)
      setError('SSE connection lost, reconnecting...')
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [table, maxItems, parse])

  return { items, connected, error, clear }
}

export { BASE_URL }
