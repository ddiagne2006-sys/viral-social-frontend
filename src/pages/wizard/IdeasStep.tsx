import { faArrowsRotate, faMicrophoneLines, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Project } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { IdeaCard } from '../../components/wizard/IdeaCard'
import { visibleSafetyAlerts } from '../../domain/project'
import { StepActions } from '../../components/wizard/StepActions'
import { fr } from '../../i18n/fr'

const t = fr.wizard.ideas

type IdeasStepProps = {
  project: Project
  recap: string
  busy: boolean
  /** Idée dont le choix est en cours d'envoi. */
  choosingId: string | null
  onChoose: (ideaId: string) => void
  onRegenerate: () => void
  onWriteScript: () => void
}

/** Étape 2 (F4, F5) : 5 idées, sélection unique, script désactivé sans idée choisie (RG4). */
export function IdeasStep({ project, recap, busy, choosingId, onChoose, onRegenerate, onWriteScript }: IdeasStepProps) {
  const ideas = [...project.ideas].sort((a, b) => a.position - b.position)
  const hasChoice = Boolean(project.chosen_idea_id)
  const { interpreted_theme: interpretedTheme, safety_alerts: safetyAlerts } = project.ideas_context
  const alerts = [
    ...project.ideas_context.alerts,
    ...visibleSafetyAlerts(safetyAlerts).map((alert) => t.safetyAlert(alert.description)),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-fade-up flex flex-wrap items-center gap-3">
        <h2 className="min-w-0 flex-1 basis-60 text-lg font-bold break-words text-ink">{t.title(project.theme)}</h2>
        <span className="text-[13px] text-muted">{recap}</span>
        <Button variant="outline" icon={faArrowsRotate} onClick={onRegenerate} disabled={busy}>
          {t.regenerate}
        </Button>
      </div>

      {interpretedTheme && (
        <p className="text-[13px] break-words text-ink-soft">
          <span className="font-medium text-ink">{t.interpretedTheme}</span> {interpretedTheme}
        </p>
      )}

      {alerts.length > 0 && (
        <div role="note" className="flex gap-3 rounded-card bg-warning-bg px-4 py-3 text-[13px] text-ink">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-warning" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium">{t.alertsTitle}</p>
            <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5">
              {alerts.map((alert, index) => (
                <li key={index} className="break-words">
                  {alert}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ul className="grid items-start gap-3 lg:grid-cols-2">
        {ideas.map((idea) => (
          <li key={idea.id}>
            <IdeaCard
              idea={idea}
              selected={idea.id === project.chosen_idea_id}
              disabled={busy || choosingId !== null}
              onSelect={() => onChoose(idea.id)}
            />
          </li>
        ))}
      </ul>

      {!hasChoice && <p className="text-center text-[13px] text-muted lg:text-right">{t.chooseFirst}</p>}

      <StepActions>
        <Button icon={faMicrophoneLines} onClick={onWriteScript} disabled={!hasChoice || busy || choosingId !== null}>
          {t.writeScript}
        </Button>
      </StepActions>
    </div>
  )
}
