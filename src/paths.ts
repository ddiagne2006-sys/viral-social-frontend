export const paths = {
  login: '/login',
  dashboard: '/',
  projects: '/projects',
  newVideo: '/projects/new',
  project: (id: string) => `/projects/${id}`,
  settings: '/settings',
  adminAgents: '/admin/agents',
  adminRuns: '/admin/runs',
} as const
