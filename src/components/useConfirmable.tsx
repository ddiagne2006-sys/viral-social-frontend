import { useCallback, useState } from 'react'

import { ApiError } from '../api/client'
import { fr } from '../i18n/fr'
import { useErrorToast } from './toast/useErrorToast'
import { ConfirmDialog } from './ui/Dialog'

type PendingConfirmation = { message: string; retry: () => void; cancel: () => void }

type RunOptions<T> = {
  onSuccess?: (result: T) => void
  /** Appelé après le toast d'erreur, ou si l'utilisateur refuse la confirmation. */
  onFailure?: () => void
}

/**
 * RG11 : relancer une étape en amont efface l'aval après confirmation.
 * `run(action)` appelle l'action avec confirm=false ; si le serveur répond 409 CONFIRMATION_REQUIRED,
 * la boîte de dialogue affiche son message puis relance avec confirm=true. Les autres erreurs vont en toast.
 */
export function useConfirmable() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null)
  const showError = useErrorToast()

  const run = useCallback(
    <T,>(action: (confirm: boolean) => Promise<T>, { onSuccess, onFailure }: RunOptions<T> = {}) => {
      const fail = (error: unknown) => {
        showError(error)
        onFailure?.()
      }
      action(false).then(onSuccess, (error: unknown) => {
        if (error instanceof ApiError && error.code === 'CONFIRMATION_REQUIRED') {
          setPending({
            message: error.detail,
            retry: () => void action(true).then(onSuccess, fail),
            cancel: () => onFailure?.(),
          })
        } else {
          fail(error)
        }
      })
    },
    [showError],
  )

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={fr.wizard.confirm.title}
      message={pending?.message ?? ''}
      confirmLabel={fr.wizard.confirm.confirm}
      cancelLabel={fr.wizard.confirm.cancel}
      tone="danger"
      onConfirm={() => {
        const retry = pending?.retry
        setPending(null)
        retry?.()
      }}
      onCancel={() => {
        pending?.cancel()
        setPending(null)
      }}
    />
  )

  return { run, dialog }
}
