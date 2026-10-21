import type { ReactNode } from 'react'

/** Actions d'une étape : collées en bas de l'écran sur mobile (au-dessus des onglets), en ligne dès lg. */
export function StepActions({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex gap-2 border-t border-line bg-white px-4 py-3 *:flex-1 lg:static lg:z-auto lg:justify-end lg:border-0 lg:bg-transparent lg:p-0 lg:*:flex-none">
      {children}
    </div>
  )
}
