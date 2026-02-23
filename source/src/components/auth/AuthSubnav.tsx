import { Link } from '@tanstack/react-router'
import { ReactNode } from 'react'

export function AuthSubnav({ action }: { action?: ReactNode }) {
  return (
    <nav className="demos-subnav" style={{ position: 'relative' }}>
      <Link to="/auth/users" className="subnav-link" activeProps={{ className: 'subnav-link active' }}>
        Users
      </Link>
      <Link to="/auth/roles" className="subnav-link" activeProps={{ className: 'subnav-link active' }}>
        Roles
      </Link>
      <Link to="/auth/oauth" className="subnav-link" activeProps={{ className: 'subnav-link active' }}>
        OAuth
      </Link>
      {action && <div style={{ position: 'absolute', right: 'var(--space-8)' }}>{action}</div>}
    </nav>
  )
}
