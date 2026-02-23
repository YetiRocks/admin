import { createFileRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { api, BASE } from '../../../api'
import { AppDetail, SchemaInfo, PaginatedResponse } from '../../../types'
import { DatabaseNav, groupTablesByDatabase } from '../../../components/DatabaseNav'

export const Route = createFileRoute('/applications/$appId')({
  loader: async ({ params }) => {
    const [detail, schema] = await Promise.all([
      api<AppDetail>(`${BASE}/apps/${params.appId}`),
      api<SchemaInfo>(`${BASE}/schemas/${params.appId}`),
    ])

    const tables = schema?.tables || []
    const countEntries = await Promise.all(
      tables.map(t =>
        api<PaginatedResponse>(`${t.rest_url}/?pagination=true&limit=0`)
          .then(r => [t.name, r.total] as const)
          .catch(() => [t.name, 0] as const)
      )
    )
    const counts: Record<string, number> = Object.fromEntries(countEntries)

    return { detail, schema, counts }
  },
  component: AppLayout,
})

function AppLayout() {
  const { appId } = Route.useParams()
  const { detail, schema, counts } = Route.useLoaderData()
  const location = useLocation()

  const tables = schema?.tables || []
  const hasTables = tables.length > 0 || (detail?.table_count ?? 0) > 0
  const isData = location.pathname.includes('/data/')

  const groups = groupTablesByDatabase(tables, appId)
  const firstEntry = groups.entries().next().value
  const firstDb = firstEntry ? firstEntry[0] : null
  const firstTable = firstEntry ? firstEntry[1][0]?.name : null

  return (
    <>
      <nav className="demos-subnav" style={{ position: 'relative' }}>
        <Link
          to="/applications/$appId"
          params={{ appId }}
          className="subnav-link"
          activeOptions={{ exact: true }}
          activeProps={{ className: 'subnav-link active' }}
        >
          Overview
        </Link>
        {hasTables && (
          <Link
            to="/applications/$appId/data/$database/$table"
            params={{ appId, database: firstDb || appId, table: firstTable || '_' }}
            className={`subnav-link ${isData ? 'active' : ''}`}
          >
            Data
          </Link>
        )}
        <Link
          to="/applications/$appId/config"
          params={{ appId }}
          className="subnav-link"
          activeProps={{ className: 'subnav-link active' }}
        >
          Config
        </Link>
        <div style={{ position: 'absolute', left: 'var(--space-8)' }}>
          <Link to="/applications" className="subnav-link">&larr; Applications</Link>
        </div>
      </nav>

      {isData && tables.length > 0 ? (
        <div className="detail-body-layout">
          <DatabaseNav appId={appId} tables={tables} counts={counts} fallbackDb={appId} />
          <div className="detail-content">
            <Outlet />
          </div>
        </div>
      ) : (
        <div className="demo-content">
          <Outlet />
        </div>
      )}
    </>
  )
}
