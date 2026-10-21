import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faFilm, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { faFolderOpen as farFolderOpen } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

import { useDashboard } from '../api/projects'
import { PageHeader } from '../components/PageHeader'
import { ProjectCard } from '../components/projects/ProjectCard'
import { EmptyState, QueryState } from '../components/StateViews'
import { buttonClass, cardClass, sectionTitleClass } from '../components/ui/styles'
import { fr } from '../i18n/fr'
import { paths } from '../paths'

const t = fr.pages.dashboard

function StatTile({ label, value, icon }: { label: string; value: number; icon: IconDefinition }) {
  return (
    <div className={`${cardClass} flex items-center gap-4 p-5`}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-field bg-primary-tint text-xl text-primary">
        <FontAwesomeIcon icon={icon} aria-hidden />
      </span>
      <div>
        <p className="text-[13px] text-muted">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </div>
  )
}

const newVideoLink = (
  <Link to={paths.newVideo} className={buttonClass('brand')}>
    <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
    {fr.nav.newVideo}
  </Link>
)

/** Tableau de bord (F15) : compteurs, derniers projets, accès rapide « Nouvelle vidéo ». */
export function Dashboard() {
  const dashboard = useDashboard()

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle}>
        {newVideoLink}
      </PageHeader>
      <QueryState query={dashboard}>
        {(data) => (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatTile label={t.projectsCount} value={data.counts.projects} icon={farFolderOpen} />
              <StatTile label={t.videosReady} value={data.counts.videos_ready} icon={faFilm} />
            </div>
            <section aria-labelledby="recent-projects" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="recent-projects" className={sectionTitleClass}>
                  {t.recent}
                </h2>
                {data.recent_projects.length > 0 && (
                  <Link to={paths.projects} className="flex min-h-touch items-center font-medium text-primary hover:text-primary-hover">
                    {t.seeAll}
                  </Link>
                )}
              </div>
              {data.recent_projects.length === 0 ? (
                <EmptyState title={t.emptyTitle} message={t.emptyMessage} action={newVideoLink} />
              ) : (
                <ul className="grid gap-3 lg:grid-cols-2">
                  {data.recent_projects.map((project) => (
                    <li key={project.id}>
                      <ProjectCard project={project} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </QueryState>
    </>
  )
}
