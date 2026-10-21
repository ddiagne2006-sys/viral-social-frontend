import { faCircleCheck, faCircleInfo, faPlug, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'

import { useAdminAgents, useTestAgent } from '../../api/admin'
import type { AgentName, AgentStatus, AgentTestResult } from '../../api/types'
import { MetricsSummary } from '../../components/admin/MetricsSummary'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, QueryState } from '../../components/StateViews'
import { useErrorToast } from '../../components/toast/useErrorToast'
import { RunStatusBadge } from '../../components/ui/Badges'
import { Button } from '../../components/ui/Button'
import { cardClass } from '../../components/ui/styles'
import { formatDate, formatDuration } from '../../domain/project'
import { fr } from '../../i18n/fr'

const t = fr.pages.adminAgents

function ConfiguredBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
        configured ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'
      }`}
    >
      <FontAwesomeIcon icon={configured ? faCircleCheck : farCircle} aria-hidden />
      {configured ? t.configured : t.notConfigured}
    </span>
  )
}

function TestResult({ result }: { result: AgentTestResult }) {
  return result.ok ? (
    <p role="status" className="flex items-start gap-1.5 text-xs text-success">
      <FontAwesomeIcon icon={faCircleCheck} className="mt-0.5" aria-hidden />
      {t.testOk(result.status_code, result.duration_ms)}
    </p>
  ) : (
    <p role="status" className="flex items-start gap-1.5 text-xs break-words text-danger">
      <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" aria-hidden />
      <span className="min-w-0">
        {t.testFailed}
        {result.error ? ` : ${result.error}` : ''}
      </span>
    </p>
  )
}

function AgentCard({
  status,
  result,
  testing,
  disabled,
  onTest,
}: {
  status: AgentStatus
  result?: AgentTestResult
  testing: boolean
  disabled: boolean
  onTest: () => void
}) {
  const name = fr.agents.names[status.agent]
  const run = status.last_run
  return (
    <li className={`${cardClass} flex flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 flex-1 text-base font-bold text-ink">{name}</h2>
        <ConfiguredBadge configured={status.configured} />
      </div>
      <dl className="grid gap-2 text-[13px]">
        <div>
          <dt className="text-xs text-muted">{t.lastRun}</dt>
          <dd className="flex flex-wrap items-center gap-2 text-ink">
            {run === null ? (
              <span className="text-muted">{t.noRun}</span>
            ) : (
              <>
                <RunStatusBadge status={run.status} />
                <span>
                  {t.lastRunSummary(
                    run.duration_ms === null ? fr.pages.adminMetrics.noValue : formatDuration(run.duration_ms),
                    formatDate(run.started_at),
                  )}
                </span>
                {run.error_code && <span className="font-mono text-xs text-danger">{run.error_code}</span>}
              </>
            )}
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2 border-t border-surface-muted pt-3 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          icon={faPlug}
          loading={testing}
          disabled={disabled}
          onClick={onTest}
          aria-label={t.testAgent(name)}
          className="sm:self-start"
        >
          {t.test}
        </Button>
        {result && <TestResult result={result} />}
      </div>
    </li>
  )
}

/** Admin : état des 3 webhooks n8n (configuré ou non, jamais l'URL), dernier run, test de contrat (F17). */
export function AdminAgents() {
  const agents = useAdminAgents()
  const test = useTestAgent()
  const showError = useErrorToast()
  const [results, setResults] = useState<Partial<Record<AgentName, AgentTestResult>>>({})

  function runTest(agent: AgentName) {
    test.mutate(agent, {
      onSuccess: (result) => {
        setResults((current) => ({ ...current, [agent]: result }))
        void agents.refetch()
      },
      onError: showError,
    })
  }

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <MetricsSummary />
      <QueryState
        query={agents}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState title={t.emptyTitle} message={t.emptyMessage} />}
      >
        {(data) => (
          <ul className="grid gap-4 lg:grid-cols-3">
            {data.map((status) => (
              <AgentCard
                key={status.agent}
                status={status}
                result={results[status.agent]}
                testing={test.isPending && test.variables === status.agent}
                disabled={test.isPending}
                onTest={() => runTest(status.agent)}
              />
            ))}
          </ul>
        )}
      </QueryState>
      <p className="mt-5 flex items-start gap-2 text-[13px] text-muted">
        <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" aria-hidden />
        {t.envHint}
      </p>
    </>
  )
}
