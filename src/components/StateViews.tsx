import { faCircleNotch, faRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { faFolderOpen as farFolderOpen } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ReactNode } from 'react'

import { ApiError } from '../api/client'
import { fr } from '../i18n/fr'

const box = 'flex flex-col items-center gap-3 rounded-card border border-line bg-white px-4 py-10 text-center'

export function LoadingState({ label = fr.states.loading }: { label?: string }) {
  return (
    <div className={box} aria-live="polite" aria-busy="true">
      <FontAwesomeIcon icon={faCircleNotch} spin className="text-2xl text-primary" aria-hidden />
      <p className="text-muted">{label}</p>
    </div>
  )
}

type EmptyStateProps = {
  title?: string
  message?: string
  /** Appel à l'action, par exemple un lien « Nouvelle vidéo ». */
  action?: ReactNode
}

export function EmptyState({ title = fr.states.emptyTitle, message, action }: EmptyStateProps) {
  return (
    <div className={box}>
      <span className="flex size-12 items-center justify-center rounded-full bg-primary-tint text-xl text-primary">
        <FontAwesomeIcon icon={farFolderOpen} aria-hidden />
      </span>
      <p className="text-base font-medium text-ink">{title}</p>
      {message && <p className="max-w-prose text-muted">{message}</p>}
      {action}
    </div>
  )
}

type ErrorStateProps = {
  error?: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = error instanceof ApiError ? error.detail : fr.errors.generic
  return (
    <div className={box} role="alert">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-bg text-xl text-danger">
        <FontAwesomeIcon icon={faTriangleExclamation} aria-hidden />
      </span>
      <p className="text-base font-medium text-ink">{fr.states.errorTitle}</p>
      <p className="max-w-prose text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-touch items-center gap-2 rounded-field border border-primary bg-white px-4 font-medium text-primary hover:bg-primary-tint"
        >
          <FontAwesomeIcon icon={faRotateRight} aria-hidden />
          {fr.states.retry}
        </button>
      )}
    </div>
  )
}

type QueryStateProps<T> = {
  query: { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}

/** Affiche chargement, erreur (avec Réessayer), vide ou contenu selon l'état d'une requête TanStack Query. */
export function QueryState<T>({ query, isEmpty, empty, children }: QueryStateProps<T>) {
  if (query.isPending) return <LoadingState />
  if (query.isError || query.data === undefined) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  }
  if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState />}</>
  return <>{children(query.data)}</>
}
