import { Link } from '@tanstack/react-router'
import { TableInfo } from '../types'

interface Props {
  appId: string
  tables: TableInfo[]
  counts: Record<string, number>
  fallbackDb?: string
}

export function groupTablesByDatabase(tables: TableInfo[], fallbackDb?: string): Map<string, TableInfo[]> {
  const groups = new Map<string, TableInfo[]>()
  for (const t of tables) {
    const key = t.database || fallbackDb || 'default'
    const list = groups.get(key) || []
    list.push(t)
    groups.set(key, list)
  }
  const sorted = new Map(
    [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([db, tbls]) => [db, tbls.sort((a, b) => a.name.localeCompare(b.name))])
  )
  return sorted
}

export function DatabaseNav({ appId, tables, fallbackDb }: Props) {
  const groups = groupTablesByDatabase(tables, fallbackDb)

  if (tables.length === 0) {
    return (
      <nav className="db-nav">
        <div className="db-nav-empty">No tables</div>
      </nav>
    )
  }

  return (
    <nav className="db-nav">
      {[...groups.entries()].map(([db, tbls]) => (
        <div key={db} className="db-nav-group">
          <div className="panel-header">
            <span className="panel-title">{db}</span>
          </div>
          {tbls.map(t => (
            <Link
              key={t.name}
              to="/applications/$appId/data/$database/$table"
              params={{ appId, database: db, table: t.name }}
              className="db-nav-item"
              activeProps={{ className: 'db-nav-item active' }}
            >
              <span>{t.name}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}
