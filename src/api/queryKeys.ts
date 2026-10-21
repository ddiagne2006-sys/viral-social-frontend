import type { AgentName, MetricsPeriod, ProjectFilters, RunFilters } from './types'

export const queryKeys = {
  me: ['me'] as const,
  profile: ['profile'] as const,
  config: ['config'] as const,
  dashboard: ['dashboard'] as const,
  projects: ['projects'] as const,
  projectList: (filters: ProjectFilters) => ['projects', filters] as const,
  project: (id: string) => ['project', id] as const,
  adminAgents: ['admin', 'agents'] as const,
  adminRuns: (filters: RunFilters) => ['admin', 'runs', filters] as const,
  adminMetrics: (period: MetricsPeriod) => ['admin', 'metrics', period] as const,
}

/** Clé des mutations d'agent : le panneau « Agents IA » s'en sert pour afficher « En cours ». */
export const agentMutationKey = (projectId: string, agent: AgentName) => ['agent', projectId, agent] as const

/** Identifiant utilisé pour les mutations d'un projet pas encore créé. */
export const NEW_PROJECT = 'new'
