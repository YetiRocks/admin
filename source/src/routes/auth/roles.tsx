import { createFileRoute } from '@tanstack/react-router'
import { RolesPage } from '../../components/auth/RolesPage'

export const Route = createFileRoute('/auth/roles')({
  component: () => <RolesPage showToast={() => {}} />,
})
