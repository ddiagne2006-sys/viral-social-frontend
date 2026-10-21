import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  /** Actions à droite (bouton principal de la page). */
  children?: ReactNode
}

/** En-tête de page : le seul h1 de la page. */
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-60">
        <h1 className="text-title break-words text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
