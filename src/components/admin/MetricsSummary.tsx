import { faChartLine } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { useAdminMetrics } from '../../api/admin'
import type { MetricsPeriod } from '../../api/types'
import { formatDuration, formatRate } from '../../domain/project'
import { fr } from '../../i18n/fr'
import { QueryState } from '../StateViews'
import { cardClass } from '../ui/styles'

const t = fr.pages.adminMetrics

/** Bloc de métriques par agent (runs, taux de succès, durée moyenne, erreurs par code), alimenté par l'API. */
export function MetricsSummary({ period = {} }: { period?: MetricsPeriod }) {
  const metrics = useAdminMetrics(period)
  const hasPeriod = Boolean(period.from || period.to)

  return (
    <section aria-labelledby="admin-metrics" className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="admin-metrics" className="flex items-center gap-2 text-lg font-bold text-ink">
          <FontAwesomeIcon icon={faChartLine} className="text-primary" aria-hidden />
          {t.title}
        </h2>
        <span className="text-[13px] text-muted">
          {hasPeriod ? t.period(period.from ?? '', period.to ?? '') : t.allTime}
        </span>
      </div>
      <QueryState query={metrics}>
        {(data) => (
          <ul className="grid gap-3 md:grid-cols-3">
            {data.map((item) => {
              const errors = Object.entries(item.errors_by_code)
              return (
                <li key={item.agent} className={`${cardClass} flex flex-col gap-3 p-4`}>
                  <p className="font-bold text-ink">{fr.agents.names[item.agent]}</p>
                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <dt className="text-[11px] text-muted">{t.runs}</dt>
                      <dd className="text-xl font-bold text-ink">{item.runs_count}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted">{t.successRate}</dt>
                      <dd className="text-xl font-bold text-success">
                        {item.success_rate === null ? t.noValue : formatRate(item.success_rate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted">{t.avgDuration}</dt>
                      <dd className="text-xl font-bold text-ink">
                        {item.avg_duration_ms === null ? t.noValue : formatDuration(item.avg_duration_ms)}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-1.5" aria-label={t.errors}>
                    {errors.length === 0 ? (
                      <span className="text-xs text-muted">{t.noErrors}</span>
                    ) : (
                      errors.map(([code, count]) => (
                        <span key={code} className="rounded-md bg-danger-bg px-2 py-0.5 font-mono text-[11px] text-danger">
                          {code} × {count}
                        </span>
                      ))
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </QueryState>
    </section>
  )
}
