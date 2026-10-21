import { Navigate, Outlet } from 'react-router-dom'

import { useMe } from '../api/auth'
import { paths } from '../paths'

/** Routes /admin : réservées au rôle admin (le serveur refuse aussi, 403). */
export function RequireAdmin() {
  const { data: user } = useMe()
  if (user?.role !== 'admin') return <Navigate to={paths.dashboard} replace />
  return <Outlet />
}
