import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Scene } from '../../api/types'
import { formatClock, formatRange } from '../../domain/project'
import { fr } from '../../i18n/fr'

type TimelineBarProps = {
  scenes: Scene[]
  duration: number
  time: number
  playing: boolean
  /** Scène en lecture, ou -1. */
  activeIndex: number
  onToggle: () => void
  onSeek: (second: number) => void
}

/** Frise du storyboard (F10) : largeur proportionnelle à la durée de chaque scène, lecture simulée. */
export function TimelineBar({ scenes, duration, time, playing, activeIndex, onToggle, onSeek }: TimelineBarProps) {
  const percent = duration > 0 ? Math.min(100, (time / duration) * 100) : 0
  return (
    <div className="sticky top-2 z-10 flex items-center gap-3 rounded-card bg-white p-3 shadow-card sm:gap-4 sm:px-5">
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? fr.wizard.scenes.pause : fr.wizard.scenes.play}
        className="bg-brand flex size-touch shrink-0 items-center justify-center rounded-full text-white transition hover:scale-105 motion-reduce:transition-none"
      >
        <FontAwesomeIcon icon={playing ? faPause : faPlay} aria-hidden />
      </button>
      <div role="group" aria-label={fr.wizard.scenes.timeline} className="relative flex h-touch min-w-0 flex-1 gap-[3px]">
        {scenes.map((scene, index) => {
          const isActive = index === activeIndex
          const isPast = activeIndex >= 0 && index < activeIndex
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSeek(scene.start_second)}
              aria-label={fr.wizard.scenes.seek(scene.position, formatRange(scene.start_second, scene.end_second))}
              style={{ flexGrow: Math.max(1, scene.end_second - scene.start_second) }}
              // Zone cliquable de 44 px de haut (cible tactile) ; le segment visible reste fin
              className="group flex h-touch min-w-0 basis-0 items-center rounded-lg"
            >
              <span
                className={`flex h-9 w-full items-center justify-center overflow-hidden rounded-lg text-[11px] whitespace-nowrap transition-colors group-hover:brightness-95 ${
                  isActive ? 'bg-primary text-white' : isPast ? 'bg-timeline-past text-primary' : 'bg-primary-tint text-primary'
                }`}
              >
                {scene.position}
              </span>
            </button>
          )
        })}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-0.5 rounded bg-ink"
          style={{ left: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-xs text-ink-soft tabular-nums sm:text-[13px]">
        {formatClock(time)} / {formatClock(duration)}
      </span>
    </div>
  )
}
