import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { Network, ProjectStatus, RunStatus } from '../../api/types'
import { networkColorClass, networkIcon } from '../../domain/project'
import { fr } from '../../i18n/fr'

const badge = 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap'

const projectStatusClass: Record<ProjectStatus, string> = {
  draft: 'bg-surface-muted text-ink-soft',
  ideas_ready: 'bg-info-bg text-primary',
  idea_chosen: 'bg-info-bg text-primary',
  script_ready: 'bg-warning-bg text-warning',
  scenes_ready: 'bg-success-bg text-success',
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`${badge} ${projectStatusClass[status]}`}>{fr.projectStatus[status]}</span>
}

const runStatusClass: Record<RunStatus, string> = {
  pending: 'bg-surface-muted text-ink-soft',
  running: 'bg-warning-bg text-warning',
  success: 'bg-success-bg text-success',
  error: 'bg-danger-bg text-danger',
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return <span className={`${badge} ${runStatusClass[status]}`}>{fr.runStatus[status]}</span>
}

export function NetworkBadge({ network, label }: { network: Network; label?: string }) {
  return (
    <span className={`${badge} bg-surface-muted text-ink-soft`}>
      <FontAwesomeIcon icon={networkIcon[network]} className={networkColorClass[network]} aria-hidden />
      {label ?? fr.networks[network]}
    </span>
  )
}
