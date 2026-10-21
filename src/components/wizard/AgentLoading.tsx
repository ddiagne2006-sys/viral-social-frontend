import { faCircleCheck, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'

import type { AgentName } from '../../api/types'
import { fr } from '../../i18n/fr'
import { cardClass } from '../ui/styles'

const STEP_INTERVAL_MS = 2500

/**
 * Écran d'attente d'un agent (jusqu'à AGENT_TIMEOUT_SECONDS côté serveur, 180 s par défaut). Les étapes avancent au fil du temps pour rassurer :
 * elles ne reflètent pas un résultat, qui vient uniquement de la réponse de l'API.
 */
export function AgentLoading({ agent }: { agent: AgentName }) {
  const steps = fr.wizard.loading.steps[agent]
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), STEP_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [steps.length])

  const progress = Math.round(((index + 1) / (steps.length + 1)) * 100)

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${cardClass} animate-fade-up flex flex-col items-center gap-5 px-5 py-10 text-center sm:px-6`}
    >
      <FontAwesomeIcon icon={faCircleNotch} spin className="text-[32px] text-primary" aria-hidden />
      <p className="text-base font-bold text-ink">{fr.wizard.loading[agent]}</p>
      <div
        className="h-2 w-full max-w-md overflow-hidden rounded-full bg-sidebar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={fr.wizard.loading[agent]}
      >
        <div className="bg-brand h-full rounded-full transition-[width] duration-700" style={{ width: `${progress}%` }} />
      </div>
      <ul className="flex w-full max-w-md flex-col gap-2.5 text-left">
        {steps.map((step, i) => {
          const done = i < index
          const active = i === index
          return (
            <li
              key={step}
              className={`flex items-center gap-2.5 ${done ? 'text-success' : active ? 'text-ink' : 'text-muted'}`}
            >
              <FontAwesomeIcon
                icon={done ? faCircleCheck : active ? faCircleNotch : farCircle}
                spin={active}
                fixedWidth
                aria-hidden
              />
              {step}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted">{fr.wizard.loading.hint}</p>
    </div>
  )
}
