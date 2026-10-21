import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ApiError } from '../api/client'
import { fr } from '../i18n/fr'
import { json, mockApi, notAuthenticated, renderApp, testUser } from '../test/utils'

describe('RequireAuth', () => {
  it('redirige vers /login quand /api/auth/me/ répond 401', async () => {
    mockApi({ 'GET /api/auth/me/': notAuthenticated })
    const { router } = renderApp('/projects')

    expect(await screen.findByRole('heading', { level: 1, name: fr.pages.login.title })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toEqual({ from: '/projects' })
    expect(screen.queryByRole('navigation', { name: fr.nav.label })).not.toBeInTheDocument()
  })

  it('affiche la page protégée quand la session est valide', async () => {
    mockApi({ 'GET /api/auth/me/': () => json(testUser) })
    renderApp('/projects')

    expect(await screen.findByRole('heading', { level: 1, name: fr.pages.projects.title })).toBeInTheDocument()
  })

  it('une réponse 401 en cours de session ramène à /login', async () => {
    mockApi({ 'GET /api/auth/me/': () => json(testUser) })
    const { router, queryClient } = renderApp('/projects')
    await screen.findByRole('heading', { level: 1, name: fr.pages.projects.title })

    // Une requête quelconque découvre que la session a expiré
    await act(() =>
      queryClient
        .fetchQuery({
          queryKey: ['projects'],
          queryFn: () => Promise.reject(new ApiError(401, 'NOT_AUTHENTICATED', 'Vous devez être connecté.')),
        })
        .catch(() => undefined),
    )

    expect(await screen.findByRole('heading', { level: 1, name: fr.pages.login.title })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})
