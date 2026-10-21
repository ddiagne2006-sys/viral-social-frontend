import { faClone, faTrash, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useConfig, useDeleteProject, useDuplicateProject, useProjects } from '../api/projects'
import type { Network, ProjectFilters, ProjectListItem, ProjectStatus } from '../api/types'
import { ExportMenu } from '../components/ExportMenu'
import { PageHeader } from '../components/PageHeader'
import { ProjectCard } from '../components/projects/ProjectCard'
import { EmptyState, QueryState } from '../components/StateViews'
import { useErrorToast } from '../components/toast/useErrorToast'
import { useToast } from '../components/toast/useToast'
import { NetworkBadge, ProjectStatusBadge } from '../components/ui/Badges'
import { Button, IconButton } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/Dialog'
import { SearchField, Select } from '../components/ui/Fields'
import { Pagination } from '../components/ui/Pagination'
import { buttonClass, cardClass } from '../components/ui/styles'
import { formatDate } from '../domain/project'
import { fr } from '../i18n/fr'
import { paths } from '../paths'

const t = fr.pages.projects
const SEARCH_DEBOUNCE_MS = 300
const NETWORKS = Object.keys(fr.networks) as Network[]
const STATUSES = Object.keys(fr.projectStatus) as ProjectStatus[]

/** Filtres lus dans l'URL (partageables, conservés au retour arrière). */
function readFilters(params: URLSearchParams): ProjectFilters {
  const network = params.get('network') as Network | null
  const status = params.get('status') as ProjectStatus | null
  const page = Number(params.get('page'))
  return {
    search: params.get('search') || undefined,
    network: network && NETWORKS.includes(network) ? network : undefined,
    status: status && STATUSES.includes(status) ? status : undefined,
    page: page > 1 ? page : undefined,
  }
}

function ProjectActions({ project, onDelete }: { project: ProjectListItem; onDelete: () => void }) {
  const duplicate = useDuplicateProject()
  const navigate = useNavigate()
  const toast = useToast()
  const showError = useErrorToast()

  return (
    <>
      <Link to={paths.project(project.id)} className={buttonClass('outline', 'px-3')}>
        {t.open}
      </Link>
      <IconButton
        icon={faClone}
        label={`${t.duplicate} « ${project.title || project.theme} »`}
        loading={duplicate.isPending}
        onClick={() =>
          duplicate.mutate(project.id, {
            onSuccess: (copy) => {
              toast.show({ message: t.duplicated })
              navigate(paths.project(copy.id))
            },
            onError: showError,
          })
        }
      />
      <ExportMenu projectId={project.id} />
      <IconButton
        icon={faTrash}
        label={`${t.delete} « ${project.title || project.theme} »`}
        onClick={onDelete}
        className="hover:border-danger hover:text-danger"
      />
    </>
  )
}

/** Mes projets (F13) : recherche, filtres réseau et statut, ouverture, duplication, export, suppression. */
export function Projects() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const projects = useProjects(filters)
  const config = useConfig()
  const deleteProject = useDeleteProject()
  const toast = useToast()
  const showError = useErrorToast()
  const [toDelete, setToDelete] = useState<ProjectListItem | null>(null)

  // Recherche saisie : appliquée à l'URL après 300 ms sans frappe
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const [urlSearch, setUrlSearch] = useState(filters.search ?? '')
  if ((filters.search ?? '') !== urlSearch) {
    setUrlSearch(filters.search ?? '')
    setSearchInput(filters.search ?? '')
  }

  /** Met à jour les filtres de l'URL ; tout changement de filtre revient à la page 1. */
  const update = useCallback(
    (changes: Partial<Record<keyof ProjectFilters, string | undefined>>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    const search = searchInput.trim()
    if (search === urlSearch) return
    const timer = setTimeout(() => update({ search: search || undefined }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, urlSearch, update])

  const hasFilters = Boolean(filters.search || filters.network || filters.status)
  const networkLabel = (network: Network) =>
    config.data?.networks.find((option) => option.value === network)?.label ?? fr.networks[network]

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle}>
        <Link to={paths.newVideo} className={buttonClass('brand')}>
          <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
          {fr.nav.newVideo}
        </Link>
      </PageHeader>

      <div role="search" aria-label={t.filters} className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <SearchField
          label={fr.nav.search}
          placeholder={fr.nav.searchPlaceholder}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <Select
          label={t.network}
          hideLabel
          value={filters.network ?? ''}
          onChange={(event) => update({ network: event.target.value })}
          options={[
            { value: '', label: t.allNetworks },
            ...NETWORKS.map((network) => ({ value: network, label: networkLabel(network) })),
          ]}
        />
        <Select
          label={t.status}
          hideLabel
          value={filters.status ?? ''}
          onChange={(event) => update({ status: event.target.value })}
          options={[
            { value: '', label: t.allStatuses },
            ...STATUSES.map((status) => ({ value: status, label: fr.projectStatus[status] })),
          ]}
        />
      </div>

      <QueryState
        query={projects}
        isEmpty={(data) => data.results.length === 0}
        empty={
          hasFilters ? (
            <EmptyState
              title={t.noMatchTitle}
              message={t.noMatchMessage}
              action={
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  {t.resetFilters}
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={t.emptyTitle}
              message={t.emptyMessage}
              action={
                <Link to={paths.newVideo} className={buttonClass('brand')}>
                  {fr.nav.newVideo}
                </Link>
              }
            />
          )
        }
      >
        {(data) => (
          <>
            {/* Mobile : cartes */}
            <ul className="grid gap-3 lg:hidden">
              {data.results.map((project) => (
                <li key={project.id}>
                  <ProjectCard
                    project={project}
                    actions={<ProjectActions project={project} onDelete={() => setToDelete(project)} />}
                  />
                </li>
              ))}
            </ul>

            {/* Desktop : tableau */}
            <div className={`${cardClass} hidden lg:block`}>
              <table className="w-full text-left">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">
                      {fr.pages.projects.title}
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      {t.network}
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      {t.status}
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      {t.updated}
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((project) => (
                    <tr key={project.id} className="border-b border-surface-muted last:border-0">
                      <td className="max-w-xs px-5 py-3">
                        <Link to={paths.project(project.id)} className="font-bold text-ink hover:text-primary">
                          {project.title || project.theme}
                        </Link>
                        <p className="truncate text-[13px] text-muted">{project.theme}</p>
                      </td>
                      <td className="px-3 py-3">
                        <NetworkBadge network={project.network} label={networkLabel(project.network)} />
                        <span className="ml-2 text-xs text-muted">{project.duration_seconds} s</span>
                      </td>
                      <td className="px-3 py-3">
                        <ProjectStatusBadge status={project.status} />
                      </td>
                      <td className="px-3 py-3 text-[13px] whitespace-nowrap text-muted">
                        {formatDate(project.updated_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ProjectActions project={project} onDelete={() => setToDelete(project)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={filters.page ?? 1}
              hasPrevious={Boolean(data.previous)}
              hasNext={Boolean(data.next)}
              onChange={(page) => update({ page: page > 1 ? String(page) : undefined })}
            />
          </>
        )}
      </QueryState>

      <ConfirmDialog
        open={toDelete !== null}
        title={t.deleteTitle}
        message={toDelete ? t.deleteMessage(toDelete.title || toDelete.theme) : ''}
        confirmLabel={t.delete}
        tone="danger"
        loading={deleteProject.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          deleteProject.mutate(toDelete.id, {
            onSuccess: () => toast.show({ message: t.deleted }),
            onError: showError,
            onSettled: () => setToDelete(null),
          })
        }}
      />
    </>
  )
}
