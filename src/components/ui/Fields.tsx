import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ComponentProps, useId } from 'react'

import { fieldClass } from './styles'

type SelectProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string
  /** Libellé visible au-dessus du champ, ou seulement pour les lecteurs d'écran. */
  hideLabel?: boolean
  options: { value: string; label: string }[]
}

export function Select({ label, hideLabel = false, options, className = '', ...props }: SelectProps) {
  const id = useId()
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'font-medium text-ink-soft'}>
        {label}
      </label>
      <select id={id} className={`${fieldClass} pr-8`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

type SearchFieldProps = Omit<ComponentProps<'input'>, 'id' | 'type'> & { label: string }

export function SearchField({ label, className = '', ...props }: SearchFieldProps) {
  const id = useId()
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input id={id} type="search" className={`${fieldClass} pl-9`} {...props} />
    </div>
  )
}
