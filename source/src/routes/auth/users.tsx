import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '../../components/auth/UsersPage'

export const Route = createFileRoute('/auth/users')({
  component: () => <UsersPage showToast={() => {}} />,
})
