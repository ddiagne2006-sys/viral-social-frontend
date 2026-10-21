import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

import { fr } from '../../i18n/fr'
import { IconButton } from './Button'

type PaginationProps = {
  page: number
  hasPrevious: boolean
  hasNext: boolean
  onChange: (page: number) => void
}

export function Pagination({ page, hasPrevious, hasNext, onChange }: PaginationProps) {
  if (!hasPrevious && !hasNext) return null
  return (
    <nav aria-label={fr.common.page(page)} className="mt-6 flex items-center justify-center gap-3">
      <IconButton
        icon={faChevronLeft}
        label={fr.common.previous}
        disabled={!hasPrevious}
        onClick={() => onChange(page - 1)}
      />
      <span className="min-w-20 text-center text-muted">{fr.common.page(page)}</span>
      <IconButton icon={faChevronRight} label={fr.common.next} disabled={!hasNext} onClick={() => onChange(page + 1)} />
    </nav>
  )
}
