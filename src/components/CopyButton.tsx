import { faCopy as farCopy } from '@fortawesome/free-regular-svg-icons'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { fr } from '../i18n/fr'
import { copyText } from './copyText'

/** Durée du retour « Copié » ou « Copie impossible ». */
export const COPY_FEEDBACK_MS = 2000

type CopyButtonProps = {
  text: string
  /** Nom accessible et info-bulle. */
  label: string
  /** Texte visible à côté de l'icône (sinon bouton icône seul). */
  children?: ReactNode
  className?: string
}

/** Bouton de copie avec retour visible dans le bouton pendant 2 secondes, annoncé aux lecteurs d'écran. */
export function CopyButton({ text, label, children, className = '' }: CopyButtonProps) {
  const [result, setResult] = useState<'copied' | 'failed' | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function onClick() {
    const ok = await copyText(text)
    clearTimeout(timer.current)
    setResult(ok ? 'copied' : 'failed')
    timer.current = setTimeout(() => setResult(null), COPY_FEEDBACK_MS)
  }

  const icon = result === 'copied' ? faCheck : result === 'failed' ? faXmark : farCopy
  const feedback = result === 'copied' ? fr.common.copied : result === 'failed' ? fr.common.copyFailedSelect : ''

  return (
    <span className="flex shrink-0 items-center gap-1">
      <span role="status" className="max-w-40 text-right text-xs font-medium">
        {feedback}
      </span>
      <button
        type="button"
        onClick={() => void onClick()}
        aria-label={label}
        title={label}
        className={`flex min-h-touch min-w-touch shrink-0 items-center justify-center gap-1.5 rounded-field ${
          children ? 'px-3 text-xs' : ''
        } ${className}`}
      >
        <FontAwesomeIcon icon={icon} fixedWidth aria-hidden />
        {children}
      </button>
    </span>
  )
}
