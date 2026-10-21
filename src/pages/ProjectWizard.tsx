import { faRobot, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQueryClient } from '@tanstack/react-query'
import { useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  useChooseIdea,
  useConfig,
  useCreateProject,
  useGenerateIdeas,
  useGenerateScenes,
  useGenerateScript,
  useProject,
  useUpdateBrief,
} from '../api/projects'
import { NEW_PROJECT, queryKeys } from '../api/queryKeys'
import type { AgentName, AppConfig, Dashboard, Project, ProjectCreate } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { ShellSlotContext } from '../components/shell/ShellSlotContext'
import { ErrorState, LoadingState } from '../components/StateViews'
import { useErrorToast } from '../components/toast/useErrorToast'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Dialog'
import { useConfirmable } from '../components/useConfirmable'
import { AgentLoading } from '../components/wizard/AgentLoading'
import { AgentStatus } from '../components/wizard/AgentStatus'
import { Stepper } from '../components/wizard/Stepper'
import { stepFromStatus, type Step } from '../domain/project'
import { fr } from '../i18n/fr'
import { paths } from '../paths'
import { BriefStep } from './wizard/BriefStep'
import { IdeasStep } from './wizard/IdeasStep'
import { ScenesStep } from './wizard/ScenesStep'
import { ScriptStep } from './wizard/ScriptStep'

const t = fr.pages.wizard

/**
 * Nouvelle vidéo (/projects/new) et projet existant (/projects/:projectId).
 * Une nouvelle instance par projet : « Recommencer » repart d'un assistant vierge.
 */
export function ProjectWizard() {
  const { projectId } = useParams()
  const location = useLocation()
  return <Wizard key={projectId ?? location.key} projectId={projectId} />
}

function Wizard({ projectId }: { projectId?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const config = useConfig()
  const project = useProject(projectId)
  const slot = useContext(ShellSlotContext)
  const showError = useErrorToast()
  const { run, dialog } = useConfirmable()

  const id = projectId ?? NEW_PROJECT
  const create = useCreateProject()
  const updateBrief = useUpdateBrief(id)
  const generateIdeas = useGenerateIdeas(id)
  const chooseIdea = useChooseIdea(id)
  const generateScript = useGenerateScript(id)
  const generateScenes = useGenerateScenes(id)

  const [viewStep, setViewStep] = useState<Step | null>(null)
  const [loadingAgent, setLoadingAgent] = useState<AgentName | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const data = project.data
  const reached: Step = data ? stepFromStatus(data.status) : 1
  // L'utilisateur peut revenir en arrière, jamais avancer au-delà du statut renvoyé par l'API
  const step: Step = Math.min(viewStep ?? reached, reached) as Step
  const busy = loadingAgent !== null || create.isPending || updateBrief.isPending

  /** Appel d'agent avec écran d'attente, confirmation RG11 et passage à l'étape atteinte. */
  function runAgent(agent: AgentName, action: (confirm: boolean) => Promise<Project>, onDone?: (ok: boolean) => void) {
    if (loadingAgent) return // RG13 : le second clic est ignoré
    run(
      async (confirm) => {
        setLoadingAgent(agent)
        try {
          return await action(confirm)
        } finally {
          setLoadingAgent(null)
        }
      },
      {
        onSuccess: (updated) => {
          setViewStep(stepFromStatus(updated.status))
          onDone?.(true)
        },
        onFailure: () => onDone?.(false),
      },
    )
  }

  function submitBrief(brief: ProjectCreate) {
    if (!data) {
      // Nouvelle vidéo : on crée le projet, on lance l'agent 1, puis on ouvre le projet (même en cas d'échec)
      create.mutate(brief, {
        onError: showError,
        onSuccess: (created) =>
          runAgent(
            'ideas',
            (confirm) => generateIdeas.mutateAsync({ confirm, projectId: created.id }),
            () => navigate(paths.project(created.id), { replace: true }),
          ),
      })
      return
    }
    const unchanged =
      brief.theme === data.theme &&
      brief.network === data.network &&
      brief.duration_seconds === data.duration_seconds
    const launchIdeas = () => runAgent('ideas', (confirm) => generateIdeas.mutateAsync({ confirm }))
    if (unchanged) return launchIdeas()
    run((confirm) => updateBrief.mutateAsync({ ...brief, confirm }), { onSuccess: launchIdeas })
  }

  const header = (
    <PageHeader title={t.title} subtitle={t.subtitle}>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="lg:hidden"
          onClick={() => setPanelOpen(true)}
          aria-label={t.openAgentsPanel}
        >
          <FontAwesomeIcon icon={faRobot} aria-hidden />
          {t.agentsPanel}
        </Button>
        <Button variant="secondary" icon={faRotateLeft} onClick={() => navigate(paths.newVideo)} disabled={busy}>
          {t.restart}
        </Button>
      </div>
    </PageHeader>
  )

  const agentStatus = <AgentStatus projectId={id} project={data} />

  function stepContent(appConfig: AppConfig) {
    if (!data || step === 1) {
      const lastBrief = data ? undefined : queryClient.getQueryData<Dashboard>(queryKeys.dashboard)?.recent_projects[0]
      return (
        <BriefStep
          config={appConfig}
          initial={
            data
              ? { theme: data.theme, network: data.network, duration_seconds: data.duration_seconds }
              : { network: lastBrief?.network, duration_seconds: lastBrief?.duration_seconds }
          }
          busy={busy}
          onSubmit={submitBrief}
        />
      )
    }
    const networkLabel = appConfig.networks.find((option) => option.value === data.network)?.label ?? data.network
    const recap = fr.common.recap(networkLabel, data.duration_seconds)
    if (step === 2) {
      return (
        <IdeasStep
          project={data}
          recap={recap}
          busy={busy}
          choosingId={chooseIdea.isPending ? (chooseIdea.variables?.ideaId ?? null) : null}
          onChoose={(ideaId) => {
            if (chooseIdea.isPending || ideaId === data.chosen_idea_id) return
            run((confirm) => chooseIdea.mutateAsync({ ideaId, confirm }))
          }}
          onRegenerate={() => runAgent('ideas', (confirm) => generateIdeas.mutateAsync({ confirm }))}
          onWriteScript={() => runAgent('script', (confirm) => generateScript.mutateAsync({ confirm }))}
        />
      )
    }
    const makeScenes = () => runAgent('scenes', () => generateScenes.mutateAsync())
    if (step === 3) {
      return (
        <ScriptStep
          project={data}
          recap={recap}
          segmentMaxLength={appConfig.segment_max_length}
          busy={busy}
          onChangeIdea={() => setViewStep(2)}
          onMakeScenes={makeScenes}
        />
      )
    }
    return <ScenesStep project={data} busy={busy} onRerun={makeScenes} />
  }

  /** Pendant un appel d'agent, l'étape reste montée mais masquée : une saisie en attente d'enregistrement n'est pas perdue. */
  function body(appConfig: AppConfig) {
    return (
      <>
        {loadingAgent && <AgentLoading agent={loadingAgent} />}
        <div hidden={loadingAgent !== null}>{stepContent(appConfig)}</div>
      </>
    )
  }

  return (
    // pb : place pour les actions collées en bas sur mobile
    <div className="flex flex-col gap-5 pb-20 lg:pb-0">
      {header}
      <Stepper current={step} reached={reached} onSelect={setViewStep} disabled={busy} />

      {config.isPending || (projectId && project.isPending) ? (
        <LoadingState />
      ) : config.isError ? (
        <ErrorState error={config.error} onRetry={() => void config.refetch()} />
      ) : projectId && project.isError ? (
        <ErrorState error={project.error} onRetry={() => void project.refetch()} />
      ) : (
        body(config.data)
      )}

      {slot && createPortal(agentStatus, slot)}
      <Modal open={panelOpen} title={t.agentsPanel} onClose={() => setPanelOpen(false)} variant="drawer">
        {agentStatus}
      </Modal>
      {dialog}
    </div>
  )
}
