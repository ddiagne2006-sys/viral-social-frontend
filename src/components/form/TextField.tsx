import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ComponentProps, useId } from 'react'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  /** Message affiché sous le champ (validation locale ou erreur `fields` de l'API). */
  error?: string
}

export function TextField({ label, error, className = '', ...inputProps }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-touch w-full rounded-field border bg-white px-3 text-ink placeholder:text-muted ${
          error ? 'border-danger' : 'border-line focus:border-primary'
        } ${className}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-[13px] text-danger">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" aria-hidden />
          <span className="min-w-0 break-words">{error}</span>
        </p>
      )}
    </div>
  )
}
