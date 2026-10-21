import { useCallback } from 'react'

import { ApiError } from '../../api/client'
import { fr } from '../../i18n/fr'
import { useToast } from './useToast'

/** Affiche une erreur d'API dans un toast : le `detail` en français renvoyé par le serveur. */
export function useErrorToast() {
  const toast = useToast()
  return useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiError)) {
        toast.show({ tone: 'error', message: fr.errors.generic, duration: 5000 })
        return
      }
      toast.show({ tone: 'error', message: error.detail, duration: 5000 })
    },
    [toast],
  )
}
