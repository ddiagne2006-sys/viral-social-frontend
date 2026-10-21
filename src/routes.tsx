import { Navigate, type RouteObject } from 'react-router-dom'

import { AppShell } from './components/AppShell'
import { RequireAdmin } from './components/RequireAdmin'
import { RequireAuth } from './components/RequireAuth'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Projects } from './pages/Projects'
import { paths } from './paths'

// Pages chargées à la demande : le premier affichage (connexion, tableau de bord) reste léger
const wizard = () => import('./pages/ProjectWizard').then((m) => ({ Component: m.ProjectWizard }))

export const routes: RouteObject[] = [
  { path: paths.login, element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: paths.projects, element: <Projects /> },
          { path: paths.newVideo, lazy: wizard },
          { path: '/projects/:projectId', lazy: wizard },
          { path: paths.settings, lazy: () => import('./pages/Settings').then((m) => ({ Component: m.Settings })) },
          {
            element: <RequireAdmin />,
            children: [
              {
                path: paths.adminAgents,
                lazy: () => import('./pages/admin/AdminAgents').then((m) => ({ Component: m.AdminAgents })),
              },
              {
                path: paths.adminRuns,
                lazy: () => import('./pages/admin/AdminRuns').then((m) => ({ Component: m.AdminRuns })),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace /> },
]
