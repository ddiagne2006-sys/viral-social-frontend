import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from './client'
import { queryKeys } from './queryKeys'
import { toQueryString } from './queryString'
import type {
  AgentMetrics,
  AgentName,
  AgentStatus,
  AgentTestResult,
  MetricsPeriod,
  PaginatedAgentRunList,
  RunFilters,
} from './types'

/** État des agents : configuré ou non (jamais l'URL), dernier run. */
export function useAdminAgents() {
  return useQuery({ queryKey: queryKeys.adminAgents, queryFn: () => api<AgentStatus[]>('/admin/agents/') })
}

/** Contrôle de contrat d'un webhook : n'écrit rien et ne compte pas dans le quota. */
export function useTestAgent() {
  return useMutation({
    mutationFn: (agent: AgentName) => api<AgentTestResult>(`/admin/agents/${agent}/test/`, { method: 'POST' }),
  })
}

export function useAdminRuns(filters: RunFilters) {
  return useQuery({
    queryKey: queryKeys.adminRuns(filters),
    queryFn: () => api<PaginatedAgentRunList>(`/admin/runs/${toQueryString(filters)}`),
    placeholderData: (previous) => previous,
  })
}

export function useAdminMetrics(period: MetricsPeriod = {}) {
  return useQuery({
    queryKey: queryKeys.adminMetrics(period),
    queryFn: () => api<AgentMetrics[]>(`/admin/metrics/${toQueryString(period)}`),
    placeholderData: (previous) => previous,
  })
}
