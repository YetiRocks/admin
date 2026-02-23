import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { RolesPage } from '../../components/auth/RolesPage'
import { AuthSubnav } from '../../components/auth/AuthSubnav'

export const Route = createFileRoute('/auth/roles')({
  component: RolesRoute,
})

function RolesRoute() {
  const [triggerNew, setTriggerNew] = useState(0)

  return (
    <>
      <AuthSubnav action={
        <button className="btn btn-primary btn-sm nav-action-btn" onClick={() => setTriggerNew(n => n + 1)}>
          New Role
        </button>
      } />
      <div className="panel">
        <RolesPage showToast={() => {}} triggerNew={triggerNew} />
      </div>
    </>
  )
}
