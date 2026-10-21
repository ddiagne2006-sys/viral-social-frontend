import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'

import type { AgentMetrics, AgentRun, AgentStatus } from '../../api/types'
import { fr } from '../../i18n/fr'
import { json, mockApi, renderApp, testAdmin, testUser } from '../../test/utils'

// Pages chargées à la demande par le routeur : préchargées pour ne pas fausser les délais
beforeAll(() => Promise.all([import('./AdminAgents'), import('./AdminRuns')]))

const t = fr.pages.adminAgents
const patience = { timeout: 3000 }

const agents: AgentStatus[] = [
  {
    agent: 'ideas',
    configured: true,
    last_run: { status: 'error', error_code: 'AGENT_TIMEOUT', duration_ms: 1840, started_at: '2026-10-07T10:00:00Z' },
  },
  { agent: 'script', configured: false, last_run: null },
  {
    agent: 'scenes',
    configured: true,
    last_run: { status: 'success', error_code: null, duration_ms: 950, started_at: '2026-10-07T11:00:00Z' },
  },
]

const metrics: AgentMetrics[] = [
  { agent: 'ideas', runs_count: 4, success_rate: 0.75, avg_duration_ms: 1500, errors_by_code: { AGENT_TIMEOUT: 1 } },
  { agent: 'script', runs_count: 0, success_rate: null, avg_duration_ms: null, errors_by_code: {} },
  { agent: 'scenes', runs_count: 2, success_rate: 1, avg_duration_ms: 12400, errors_by_code: {} },
]

const run: AgentRun = {
  id: '20000000-0000-4000-8000-000000000001',
  agent: 'ideas',
  status: 'error',
  error_code: 'AGENT_INVALID_RESPONSE',
  duration_ms: 1840,
  started_at: '2026-10-07T10:00:00Z',
  user_email: 'createur@example.com',
  project_id: '0b1ec700-0000-4000-8000-000000000001',
}

const page = (results: AgentRun[]) => json({ count: results.length, next: null, previous: null, results })

describe('Administration', () => {
  it('rg16 redirige un créateur vers le tableau de bord', async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testUser),
      'GET /api/dashboard/': () => json({ counts: { projects: 0, videos_ready: 0 }, recent_projects: [] }),
    })
    const { router } = renderApp('/admin/runs')

    expect(await screen.findByRole('heading', { level: 1, name: fr.pages.dashboard.title }, patience)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('Agents IA', () => {
  it('affiche les badges Configuré / Non configuré, et le dernier run', async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testAdmin),
      'GET /api/admin/agents/': () => json(agents),
      'GET /api/admin/metrics/': () => json(metrics),
    })
    renderApp('/admin/agents')

    const cards = await screen.findAllByRole('heading', { level: 2, name: /Idées|Script|Découpage/ }, patience)
    expect(cards.map((h) => h.textContent)).toEqual(['Idées', 'Script', 'Découpage'])
    const ideas = cards[0]!.closest('li')!
    const script = cards[1]!.closest('li')!
    expect(within(ideas).getByText(t.configured)).toBeInTheDocument()
    expect(within(script).getByText(t.notConfigured)).toBeInTheDocument()
    expect(within(script).getByText(t.noRun)).toBeInTheDocument()
    expect(within(ideas).getByText('AGENT_TIMEOUT')).toBeInTheDocument()
    expect(within(ideas).getByText(/1,8 s/)).toBeInTheDocument()
  })

  it("n'affiche aucun champ d'URL ni formulaire d'édition", async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testAdmin),
      'GET /api/admin/agents/': () => json(agents),
      'GET /api/admin/metrics/': () => json(metrics),
    })
    renderApp('/admin/agents')

    await screen.findAllByRole('button', { name: /Tester l’agent/ }, patience)
    expect(screen.queryAllByRole('textbox').filter((el) => el.closest('main'))).toHaveLength(0)
    expect(document.querySelector('main input[type="url"]')).toBeNull()
    expect(document.querySelector('main form')).toBeNull()
    expect(screen.queryByText(/https?:\/\//)).not.toBeInTheDocument()
  })

  it('le bouton Tester affiche le résultat du contrôle de contrat', async () => {
    const api = mockApi({
      'GET /api/auth/me/': () => json(testAdmin),
      'GET /api/admin/agents/': () => json(agents),
      'GET /api/admin/metrics/': () => json(metrics),
      'POST /api/admin/agents/script/test/': () =>
        json({ ok: false, status_code: null, duration_ms: 0, error: 'URL du webhook non configurée.' }),
    })
    renderApp('/admin/agents')

    await userEvent.click(await screen.findByRole('button', { name: t.testAgent('Script') }, patience))

    expect(await screen.findByText(/URL du webhook non configurée/)).toBeInTheDocument()
    expect(api.mock.calls.some(([url]) => String(url) === '/api/admin/agents/script/test/')).toBe(true)
  })

  it('affiche le bloc de métriques', async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testAdmin),
      'GET /api/admin/agents/': () => json(agents),
      'GET /api/admin/metrics/': () => json(metrics),
    })
    renderApp('/admin/agents')

    const block = await screen.findByRole('region', { name: fr.pages.adminMetrics.title }, patience)
    expect(await within(block).findByText('75 %')).toBeInTheDocument()
    expect(within(block).getByText('12,4 s')).toBeInTheDocument()
    expect(within(block).getByText('AGENT_TIMEOUT × 1')).toBeInTheDocument()
    // Script : aucun run terminé, taux et durée nuls → « — »
    const script = within(block).getByText('Script').closest('li')!
    expect(within(script).getAllByText(fr.pages.adminMetrics.noValue)).toHaveLength(2)
  })
})

describe('Journal des runs', () => {
  it('affiche les runs sans aucun contenu de projet', async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testAdmin),
      'GET /api/admin/runs/': () => page([run]),
      'GET /api/admin/metrics/': () => json(metrics),
    })
    renderApp('/admin/runs')

    expect((await screen.findAllByText('AGENT_INVALID_RESPONSE', {}, patience)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(run.user_email).length).toBeGreaterThan(0)
    expect(document.querySelector('main pre')).toBeNull()
  })

  it("affiche l'état vide du journal", async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testAdmin),
      'GET /api/admin/runs/': () => page([]),
      'GET /api/admin/metrics/': () => json(metrics),
    })
    renderApp('/admin/runs')

    expect(await screen.findByText(fr.pages.adminRuns.emptyTitle, {}, patience)).toBeInTheDocument()
    expect(screen.getByText(fr.pages.adminRuns.emptyMessage)).toBeInTheDocument()
  })

  it('applique la période aux runs et aux métriques', async () => {
    const api = mockApi({
      'GET /api/auth/me/': () => json(testAdmin),
      'GET /api/admin/runs/': () => page([]),
      'GET /api/admin/metrics/': () => json(metrics),
    })
    const { router } = renderApp('/admin/runs?from=2026-10-01&to=2026-10-07')

    expect(await screen.findByText(fr.pages.adminRuns.noMatchMessage, {}, patience)).toBeInTheDocument()
    const urls = api.mock.calls.map(([url]) => String(url))
    expect(urls).toContain('/api/admin/runs/?from=2026-10-01&to=2026-10-07')
    expect(urls).toContain('/api/admin/metrics/?from=2026-10-01&to=2026-10-07')
    expect(screen.getByLabelText(fr.pages.adminRuns.from)).toHaveValue('2026-10-01')

    await userEvent.click(screen.getByRole('button', { name: fr.pages.adminRuns.resetPeriod }))

    expect(router.state.location.search).toBe('')
  })
})
