import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { ProjectListItem } from '../api/types'
import { fr } from '../i18n/fr'
import { apiError, json, mockApi, renderApp, testConfig, testProject, testUser } from '../test/utils'

const t = fr.pages.projects
const { id, title, theme, duration_seconds, network, ratio, status, created_at, updated_at } = testProject('scenes_ready')
const item: ProjectListItem = { id, title, theme, duration_seconds, network, ratio, status, created_at, updated_at }
const page = (results: ProjectListItem[]) => json({ count: results.length, next: null, previous: null, results })

const base = {
  'GET /api/auth/me/': () => json(testUser),
  'GET /api/config/': () => json(testConfig),
}

describe('Mes projets', () => {
  it("applique la recherche à l'URL et à la requête après une pause de frappe", async () => {
    const api = mockApi({ ...base, 'GET /api/projects/': () => page([item]) })
    const { router } = renderApp('/projects')

    // Premier rendu et anti-rebond de 300 ms : on laisse de la marge quand toute la suite tourne en parallèle
    const patience = { timeout: 3000 }
    await screen.findAllByRole('link', { name: title }, patience)
    await userEvent.type(screen.getAllByRole('searchbox', { name: fr.nav.search }).at(-1)!, 'finance')

    await screen.findAllByRole('link', { name: title }, patience)
    await expect.poll(() => router.state.location.search, patience).toBe('?search=finance')
    await expect
      .poll(() => api.mock.calls.map(([url]) => String(url)), patience)
      .toContain('/api/projects/?search=finance')
  })

  it('filtre par réseau et par statut via l’URL', async () => {
    const api = mockApi({ ...base, 'GET /api/projects/': () => page([item]) })
    const { router } = renderApp('/projects')

    await screen.findAllByRole('link', { name: title })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: t.network }), 'youtube')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: t.status }), 'scenes_ready')

    expect(router.state.location.search).toBe('?network=youtube&status=scenes_ready')
    await expect
      .poll(() => api.mock.calls.map(([url]) => String(url)))
      .toContain('/api/projects/?network=youtube&status=scenes_ready')
  })

  it('rg18 demande confirmation avant de supprimer', async () => {
    const api = mockApi({
      ...base,
      'GET /api/projects/': () => page([item]),
      [`DELETE /api/projects/${id}/`]: () => new Response(null, { status: 204 }),
    })
    renderApp('/projects')

    const [deleteButton] = await screen.findAllByRole('button', { name: `${t.delete} « ${title} »` })
    await userEvent.click(deleteButton!)

    const dialog = await screen.findByRole('dialog', { name: t.deleteTitle })
    expect(api.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
    await userEvent.click(within(dialog).getByRole('button', { name: t.delete }))

    expect(await screen.findByText(t.deleted)).toBeInTheDocument()
    expect(api.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(1)
  })

  it('propose de créer une vidéo quand il n’y a aucun projet', async () => {
    mockApi({ ...base, 'GET /api/projects/': () => page([]) })
    renderApp('/projects')

    expect(await screen.findByText(t.emptyTitle)).toBeInTheDocument()
  })

  it("affiche l'erreur de l'API avec un bouton Réessayer", async () => {
    mockApi({
      ...base,
      'GET /api/projects/': apiError(400, 'VALIDATION_ERROR', 'Filtre de réseau inconnu.'),
    })
    renderApp('/projects')

    expect(await screen.findByRole('alert')).toHaveTextContent('Filtre de réseau inconnu.')
    expect(screen.getByRole('button', { name: fr.states.retry })).toBeInTheDocument()
  })
})
