import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { fr } from '../i18n/fr'
import { json, mockApi, notAuthenticated, renderApp, testUser } from '../test/utils'

describe('AppShell', () => {
  it('affiche la navigation principale (barre latérale et onglets mobiles)', async () => {
    mockApi({ 'GET /api/auth/me/': () => json(testUser) })
    renderApp('/')

    const navs = await screen.findAllByRole('navigation', { name: fr.nav.label })
    expect(navs).toHaveLength(2)
    for (const nav of navs) {
      for (const label of [fr.nav.dashboard, fr.nav.newVideo, fr.nav.projects, fr.nav.settings]) {
        expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
      }
    }
  })

  it("marque la page courante et navigue d'une page à l'autre", async () => {
    mockApi({ 'GET /api/auth/me/': () => json(testUser) })
    const { router } = renderApp('/')
    const [sidebar] = await screen.findAllByRole('navigation', { name: fr.nav.label })

    expect(within(sidebar!).getByRole('link', { name: fr.nav.dashboard })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(within(sidebar!).getByRole('link', { name: fr.nav.projects }))

    expect(router.state.location.pathname).toBe('/projects')
    expect(screen.getByRole('heading', { level: 1, name: fr.pages.projects.title })).toBeInTheDocument()
    expect(within(sidebar!).getByRole('link', { name: fr.nav.projects })).toHaveAttribute('aria-current', 'page')
  })

  it("n'affiche qu'un seul h1 par page", async () => {
    mockApi({ 'GET /api/auth/me/': () => json(testUser) })
    renderApp('/settings')

    await screen.findByRole('heading', { level: 1, name: fr.pages.settings.title })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it("affiche l'utilisateur connecté", async () => {
    mockApi({ 'GET /api/auth/me/': () => json(testUser) })
    renderApp('/')

    expect(await screen.findByText(testUser.full_name)).toBeInTheDocument()
    expect(screen.getByText(testUser.email)).toBeInTheDocument()
  })

  it('la déconnexion vide le cache et ramène à /login', async () => {
    let loggedIn = true
    const fetchMock = mockApi({
      'GET /api/auth/me/': () => (loggedIn ? json(testUser) : notAuthenticated()),
      'POST /api/auth/logout/': () => {
        loggedIn = false
        return new Response(null, { status: 204 })
      },
    })
    const { router, queryClient } = renderApp('/projects')

    const [logoutButton] = await screen.findAllByRole('button', { name: fr.account.logout })
    await userEvent.click(logoutButton!)

    expect(await screen.findByRole('heading', { level: 1, name: fr.pages.login.title })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(queryClient.getQueryData(['me'])).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout/', expect.objectContaining({ method: 'POST' }))
  })
})
