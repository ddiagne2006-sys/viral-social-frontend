import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faClapperboard, faLightbulb, faMicrophoneLines } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useIsMutating } from '@tanstack/react-query'
import { useId } from 'react'

import { agentMutationKey } from '../../api/queryKeys'
import type { AgentName, Project } from '../../api/types'
import { stepFromStatus } from '../../domain/project'
import { fr } from '../../i18n/fr'

type AgentState = keyof typeof fr.agents.states

const AGENTS: { name: AgentName; icon: IconDefinition }[] = [
  { name: 'ideas', icon: faLightbulb },
  { name: 'script', icon: faMicrophoneLines },
  { name: 'scenes', icon: faClapperboard },
]

const stateClass: Record<AgentState, { icon: string; text: string }> = {
  waiting: { icon: 'bg-surface-muted text-muted', text: 'text-muted' },
  ready: { icon: 'bg-info-bg text-primary', text: 'text-primary' },
  running: { icon: 'animate-pulse-warning bg-warning-bg text-warning', text: 'text-warning' },
  done: { icon: 'bg-success-bg text-success', text: 'text-success' },
  error: { icon: 'bg-danger-bg text-danger', text: 'text-danger' },
}

/** État d'un agent, dérivé du statut du projet (source de vérité), de son dernier run et des appels en cours. */
function agentState(name: AgentName, project: Project | undefined, running: boolean): AgentState {
  if (running) return 'running'
  if (project?.agents[name]?.status === 'error') return 'error'
  const step = project ? stepFromStatus(project.status) : 1
  const done = { ideas: step >= 2, script: step >= 3, scenes: step >= 4 }
  if (done[name]) return 'done'
  const ready = { ideas: true, script: done.ideas && Boolean(project?.chosen_idea_id), scenes: done.script }
  return ready[name] ? 'ready' : 'waiting'
}

function useRunning(projectId: string, agent: AgentName) {
  return useIsMutating({ mutationKey: agentMutationKey(projectId, agent) }) > 0
}

/** Panneau « Agents IA » (F12). */
export function AgentStatus({ projectId, project }: { projectId: string; project?: Project }) {
  const titleId = useId()
  const running = {
    ideas: useRunning(projectId, 'ideas'),
    script: useRunning(projectId, 'script'),
    scenes: useRunning(projectId, 'scenes'),
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 rounded-card bg-white p-4">
      <h2 id={titleId} className="text-xs font-medium tracking-wider text-muted uppercase">
        {fr.pages.wizard.agentsPanel}
      </h2>
      <ul className="flex flex-col gap-3">
        {AGENTS.map(({ name, icon }) => {
          const state = agentState(name, project, running[name])
          return (
            <li key={name} className="flex items-center gap-2.5 text-[13px]">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs transition-colors ${stateClass[state].icon}`}
                aria-hidden="true"
              >
                <FontAwesomeIcon icon={icon} />
              </span>
              <span className="flex-1 text-ink">{fr.agents.names[name]}</span>
              <span className={`text-[11px] font-medium ${stateClass[state].text}`}>{fr.agents.states[state]}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
