import { createFileRoute } from '@tanstack/react-router'
import { OAuthPage } from '../../components/auth/OAuthPage'

export const Route = createFileRoute('/auth/oauth')({
  component: () => <OAuthPage showToast={() => {}} />,
})
