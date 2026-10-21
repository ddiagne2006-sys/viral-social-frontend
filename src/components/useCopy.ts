import { useCallback } from 'react'

import { fr } from '../i18n/fr'
import { copyText } from './copyText'
import { useToast } from './toast/useToast'

/** Copie dans le presse-papiers (avec repli) et confirme par un toast. */
export function useCopy() {
  const toast = useToast()
  return useCallback(
    async (text: string, successMessage: string) => {
      if (await copyText(text)) {
        toast.show({ message: successMessage })
      } else {
        toast.show({ tone: 'error', message: fr.common.copyFailedSelect, duration: 4000 })
      }
    },
    [toast],
  )
}
