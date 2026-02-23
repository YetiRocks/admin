import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { OAuthPage } from '../../components/auth/OAuthPage'
import { AuthSubnav } from '../../components/auth/AuthSubnav'

export const Route = createFileRoute('/auth/oauth')({
  component: OAuthRoute,
})

function OAuthRoute() {
  const [triggerNew, setTriggerNew] = useState(0)

  return (
    <>
      <AuthSubnav action={
        <button className="btn btn-primary btn-sm nav-action-btn" onClick={() => setTriggerNew(n => n + 1)}>
          Add Provider
        </button>
      } />
      <div className="panel">
        <OAuthPage showToast={() => {}} triggerNew={triggerNew} />
      </div>
    </>
  )
}
