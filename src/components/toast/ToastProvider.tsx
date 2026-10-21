import { faCircleCheck, faCircleInfo, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { fr } from '../../i18n/fr'
import { ToastContext, type ToastInput, type ToastTone } from './toastContext'

type Toast = Required<ToastInput> & { id: number }

const toneStyles: Record<ToastTone, { box: string; icon: typeof faCircleCheck }> = {
  success: { box: 'bg-success-bg text-success', icon: faCircleCheck },
  error: { box: 'bg-danger-bg text-danger', icon: faTriangleExclamation },
  info: { box: 'bg-info-bg text-primary', icon: faCircleInfo },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const show = useCallback(
    ({ message, tone = 'success', duration = 2000 }: ToastInput) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, message, tone, duration }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end"
      >
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone]
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card py-2 pl-4 pr-1 shadow-lg ${style.box}`}
            >
              <FontAwesomeIcon icon={style.icon} aria-hidden />
              <p className="min-w-0 flex-1 break-words font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label={fr.toast.close}
                className="flex size-touch shrink-0 items-center justify-center rounded-field hover:bg-white/60"
              >
                <FontAwesomeIcon icon={faXmark} aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
