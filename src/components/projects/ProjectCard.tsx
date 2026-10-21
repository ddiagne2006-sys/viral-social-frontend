import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { ProjectListItem } from '../../api/types'
import { formatDate } from '../../domain/project'
import { fr } from '../../i18n/fr'
import { paths } from '../../paths'
import { NetworkBadge, ProjectStatusBadge } from '../ui/Badges'
import { cardClass } from '../ui/styles'

/** Projet en carte (tableau de bord, liste mobile). Le titre est le lien vers l'assistant. */
export function ProjectCard({ project, actions }: { project: ProjectListItem; actions?: ReactNode }) {
  return (
    <article className={`${cardClass} flex flex-col gap-3 p-4`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-bold text-ink">
            <Link to={paths.project(project.id)} className="hover:text-primary">
              {project.title || project.theme}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-muted">{project.theme}</p>
        </div>
        {!actions && <FontAwesomeIcon icon={faArrowRight} className="mt-1 text-muted" aria-hidden />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NetworkBadge network={project.network} />
        <span className="text-xs text-muted">{fr.common.recap(project.ratio, project.duration_seconds)}</span>
        <ProjectStatusBadge status={project.status} />
        <span className="ml-auto text-xs text-muted">{formatDate(project.updated_at)}</span>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 border-t border-surface-muted pt-3">{actions}</div>}
    </article>
  )
}
