import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCheck, faClapperboard, faLightbulb, faMicrophoneLines, faPen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { STEPS, type Step } from '../../domain/project'
import { fr } from '../../i18n/fr'

const stepIcons: Record<Step, IconDefinition> = {
  1: faPen,
  2: faLightbulb,
  3: faMicrophoneLines,
  4: faClapperboard,
}

type StepperProps = {
  /** Étape affichée. */
  current: Step
  /** Étape atteinte d'après le statut du projet : impossible d'aller au-delà. */
  reached: Step
  onSelect: (step: Step) => void
  /** Pendant un appel d'agent, on ne change pas d'étape. */
  disabled?: boolean
}

/** Fil d'étapes (F11) : indicateur compact sur mobile, chevrons dès md. */
export function Stepper({ current, reached, onSelect, disabled = false }: StepperProps) {
  return (
    <nav aria-label={fr.wizard.stepsLabel}>
      <p className="mb-2 flex items-center gap-2 font-medium text-primary md:hidden" aria-hidden="true">
        <FontAwesomeIcon icon={stepIcons[current]} />
        {fr.wizard.stepOf(current, STEPS.length)} · {fr.wizard.steps[current]}
      </p>
      <ol className="flex gap-2 md:gap-0">
        {STEPS.map((step) => {
          const isCurrent = step === current
          const isDone = step < reached
          const isFuture = step > reached
          const label = `${step}. ${fr.wizard.steps[step]}${isDone ? `, ${fr.wizard.stepDone}` : ''}`
          return (
            <li key={step} className="md:relative md:-mr-2 md:h-11 md:min-w-0 md:flex-1 md:bg-primary md:clip-chevron">
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                disabled={isFuture || isCurrent || disabled}
                onClick={() => onSelect(step)}
                aria-label={label}
                className={`flex size-touch items-center justify-center gap-1.5 overflow-hidden rounded-full border-2 text-[13px] font-medium whitespace-nowrap transition-colors md:absolute md:inset-[1.5px] md:size-auto md:rounded-none md:border-0 md:px-5 md:clip-chevron ${
                  isCurrent
                    ? 'border-primary bg-primary text-white'
                    : isFuture
                      ? 'border-line bg-white text-muted md:text-primary/60'
                      : 'border-primary bg-white text-primary enabled:hover:bg-primary-tint'
                } disabled:cursor-default`}
              >
                <FontAwesomeIcon icon={isDone ? faCheck : stepIcons[step]} aria-hidden />
                <span className="hidden truncate md:inline" aria-hidden="true">
                  {step}. {fr.wizard.steps[step]}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
