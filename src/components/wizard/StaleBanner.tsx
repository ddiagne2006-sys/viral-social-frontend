import { faArrowsRotate, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { fr } from '../../i18n/fr'
import { Button } from '../ui/Button'

/** RG10 : le script a changé après le découpage, on propose de relancer l'agent 3. */
export function StaleBanner({ onRerun, disabled = false }: { onRerun: () => void; disabled?: boolean }) {
  const t = fr.wizard.scenes
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-card bg-warning-bg px-4 py-3">
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning" aria-hidden />
      <div className="min-w-0 flex-1 basis-60">
        <p className="font-bold text-ink">{t.staleTitle}</p>
        <p className="text-[13px] text-ink-soft">{t.staleMessage}</p>
      </div>
      <Button variant="secondary" icon={faArrowsRotate} onClick={onRerun} disabled={disabled}>
        {t.rerun}
      </Button>
    </div>
  )
}
