import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Duration, Network, NetworkOption } from '../../api/types'
import { networkColorClass, networkIcon, orientationLabel } from '../../domain/project'
import { fr } from '../../i18n/fr'

type NetworkPickerProps = {
  options: NetworkOption[]
  value: Network
  onChange: (network: Network) => void
  disabled?: boolean
}

/** Cartes réseau (F2, RG2) : boutons radio accessibles, ratio lu dans la configuration de l'API. */
export function NetworkPicker({ options, value, onChange, disabled = false }: NetworkPickerProps) {
  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 font-medium text-ink-soft">
        {fr.wizard.brief.network} <span aria-hidden="true">*</span>
      </legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-w-0 cursor-pointer flex-col items-start gap-2 rounded-card border-2 border-line bg-white p-3 transition hover:shadow-lift has-checked:-translate-y-0.5 has-checked:border-primary has-checked:bg-primary-tint has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary motion-reduce:transition-none sm:p-4"
          >
            <input
              type="radio"
              name="network"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <FontAwesomeIcon
              icon={networkIcon[option.value]}
              className={`text-2xl ${networkColorClass[option.value]}`}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold text-ink">{option.label}</span>
              <span className="block text-xs text-muted">
                {orientationLabel(option.ratio)} {option.ratio}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

type DurationPickerProps = {
  options: Duration[]
  value: Duration
  onChange: (duration: Duration) => void
  disabled?: boolean
}

/** Durées 15, 30, 60, 90 s (RG1) : boutons radio en pastilles. */
export function DurationPicker({ options, value, onChange, disabled = false }: DurationPickerProps) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-2">
      <legend className="mb-2 font-medium text-ink-soft">
        {fr.wizard.brief.duration} <span aria-hidden="true">*</span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((seconds) => (
          <label
            key={seconds}
            className="inline-flex min-h-touch cursor-pointer items-center rounded-full border border-line bg-white px-5 text-ink-soft transition has-checked:border-primary has-checked:bg-primary has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary motion-reduce:transition-none"
          >
            <input
              type="radio"
              name="duration"
              value={seconds}
              checked={value === seconds}
              onChange={() => onChange(seconds)}
              className="sr-only"
            />
            {fr.wizard.brief.durationLabel(seconds)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
