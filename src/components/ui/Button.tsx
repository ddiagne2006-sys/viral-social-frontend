import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ComponentProps } from 'react'

import { buttonClass, type ButtonVariant } from './styles'

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant
  icon?: IconDefinition
  /** Affiche un indicateur de chargement et désactive le bouton. */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, className)}
      {...props}
    >
      {loading ? (
        <FontAwesomeIcon icon={faCircleNotch} spin aria-hidden />
      ) : (
        icon && <FontAwesomeIcon icon={icon} aria-hidden />
      )}
      {children}
    </button>
  )
}

type IconButtonProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  icon: IconDefinition
  /** Libellé obligatoire : un bouton sans texte doit être nommé. */
  label: string
  loading?: boolean
}

export function IconButton({ icon, label, loading = false, disabled, className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={`inline-flex size-touch shrink-0 items-center justify-center rounded-field border border-line bg-white text-muted transition enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      <FontAwesomeIcon icon={loading ? faCircleNotch : icon} spin={loading} aria-hidden />
    </button>
  )
}
