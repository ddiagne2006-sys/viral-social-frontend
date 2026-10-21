import { faArrowsRotate, faMicrophone, faPalette, faVideo } from '@fortawesome/free-solid-svg-icons'
import { faSun as farSun } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Scene } from '../../api/types'
import { cssAspectRatio, formatRange } from '../../domain/project'
import { fr } from '../../i18n/fr'
import { CopyButton } from '../CopyButton'
import { Button } from '../ui/Button'

type SceneCardProps = {
  scene: Scene
  /** Ratio du réseau renvoyé par l'API (RG2). */
  ratio: string
  /** Scène en cours de lecture dans le storyboard. */
  active?: boolean
  regenerating?: boolean
  disabled?: boolean
  onRegenerate: () => void
}

/** Carte scène (F8, F9) : vignette au ratio du réseau, voix-off, plan, lumière, ambiance, prompt. */
export function SceneCard({ scene, ratio, active = false, regenerating = false, disabled = false, onRegenerate }: SceneCardProps) {
  const t = fr.wizard.scenes
  const [width = 1, height = 1] = ratio.split(':').map(Number)
  const landscape = width > height
  const details = [
    { icon: faVideo, label: t.shotCamera, value: `${scene.shot} — ${scene.camera}` },
    { icon: farSun, label: t.lighting, value: scene.lighting },
    { icon: faPalette, label: t.mood, value: scene.mood },
  ]

  return (
    <article
      aria-labelledby={`scene-${scene.id}`}
      aria-current={active || undefined}
      className={`animate-fade-up grid gap-4 rounded-card border-2 bg-white p-4 shadow-card transition motion-reduce:transition-none @md:grid-cols-[150px_minmax(0,1fr)] @md:gap-6 @md:p-5 ${
        active ? 'scale-[1.01] border-primary' : 'border-transparent'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <div
          style={{ aspectRatio: cssAspectRatio(ratio) }}
          className={`grid max-h-[200px] place-items-center rounded-xl p-2 text-center font-mono text-[11px] transition-colors ${
            landscape ? 'w-full max-w-xs' : 'w-28 @md:w-full'
          } ${active ? 'bg-brand text-white' : 'bg-stripes text-muted'}`}
        >
          {active ? t.thumbnailPlaying(scene.position) : t.thumbnail}
        </div>
        <p className="text-xs text-muted">{formatRange(scene.start_second, scene.end_second)}</p>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
            {t.scene(scene.position)}
          </span>
          <h3 id={`scene-${scene.id}`} className="min-w-0 flex-1 text-[15px] font-bold text-ink">
            {scene.label}
          </h3>
          {scene.variant > 0 && (
            <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-ink-soft">{t.variant(scene.variant)}</span>
          )}
          {scene.is_stale && (
            <span className="rounded-md bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">{t.stale}</span>
          )}
          <Button
            variant="outline"
            icon={faArrowsRotate}
            loading={regenerating}
            disabled={disabled}
            onClick={onRegenerate}
            className="ml-auto px-3 text-xs"
          >
            {t.regenerate}
          </Button>
        </div>

        <div className={`flex flex-col gap-3 transition-opacity ${regenerating ? 'opacity-40' : ''}`}>
          <div className="flex flex-wrap items-start gap-x-2">
            <p className="min-w-0 flex-1 basis-48 select-text break-words py-2.5 text-[13px] leading-relaxed text-ink-soft">
              <FontAwesomeIcon icon={faMicrophone} className="mr-1.5 text-muted" aria-hidden />
              <span className="sr-only">{t.voiceOver} : </span>« {scene.voice_over} »
            </p>
            <CopyButton
              text={scene.voice_over}
              label={t.copyVoiceOverOf(scene.position)}
              className="ml-auto border border-line text-ink-soft hover:border-primary hover:text-primary"
            >
              {t.copyVoiceOver}
            </CopyButton>
          </div>

          <dl className="grid gap-2.5 @xl:grid-cols-3">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0 rounded-field bg-surface-soft px-3 py-2.5">
                <dt className="text-[11px] text-muted">
                  <FontAwesomeIcon icon={detail.icon} className="mr-1" aria-hidden />
                  {detail.label}
                </dt>
                <dd className="mt-0.5 break-words text-[13px] text-ink">{detail.value}</dd>
              </div>
            ))}
          </dl>

          {(scene.on_screen_text || scene.transition || scene.references.length > 0) && (
            <dl className="flex flex-col gap-1 text-[13px] text-ink-soft">
              {scene.on_screen_text && (
                <div>
                  <dt className="inline font-medium text-ink">{t.onScreenText} : </dt>
                  <dd className="inline break-words">{scene.on_screen_text}</dd>
                </div>
              )}
              {scene.transition && (
                <div>
                  <dt className="inline font-medium text-ink">{t.transition} : </dt>
                  <dd className="inline break-words">{scene.transition}</dd>
                </div>
              )}
              {scene.references.length > 0 && (
                <div>
                  <dt className="inline font-medium text-ink">{t.references} : </dt>
                  <dd className="inline break-words">{scene.references.join(', ')}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="flex items-start gap-2 rounded-field bg-code-bg py-1 pl-3.5 pr-1 font-mono text-[12.5px] leading-relaxed text-code-ink">
            <p className="min-w-0 flex-1 select-text break-words py-2">
              <span className="text-code-accent">{t.prompt.toUpperCase()} ›</span> {scene.video_prompt}
            </p>
            <CopyButton
              text={scene.video_prompt}
              label={t.copyPrompt(scene.position)}
              className="text-code-accent hover:bg-white/10"
            />
          </div>
        </div>
      </div>
    </article>
  )
}
