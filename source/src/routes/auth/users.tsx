import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { UsersPage } from '../../components/auth/UsersPage'
import { AuthSubnav } from '../../components/auth/AuthSubnav'

export const Route = createFileRoute('/auth/users')({
  component: UsersRoute,
})

function UsersRoute() {
  const [triggerNew, setTriggerNew] = useState(0)

  return (
    <>
      <AuthSubnav action={
        <button className="btn btn-primary btn-sm nav-action-btn" onClick={() => setTriggerNew(n => n + 1)}>
          New User
        </button>
      } />
      <div className="panel">
        <UsersPage showToast={() => {}} triggerNew={triggerNew} />
      </div>
    </>
  )
}
