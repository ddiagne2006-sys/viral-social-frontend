import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { fr } from '../i18n/fr'

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="bg-brand flex size-9 items-center justify-center rounded-field text-white">
        <FontAwesomeIcon icon={faBolt} aria-hidden />
      </span>
      <span className="text-base font-bold text-ink">{fr.app.name}</span>
    </span>
  )
}
