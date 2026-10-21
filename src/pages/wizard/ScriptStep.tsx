import { faClapperboard, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { useRewriteSegment, useSaveSegment } from '../../api/projects'
import type { Project } from '../../api/types'
import { useErrorToast } from '../../components/toast/useErrorToast'
import { useToast } from '../../components/toast/useToast'
import { Button } from '../../components/ui/Button'
import { cardClass } from '../../components/ui/styles'
import { SegmentEditor } from '../../components/wizard/SegmentEditor'
import { StaleBanner } from '../../components/wizard/StaleBanner'
import { visibleSafetyAlerts } from '../../domain/project'
import { StepActions } from '../../components/wizard/StepActions'
import { fr } from '../../i18n/fr'

const t = fr.wizard.script

type ScriptStepProps = {
  project: Project
  recap: string
  segmentMaxLength: number
  busy: boolean
  onChangeIdea: () => void
  onMakeScenes: () => void
}

/** Étape 3 (F6, F7) : segments modifiables (auto-sauvegarde RG19), mots et temps de lecture calculés par l'API (RG6). */
export function ScriptStep({ project, recap, segmentMaxLength, busy, onChangeIdea, onMakeScenes }: ScriptStepProps) {
  const save = useSaveSegment(project.id)
  const rewrite = useRewriteSegment(project.id)
  const toast = useToast()
  const showError = useErrorToast()
  const segments = [...project.segments].sort((a, b) => a.position - b.position)
  const chosenIdea = project.ideas.find((idea) => idea.id === project.chosen_idea_id)
  const rewritingId = rewrite.isPending ? (rewrite.variables?.segmentId ?? null) : null

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {project.scenes_stale && (
        <StaleBanner onRerun={onMakeScenes} disabled={busy} />
      )}

      <section className={`${cardClass} p-5 sm:px-6`} aria-labelledby="script-title">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 basis-52">
            <p className="text-xs font-medium tracking-wider text-muted uppercase">{t.eyebrow}</p>
            <h2 id="script-title" className="mt-0.5 text-lg font-bold break-words text-ink">
              {chosenIdea?.title ?? project.title}
            </h2>
          </div>
          <span className="rounded-lg bg-primary-tint px-3 py-1.5 text-[13px] font-medium text-primary">{recap}</span>
          <span className="rounded-lg bg-surface-muted px-3 py-1.5 text-[13px] text-ink-soft" aria-live="polite">
            {t.stats(project.word_count, project.reading_seconds)}
          </span>
        </div>

        {project.too_long && (
          <p role="status" className="mt-4 flex items-start gap-2 rounded-field bg-warning-bg px-3 py-2.5 text-[13px] text-warning">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" aria-hidden />
            {t.tooLong}
          </p>
        )}

        <ScriptExtras context={project.script_context} />

        <div className="mt-4">
          {segments.map((segment) => (
            <SegmentEditor
              key={segment.id}
              segment={segment}
              maxLength={segmentMaxLength}
              disabled={busy}
              rewriting={rewritingId === segment.id}
              onSave={(text) =>
                save.mutateAsync({ segmentId: segment.id, text }).catch((error: unknown) => {
                  showError(error)
                  throw error
                })
              }
              onRewrite={() => {
                if (rewrite.isPending) return
                rewrite.mutate(
                  { segmentId: segment.id },
                  { onSuccess: () => toast.show({ message: t.rewritten }), onError: showError },
                )
              }}
            />
          ))}
        </div>
      </section>

      <StepActions>
        <Button variant="outline" onClick={onChangeIdea} disabled={busy}>
          {t.changeIdea}
        </Button>
        <Button variant="brand" icon={faClapperboard} onClick={onMakeScenes} disabled={busy}>
          {t.makeScenes}
        </Button>
      </StepActions>
    </div>
  )
}

/** Compléments renvoyés par l'agent Script : avertissements, faits à vérifier, légende et hashtags. */
function ScriptExtras({ context }: { context: Project['script_context'] }) {
  const { facts_to_check: facts, caption, hashtags, fiction_label: fiction } = context
  const warnings = [
    ...context.warnings,
    ...visibleSafetyAlerts(context.safety_alerts).map((alert) => t.safetyAlert(alert.description)),
  ]
  if (!warnings.length && !facts.length && !caption && !hashtags.length && !fiction) return null
  return (
    <div className="mt-4 flex flex-col gap-3 text-[13px]">
      {(warnings.length > 0 || facts.length > 0) && (
        <div role="note" className="flex gap-3 rounded-field bg-warning-bg px-3 py-2.5 text-ink">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-warning" aria-hidden />
          <div className="flex min-w-0 flex-col gap-2">
            {warnings.length > 0 && <ExtrasList title={t.warningsTitle} items={warnings} />}
            {facts.length > 0 && <ExtrasList title={t.factsTitle} items={facts} />}
          </div>
        </div>
      )}
      {fiction && (
        <p className="self-start rounded-md bg-accent-tint px-2.5 py-0.5 text-xs font-medium text-accent">{t.fiction}</p>
      )}
      {(caption || hashtags.length > 0) && (
        <dl className="flex flex-col gap-1.5 rounded-field bg-surface-soft px-3 py-2.5 text-ink-soft">
          {caption && (
            <div>
              <dt className="font-medium text-ink">{t.caption}</dt>
              <dd className="break-words">{caption}</dd>
            </div>
          )}
          {hashtags.length > 0 && (
            <div>
              <dt className="font-medium text-ink">{t.hashtags}</dt>
              <dd className="break-words">{hashtags.join(' ')}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}

function ExtrasList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5">
        {items.map((item, index) => (
          <li key={index} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
