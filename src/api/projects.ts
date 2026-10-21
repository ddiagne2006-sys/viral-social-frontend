import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, apiDownload } from './client'
import { agentMutationKey, queryKeys } from './queryKeys'
import { toQueryString } from './queryString'
import type {
  AppConfig,
  Dashboard,
  ExportFormat,
  PaginatedProjectList,
  Project,
  ProjectBriefUpdate,
  ProjectCreate,
  ProjectFilters,
} from './types'

const projectPath = (id: string) => `/projects/${id}`

// Lectures

export function useConfig() {
  return useQuery({ queryKey: queryKeys.config, queryFn: () => api<AppConfig>('/config/'), staleTime: Infinity })
}

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api<Dashboard>('/dashboard/') })
}

export function useProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: queryKeys.projectList(filters),
    queryFn: () => api<PaginatedProjectList>(`/projects/${toQueryString(filters)}`),
    placeholderData: (previous) => previous,
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.project(id ?? ''),
    queryFn: () => api<Project>(`${projectPath(id!)}/`),
    enabled: Boolean(id),
  })
}

// Écritures : chaque réponse est le projet complet, qui remplace le cache (le serveur décide)

function useStoreProject() {
  const queryClient = useQueryClient()
  return (project: Project) => {
    queryClient.setQueryData(queryKeys.project(project.id), project)
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  }
}

export function useCreateProject() {
  const store = useStoreProject()
  return useMutation({
    mutationFn: (brief: ProjectCreate) => api<Project>('/projects/', { method: 'POST', json: brief }),
    onSuccess: store,
  })
}

export function useUpdateBrief(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationFn: (brief: ProjectBriefUpdate) => api<Project>(`${projectPath(id)}/`, { method: 'PATCH', json: brief }),
    onSuccess: store,
  })
}

export function useDuplicateProject() {
  const store = useStoreProject()
  return useMutation({
    mutationFn: (id: string) => api<Project>(`${projectPath(id)}/duplicate/`, { method: 'POST' }),
    onSuccess: store,
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`${projectPath(id)}/`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.project(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

type Confirmable = { confirm: boolean }

/** Agent 1 (F4, F5). `projectId` peut être fourni à l'appel pour un projet tout juste créé. */
export function useGenerateIdeas(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationKey: agentMutationKey(id, 'ideas'),
    mutationFn: ({ confirm, projectId = id }: Confirmable & { projectId?: string }) =>
      api<Project>(`${projectPath(projectId)}/ideas/`, { method: 'POST', json: { confirm } }),
    onSuccess: store,
  })
}

export function useChooseIdea(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationFn: ({ ideaId, confirm }: Confirmable & { ideaId: string }) =>
      api<Project>(`${projectPath(id)}/ideas/${ideaId}/choose/`, { method: 'POST', json: { confirm } }),
    onSuccess: store,
  })
}

/** Agent 2 (F6). */
export function useGenerateScript(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationKey: agentMutationKey(id, 'script'),
    mutationFn: ({ confirm }: Confirmable) =>
      api<Project>(`${projectPath(id)}/script/`, { method: 'POST', json: { confirm } }),
    onSuccess: store,
  })
}

/** Auto-sauvegarde d'un segment (RG19). */
export function useSaveSegment(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationFn: ({ segmentId, text }: { segmentId: string; text: string }) =>
      api<Project>(`${projectPath(id)}/segments/${segmentId}/`, { method: 'PATCH', json: { text } }),
    onSuccess: store,
  })
}

/** Agent 2, réécriture d'un seul segment (F7). */
export function useRewriteSegment(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationKey: agentMutationKey(id, 'script'),
    mutationFn: ({ segmentId }: { segmentId: string }) =>
      api<Project>(`${projectPath(id)}/segments/${segmentId}/rewrite/`, { method: 'POST', json: {} }),
    onSuccess: store,
  })
}

/** Agent 3 (F8). */
export function useGenerateScenes(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationKey: agentMutationKey(id, 'scenes'),
    mutationFn: () => api<Project>(`${projectPath(id)}/scenes/`, { method: 'POST' }),
    onSuccess: store,
  })
}

/** Agent 3, une seule scène (F9, RG9). */
export function useRegenerateScene(id: string) {
  const store = useStoreProject()
  return useMutation({
    mutationKey: agentMutationKey(id, 'scenes'),
    mutationFn: ({ sceneId }: { sceneId: string }) =>
      api<Project>(`${projectPath(id)}/scenes/${sceneId}/regenerate/`, { method: 'POST' }),
    onSuccess: store,
  })
}

/** Export du dossier (F14) : déclenche le téléchargement dans le navigateur. */
export function useExportProject() {
  return useMutation({
    mutationFn: async ({ id, format }: { id: string; format: ExportFormat }) => {
      const { blob, filename } = await apiDownload(`${projectPath(id)}/export/?format=${format}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename ?? `viral-social-${id}.${format}`
      link.click()
      URL.revokeObjectURL(url)
    },
  })
}
