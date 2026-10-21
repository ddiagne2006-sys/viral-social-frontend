import { faCopy as farCopy } from '@fortawesome/free-regular-svg-icons'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'

import { useRegenerateScene } from '../../api/projects'
import type { Project } from '../../api/types'
import { ExportMenu } from '../../components/ExportMenu'
import { useErrorToast } from '../../components/toast/useErrorToast'
import { useToast } from '../../components/toast/useToast'
import { Button } from '../../components/ui/Button'
import { cardClass } from '../../components/ui/styles'
import { useCopy } from '../../components/useCopy'
import { SceneCard } from '../../components/wizard/SceneCard'
import { StaleBanner } from '../../components/wizard/StaleBanner'
import { TimelineBar } from '../../components/wizard/TimelineBar'
import { formatRange, visibleSafetyAlerts } from '../../domain/project'
import { fr } from '../../i18n/fr'

const t = fr.wizard.scenes
const TICK_MS = 100

type ScenesStepProps = {
  project: Project
  busy: boolean
  onRerun: () => void
}

/** Étape 4 (F8, F9, F10, F14) : storyboard, cartes de scène, copie des prompts, export. */
export function ScenesStep({ project, busy, onRerun }: ScenesStepProps) {
  const regenerate = useRegenerateScene(project.id)
  const toast = useToast()
  const showError = useErrorToast()
  const copy = useCopy()
  const scenes = [...project.scenes].sort((a, b) => a.position - b.position)
  const duration = project.duration_seconds
  const regeneratingId = regenerate.isPending ? (regenerate.variables?.sceneId ?? null) : null

  // Lecture simulée du storyboard : un minuteur local, accéléré pour les vidéos longues
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const step = (TICK_MS / 1000) * Math.max(1, duration / 15)
    const timer = setInterval(() => {
      setTime((current) => {
        const next = current + step
        if (next >= duration) {
          setPlaying(false)
          return duration
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [playing, duration])

  const live = playing || time > 0
  const index = scenes.findIndex((scene) => time >= scene.start_second && time < scene.end_second)
  const activeIndex = !live ? -1 : index < 0 && time >= duration ? scenes.length - 1 : index

  function togglePlay() {
    if (playing) return setPlaying(false)
    if (time >= duration) setTime(0)
    setPlaying(true)
  }

  function copyAll() {
    const text = scenes
      .map((scene) => t.allPromptsLine(scene.position, formatRange(scene.start_second, scene.end_second), scene.video_prompt))
      .join('\n\n')
    void copy(text, t.copiedAll(scenes.length))
  }

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-60">
          <h2 className="text-lg font-bold text-ink">{t.title(scenes.length, project.ratio)}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{t.subtitle}</p>
        </div>
        <ExportMenu projectId={project.id} />
        <Button icon={farCopy} onClick={copyAll}>
          {t.copyAll}
        </Button>
      </div>

      {project.scenes_stale && <StaleBanner onRerun={onRerun} disabled={busy} />}

      <ScenesLook context={project.scenes_context} />

      <TimelineBar
        scenes={scenes}
        duration={duration}
        time={time}
        playing={playing}
        activeIndex={activeIndex}
        onToggle={togglePlay}
        onSeek={(second) => setTime(second)}
      />

      <ul className="grid gap-4 lg:grid-cols-2">
        {scenes.map((scene, i) => (
          <li key={scene.id} className="@container">
            <SceneCard
              scene={scene}
              ratio={project.ratio}
              active={i === activeIndex}
              regenerating={regeneratingId === scene.id}
              disabled={busy || regenerate.isPending}
              onRegenerate={() =>
                regenerate.mutate(
                  { sceneId: scene.id },
                  {
                    onSuccess: () => toast.show({ message: t.regenerated(scene.position) }),
                    onError: showError,
                  },
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Compléments du découpage : avertissements (alertes de gravité haute seulement), style et fiches de référence. */
function ScenesLook({ context }: { context: Project['scenes_context'] }) {
  const t = fr.wizard.scenes
  const warnings = [
    ...context.warnings,
    ...visibleSafetyAlerts(context.safety_alerts).map((alert) => t.safetyAlert(alert.description)),
  ]
  const { visual_style: style, visual_references: references, notes } = context
  if (!warnings.length && !style && !references.length && !notes.length) return null
  return (
    <div className="flex flex-col gap-3 text-[13px]">
      {warnings.length > 0 && (
        <div role="note" className="flex gap-3 rounded-card bg-warning-bg px-4 py-3 text-ink">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-warning" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium">{t.warningsTitle}</p>
            <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5">
              {warnings.map((warning, index) => (
                <li key={index} className="break-words">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {(style || references.length > 0 || notes.length > 0) && (
        <section aria-label={t.lookTitle} className={`${cardClass} flex flex-col gap-2 px-4 py-3 text-ink-soft`}>
          {style && (
            <p className="break-words">
              <span className="font-medium text-ink">{t.visualStyle} : </span>
              {style}
            </p>
          )}
          {references.length > 0 && (
            <div>
              <p className="font-medium text-ink">{t.visualReferences}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {references.map((ref, index) => (
                  <li key={ref.id || index} className="break-words">
                    {ref.id && <span className="font-mono text-xs text-primary">{ref.id}</span>} {ref.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {notes.length > 0 && (
            <div>
              <p className="font-medium text-ink">{t.notes}</p>
              <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5">
                {notes.map((note, index) => (
                  <li key={index} className="break-words">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
