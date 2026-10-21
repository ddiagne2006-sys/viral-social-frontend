import { faChevronDown, faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRef } from 'react'

import { useExportProject } from '../api/projects'
import type { ExportFormat } from '../api/types'
import { fr } from '../i18n/fr'
import { useErrorToast } from './toast/useErrorToast'
import { useToast } from './toast/useToast'
import { buttonClass, type ButtonVariant } from './ui/styles'

const FORMATS: ExportFormat[] = ['md', 'txt', 'json']

/** Export du dossier complet en Markdown, texte ou JSON (F14). */
export function ExportMenu({ projectId, variant = 'outline' }: { projectId: string; variant?: ButtonVariant }) {
  const exportProject = useExportProject()
  const toast = useToast()
  const showError = useErrorToast()
  const detailsRef = useRef<HTMLDetailsElement>(null)

  function onExport(format: ExportFormat) {
    if (detailsRef.current) detailsRef.current.open = false
    exportProject.mutate(
      { id: projectId, format },
      { onSuccess: () => toast.show({ message: fr.wizard.export.done }), onError: showError },
    )
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className={buttonClass(variant, 'cursor-pointer list-none [&::-webkit-details-marker]:hidden')}
        aria-busy={exportProject.isPending || undefined}
      >
        <FontAwesomeIcon icon={faDownload} aria-hidden />
        {fr.wizard.export.label}
        <FontAwesomeIcon icon={faChevronDown} className="text-xs" aria-hidden />
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-48 rounded-card border border-line bg-white p-1.5 shadow-lift">
        {FORMATS.map((format) => (
          <li key={format}>
            <button
              type="button"
              onClick={() => onExport(format)}
              className="flex min-h-touch w-full items-center rounded-field px-3 text-left text-ink-soft hover:bg-primary-tint hover:text-primary"
            >
              {fr.wizard.export.formats[format]}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
