import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Project } from '../api/types'
import { fr } from '../i18n/fr'
import { apiError, json, mockApi, renderApp, testConfig, testProject, testUser } from '../test/utils'

const project = testProject('draft')
const P = `/api/projects/${project.id}`
const URL = `/projects/${project.id}`

const base = (current: Project) => ({
  'GET /api/auth/me/': () => json(testUser),
  'GET /api/config/': () => json(testConfig),
  [`GET ${P}/`]: () => json(current),
})

// La page est chargée à la demande par le routeur : on précharge le module pour ne pas fausser les délais
beforeAll(() => import('./ProjectWizard'))

const stepButton = (step: 1 | 2 | 3 | 4) =>
  screen.getByRole('button', { name: new RegExp(`^${step}\\. ${fr.wizard.steps[step]}`) })

describe('ProjectWizard', () => {
  it("affiche l'étape atteinte selon le statut renvoyé par l'API et bloque les étapes futures", async () => {
    mockApi(base(testProject('script_ready')))
    renderApp(URL)

    // Premier rendu de la suite : laisse le temps au routeur de résoudre la route chargée à la demande
    expect(await screen.findByRole('heading', { name: 'Idée numéro 1' }, { timeout: 4000 })).toBeInTheDocument()
    expect(stepButton(3)).toHaveAttribute('aria-current', 'step')
    expect(stepButton(4)).toBeDisabled()
    expect(screen.getAllByRole('textbox')).toHaveLength(5) // les 5 segments du script
  })

  it("permet de revenir à une étape validée sans changer le statut", async () => {
    mockApi(base(testProject('script_ready')))
    renderApp(URL)

    await userEvent.click(await screen.findByRole('button', { name: /^1\. Brief/ }))

    expect(screen.getByRole('textbox', { name: /Thème/ })).toHaveValue(project.theme)
    expect(stepButton(1)).toHaveAttribute('aria-current', 'step')
    expect(stepButton(3)).toBeEnabled()
  })

  it("affiche le sujet compris par l'agent et ses points d'attention au-dessus des idées", async () => {
    const withAlerts = testProject('ideas_ready', {
      ideas_context: {
        interpreted_theme: 'Astuces IA pour gagner du temps',
        alerts: ['Citer les sources à l’écran'],
        safety_alerts: [
          { severity: 'faible', description: 'Aucune instruction conflictuelle détectée.' },
          { severity: 'haute', description: 'Le sujet évoque un produit dangereux.' },
        ],
      },
    })
    mockApi(base(withAlerts))
    renderApp(URL)

    expect(await screen.findByText('Astuces IA pour gagner du temps', {}, { timeout: 3000 })).toBeInTheDocument()
    const note = screen.getByRole('note')
    expect(within(note).getByText(fr.wizard.ideas.alertsTitle)).toBeInTheDocument()
    expect(within(note).getByText('Citer les sources à l’écran')).toBeInTheDocument()
    // Sécurité : seule la gravité « haute » est montrée, avec un libellé clair, jamais en JSON
    expect(
      within(note).getByText(fr.wizard.ideas.safetyAlert('Le sujet évoque un produit dangereux.')),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Aucune instruction conflictuelle/)).not.toBeInTheDocument()
    expect(screen.queryByText(/gravite|\{/)).not.toBeInTheDocument()
  })

  it("n'affiche pas de bandeau quand l'agent ne signale que des alertes de gravité faible", async () => {
    const lowOnly = testProject('ideas_ready', {
      ideas_context: {
        interpreted_theme: 'Astuces IA pour gagner du temps',
        alerts: [],
        safety_alerts: [{ severity: 'faible', description: 'Aucune instruction conflictuelle détectée.' }],
      },
    })
    mockApi(base(lowOnly))
    renderApp(URL)

    expect(await screen.findByText('Astuces IA pour gagner du temps', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it("affiche les avertissements, les faits à vérifier, la légende et les hashtags du script", async () => {
    const base_ = testProject('script_ready')
    const withExtras = testProject('script_ready', {
      script_context: {
        ...base_.script_context,
        warnings: ['Ne pas présenter la recette comme unique.'],
        facts_to_check: ['Origine exacte du plat'],
        safety_alerts: [
          { severity: 'faible', description: 'Aucune instruction conflictuelle détectée.' },
          { severity: 'haute', description: 'Allergènes : arachide' },
        ],
      },
    })
    mockApi(base(withExtras))
    renderApp(URL)

    const note = await screen.findByRole('note', {}, { timeout: 3000 })
    expect(within(note).getByText(fr.wizard.script.warningsTitle)).toBeInTheDocument()
    expect(within(note).getByText('Ne pas présenter la recette comme unique.')).toBeInTheDocument()
    expect(within(note).getByText('Origine exacte du plat')).toBeInTheDocument()
    expect(within(note).getByText(fr.wizard.script.safetyAlert('Allergènes : arachide'))).toBeInTheDocument()
    expect(screen.queryByText(/Aucune instruction conflictuelle/)).not.toBeInTheDocument()
    expect(screen.getByText('Légende proposée par l’agent')).toBeInTheDocument()
    expect(screen.getByText('#finance #epargne')).toBeInTheDocument()
  })

  it('affiche la direction artistique du découpage et seulement les alertes de gravité haute', async () => {
    const ready = testProject('scenes_ready')
    const withLook = testProject('scenes_ready', {
      scenes_context: {
        ...ready.scenes_context,
        visual_style: 'palette : tons chauds',
        visual_references: [{ id: 'PERSO_1', description: 'Cuisinière, boubou orange' }],
        notes: ['Tourner en lumière naturelle.'],
        warnings: ['Ne pas montrer de marque.'],
        safety_alerts: [
          { severity: 'faible', description: 'Aucune instruction conflictuelle détectée.' },
          { severity: 'haute', description: 'Couteau tranchant à l’écran.' },
        ],
      },
    })
    mockApi(base(withLook))
    renderApp(URL)

    const note = await screen.findByRole('note', {}, { timeout: 3000 })
    expect(within(note).getByText('Ne pas montrer de marque.')).toBeInTheDocument()
    expect(within(note).getByText(fr.wizard.scenes.safetyAlert('Couteau tranchant à l’écran.'))).toBeInTheDocument()
    expect(screen.queryByText(/Aucune instruction conflictuelle/)).not.toBeInTheDocument()
    const look = screen.getByRole('region', { name: fr.wizard.scenes.lookTitle })
    expect(within(look).getByText('palette : tons chauds')).toBeInTheDocument()
    expect(within(look).getByText('PERSO_1')).toBeInTheDocument()
    expect(within(look).getByText('Tourner en lumière naturelle.')).toBeInTheDocument()
  })

  it('rg4 désactive « Écrire le script » sans idée choisie, puis le choix l’active', async () => {
    const firstIdea = testProject('ideas_ready').ideas[0]!
    const api = mockApi({
      ...base(testProject('ideas_ready')),
      [`POST ${P}/ideas/${firstIdea.id}/choose/`]: () => json(testProject('idea_chosen')),
    })
    renderApp(URL)

    const writeScript = await screen.findByRole('button', { name: fr.wizard.ideas.writeScript })
    expect(writeScript).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /Idée numéro 1/ }))

    expect(await screen.findByRole('button', { name: /Idée numéro 1/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: fr.wizard.ideas.writeScript })).toBeEnabled()
    const chooseCalls = api.mock.calls.filter(([url]) => String(url).endsWith('/choose/'))
    expect(chooseCalls).toHaveLength(1)
    expect(JSON.parse(String(chooseCalls[0]![1]?.body))).toEqual({ confirm: false })
  })

  it('rg13 affiche un 409 RUN_ALREADY_ACTIVE en toast et conserve la saisie', async () => {
    const detail = 'Une génération est déjà en cours pour cette étape.'
    mockApi({ ...base(project), [`POST ${P}/ideas/`]: apiError(409, 'RUN_ALREADY_ACTIVE', detail) })
    renderApp(URL)

    const theme = await screen.findByRole('textbox', { name: /Thème/ })
    await userEvent.clear(theme)
    await userEvent.type(theme, project.theme) // brief inchangé : l'agent est appelé directement
    await userEvent.click(screen.getByRole('button', { name: fr.wizard.brief.submit }))

    expect(await screen.findByText(detail)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Thème/ })).toBe(theme) // même champ, jamais démonté
    expect(theme).toHaveValue(project.theme)
  })

  it("affiche une panne d'agent (502 AGENT_TIMEOUT) et reste sur l'étape pour relancer", async () => {
    const detail = "L'agent met trop de temps à répondre. Vos données sont conservées, réessayez."
    mockApi({ ...base(testProject('idea_chosen')), [`POST ${P}/script/`]: apiError(502, 'AGENT_TIMEOUT', detail) })
    renderApp(URL)

    await userEvent.click(await screen.findByRole('button', { name: fr.wizard.ideas.writeScript }))

    expect(await screen.findByText(detail)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: fr.wizard.ideas.writeScript })).toBeEnabled()
    expect(stepButton(2)).toHaveAttribute('aria-current', 'step')
  })

  it("affiche l'écran d'attente de l'agent pendant l'appel", async () => {
    let resolve: (response: Response) => void = () => {}
    mockApi({
      ...base(project),
      [`POST ${P}/ideas/`]: () => new Promise<Response>((r) => (resolve = r)),
    })
    renderApp(URL)

    await userEvent.click(await screen.findByRole('button', { name: fr.wizard.brief.submit }))

    expect(await screen.findByText(fr.wizard.loading.ideas, { selector: 'p' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: fr.wizard.brief.submit })).not.toBeInTheDocument()

    resolve(json(testProject('ideas_ready')))
    expect(await screen.findByRole('heading', { name: fr.wizard.ideas.title(project.theme) })).toBeInTheDocument()
  })

  it('rg11 demande confirmation avant d’effacer l’aval puis relance avec confirm=true', async () => {
    const detail = 'Relancer les idées effacera le script et les scènes.'
    let calls = 0
    const api = mockApi({
      ...base(testProject('script_ready')),
      [`POST ${P}/ideas/`]: () =>
        ++calls === 1 ? apiError(409, 'CONFIRMATION_REQUIRED', detail)() : json(testProject('ideas_ready')),
    })
    renderApp(URL)

    await userEvent.click(await screen.findByRole('button', { name: /^2\. Idées/ }))
    await userEvent.click(screen.getByRole('button', { name: fr.wizard.ideas.regenerate }))

    const dialog = await screen.findByRole('dialog', { name: fr.wizard.confirm.title })
    expect(within(dialog).getByText(detail)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: fr.wizard.confirm.confirm }))

    expect(await screen.findByRole('heading', { name: fr.wizard.ideas.title(project.theme) })).toBeInTheDocument()
    expect(api.bodies(`POST ${P}/ideas/`)).toEqual([{ confirm: false }, { confirm: true }])
    expect(stepButton(3)).toBeDisabled() // le script a été effacé : statut revenu à ideas_ready
  })

  it('rg11 ne relance rien si l’utilisateur annule la confirmation', async () => {
    const api = mockApi({
      ...base(testProject('script_ready')),
      [`POST ${P}/ideas/`]: apiError(409, 'CONFIRMATION_REQUIRED', 'Confirmer ?'),
    })
    renderApp(URL)

    await userEvent.click(await screen.findByRole('button', { name: /^2\. Idées/ }))
    await userEvent.click(screen.getByRole('button', { name: fr.wizard.ideas.regenerate }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: fr.wizard.confirm.cancel }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.bodies(`POST ${P}/ideas/`)).toEqual([{ confirm: false }])
  })
})

describe('Nouvelle vidéo', () => {
  it('valide le sujet localement (3 à 200 caractères) sans appeler l’API', async () => {
    const api = mockApi({
      'GET /api/auth/me/': () => json(testUser),
      'GET /api/config/': () => json(testConfig),
    })
    renderApp('/projects/new')

    await userEvent.type(await screen.findByRole('textbox', { name: /Thème/ }), 'ab')
    await userEvent.click(screen.getByRole('button', { name: fr.wizard.brief.submit }))

    expect(screen.getByRole('textbox', { name: /Thème/ })).toHaveAccessibleDescription(
      expect.stringContaining(fr.wizard.brief.themeTooShort(3)),
    )
    expect(api.bodies('POST /api/projects/')).toEqual([])
  })

  it("crée le projet, lance l'agent Idées puis ouvre le projet", async () => {
    const api = mockApi({
      'GET /api/auth/me/': () => json(testUser),
      'GET /api/config/': () => json(testConfig),
      'POST /api/projects/': () => json(project, 201),
      [`POST ${P}/ideas/`]: () => json(testProject('ideas_ready')),
      [`GET ${P}/`]: () => json(testProject('ideas_ready')),
    })
    const { router } = renderApp('/projects/new')

    await userEvent.type(await screen.findByRole('textbox', { name: /Thème/ }), 'Finance personnelle')
    await userEvent.click(screen.getByRole('radio', { name: /YouTube/ }))
    await userEvent.click(screen.getByRole('radio', { name: '60 s' }))
    await userEvent.click(screen.getByRole('button', { name: fr.wizard.brief.submit }))

    expect(await screen.findByRole('heading', { name: fr.wizard.ideas.title(project.theme) })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(URL)
    expect(api.bodies('POST /api/projects/')).toEqual([
      { theme: 'Finance personnelle', network: 'youtube', duration_seconds: 60 },
    ])
    expect(api.bodies(`POST ${P}/ideas/`)).toEqual([{ confirm: false }])
  })

  it("affiche l'erreur renvoyée par l'API et conserve la saisie", async () => {
    const detail = 'Le thème contient un terme refusé.'
    mockApi({
      'GET /api/auth/me/': () => json(testUser),
      'GET /api/config/': () => json(testConfig),
      'POST /api/projects/': apiError(400, 'VALIDATION_ERROR', detail),
    })
    renderApp('/projects/new')

    await userEvent.type(await screen.findByRole('textbox', { name: /Thème/ }), 'Finance personnelle')
    await userEvent.click(screen.getByRole('button', { name: fr.wizard.brief.submit }))

    expect(await screen.findByText(detail)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Thème/ })).toHaveValue('Finance personnelle')
  })
})
