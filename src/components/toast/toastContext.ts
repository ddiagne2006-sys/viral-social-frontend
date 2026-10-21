import { createContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastInput = {
  message: string
  tone?: ToastTone
  /** Durée d'affichage en ms (2 s par défaut). */
  duration?: number
}

export type ToastApi = {
  show: (toast: ToastInput) => void
}

export const ToastContext = createContext<ToastApi | null>(null)
