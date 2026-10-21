import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { useSearchParams } from 'react-router-dom'

import { useAdminRuns } from '../../api/admin'
import type { AgentName, AgentRun, RunFilters, RunStatus } from '../../api/types'
import { MetricsSummary } from '../../components/admin/MetricsSummary'
import { TextField } from '../../components/form/TextField'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryState } from '../../components/StateViews'
import { RunStatusBadge } from '../../components/ui/Badges'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Fields'
import { Pagination } from '../../components/ui/Pagination'
import { cardClass } from '../../components/ui/styles'
import { formatDate, formatDuration } from '../../domain/project'
import { fr } from '../../i18n/fr'

const t = fr.pages.adminRuns
const AGENTS = Object.keys(fr.agents.names) as AgentName[]
const STATUSES = Object.keys(fr.runStatus) as RunStatus[]
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** Filtres lus dans l'URL ; les dates (AAAA-MM-JJ) sont validées par l'API, qui répond 400 si elles sont invalides. */
function readFilters(params: URLSearchParams): RunFilters {
  const agent = params.get('agent') as AgentName | null
  const status = params.get('status') as RunStatus | null
  const page = Number(params.get('page'))
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  return {
    agent: agent && AGENTS.includes(agent) ? agent : undefined,
    status: status && STATUSES.includes(status) ? status : undefined,
    from: ISO_DAY.test(from) ? from : undefined,
    to: ISO_DAY.test(to) ? to : undefined,
    page: page > 1 ? page : undefined,
  }
}

const duration = (run: AgentRun) => (run.duration_ms === null ? fr.pages.adminMetrics.noValue : formatDuration(run.duration_ms))

function RunCard({ run }: { run: AgentRun }) {
  return (
    <li className={`${cardClass} flex flex-col gap-2 p-4`}>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 font-bold text-ink">{fr.agents.names[run.agent]}</span>
        <RunStatusBadge status={run.status} />
      </div>
      <p className="text-[13px] text-ink-soft">
        {formatDate(run.started_at)} · {duration(run)}
      </p>
      <p className="truncate text-[13px] text-muted">{run.user_email}</p>
      {run.error_code && <p className="font-mono text-xs break-all text-danger">{run.error_code}</p>}
    </li>
  )
}

/** Admin : journal des runs (RG14, F17), filtrable par agent, statut et période. Jamais le contenu des projets (RG16). */
export function AdminRuns() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const runs = useAdminRuns(filters)
  const hasFilters = Boolean(filters.agent || filters.status || filters.from || filters.to)

  function update(changes: Partial<Record<keyof RunFilters, string | undefined>>) {
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
  }

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <MetricsSummary period={{ from: filters.from, to: filters.to }} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
        <Select
          label={t.agent}
          value={filters.agent ?? ''}
          onChange={(event) => update({ agent: event.target.value })}
          options={[
            { value: '', label: t.allAgents },
            ...AGENTS.map((agent) => ({ value: agent, label: fr.agents.names[agent] })),
          ]}
        />
        <Select
          label={t.status}
          value={filters.status ?? ''}
          onChange={(event) => update({ status: event.target.value })}
          options={[
            { value: '', label: t.allStatuses },
            ...STATUSES.map((status) => ({ value: status, label: fr.runStatus[status] })),
          ]}
        />
        <TextField
          label={t.from}
          type="date"
          value={filters.from ?? ''}
          max={filters.to}
          onChange={(event) => update({ from: event.target.value })}
        />
        <TextField
          label={t.to}
          type="date"
          value={filters.to ?? ''}
          min={filters.from}
          onChange={(event) => update({ to: event.target.value })}
        />
        {(filters.from || filters.to) && (
          <Button variant="ghost" icon={faXmark} onClick={() => update({ from: undefined, to: undefined })}>
            {t.resetPeriod}
          </Button>
        )}
      </div>

      <QueryState
        query={runs}
        isEmpty={(data) => data.results.length === 0}
        empty={<EmptyState title={t.emptyTitle} message={hasFilters ? t.noMatchMessage : t.emptyMessage} />}
      >
        {(data) => (
          <>
            {/* Mobile : cartes */}
            <ul className="grid gap-3 lg:hidden">
              {data.results.map((run) => (
                <RunCard key={run.id} run={run} />
              ))}
            </ul>

            {/* Desktop : tableau */}
            <div className={`${cardClass} hidden overflow-x-auto lg:block`}>
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    {[t.date, t.agent, t.status, t.duration, t.error, t.user].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-3 font-medium first:pl-5 last:pr-5">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((run) => (
                    <tr key={run.id} className="border-b border-surface-muted last:border-0">
                      <td className="px-4 py-3 pl-5 whitespace-nowrap text-ink-soft">{formatDate(run.started_at)}</td>
                      <td className="px-4 py-3 text-ink">{fr.agents.names[run.agent]}</td>
                      <td className="px-4 py-3">
                        <RunStatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted">{duration(run)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-danger">{run.error_code ?? ''}</td>
                      <td className="max-w-56 truncate px-4 py-3 pr-5 text-ink-soft">{run.user_email}</td>
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
    </>
  )
}
