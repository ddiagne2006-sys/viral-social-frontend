import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useMe } from '../api/auth'
import { paths } from '../paths'
import { ErrorState, LoadingState } from './StateViews'

/** Protège les routes enfants : sans session, redirige vers /login en mémorisant la page demandée. */
export function RequireAuth() {
  const me = useMe()
  const location = useLocation()

  if (me.isPending) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <LoadingState />
      </div>
    )
  }
  if (me.isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorState error={me.error} onRetry={() => void me.refetch()} />
      </div>
    )
  }
  if (!me.data) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
