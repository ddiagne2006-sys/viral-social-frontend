import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { fr } from '../i18n/fr'
import { json, mockApi, notAuthenticated, renderApp, testUser } from '../test/utils'

const t = fr.pages.login

async function openRegisterForm() {
  await userEvent.click(await screen.findByRole('button', { name: t.modeRegister }))
}

describe('Login', () => {
  it("affiche l'erreur de l'API sous le bon champ", async () => {
    const fetchMock = mockApi({
      'GET /api/auth/me/': notAuthenticated,
      'POST /api/auth/register/': () =>
        json(
          {
            detail: 'Les données envoyées sont invalides.',
            code: 'VALIDATION_ERROR',
            fields: { email: ['Un compte existe déjà avec cette adresse e-mail.'] },
          },
          400,
        ),
    })
    renderApp('/login')
    await openRegisterForm()

    await userEvent.type(screen.getByLabelText(t.fullName), 'Awa Diallo')
    await userEvent.type(screen.getByLabelText(t.email), 'awa@example.com')
    await userEvent.type(screen.getByLabelText(t.password), 'Mot-de-passe-solide-1')
    await userEvent.click(screen.getByRole('button', { name: t.submitRegister }))

    const email = screen.getByLabelText(t.email)
    expect(await screen.findByText('Un compte existe déjà avec cette adresse e-mail.')).toBeInTheDocument()
    expect(email).toHaveAccessibleDescription('Un compte existe déjà avec cette adresse e-mail.')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(t.password)).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const [, init] = fetchMock.mock.calls.find(([url]) => String(url) === '/api/auth/register/')!
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'awa@example.com',
      password: 'Mot-de-passe-solide-1',
      full_name: 'Awa Diallo',
    })
  })

  it("affiche telle quelle une erreur de l'API sans champ (identifiants invalides)", async () => {
    mockApi({
      'GET /api/auth/me/': notAuthenticated,
      'POST /api/auth/login/': () =>
        json({ detail: 'E-mail ou mot de passe incorrect.', code: 'INVALID_CREDENTIALS' }, 400),
    })
    renderApp('/login')

    await userEvent.type(await screen.findByLabelText(t.email), 'awa@example.com')
    await userEvent.type(screen.getByLabelText(t.password), 'mauvais')
    await userEvent.click(screen.getByRole('button', { name: t.submitLogin }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou mot de passe incorrect.')
  })

  it("valide localement sans appeler l'API", async () => {
    const fetchMock = mockApi({ 'GET /api/auth/me/': notAuthenticated })
    renderApp('/login')
    await openRegisterForm()

    await userEvent.type(screen.getByLabelText(t.email), 'pas-un-email')
    await userEvent.type(screen.getByLabelText(t.password), 'court')
    await userEvent.click(screen.getByRole('button', { name: t.submitRegister }))

    expect(screen.getByLabelText(t.fullName)).toHaveAccessibleDescription(t.errors.fullNameRequired)
    expect(screen.getByLabelText(t.email)).toHaveAccessibleDescription(t.errors.emailInvalid)
    expect(screen.getByLabelText(t.password)).toHaveAccessibleDescription(t.errors.passwordTooShort)
    expect(fetchMock).toHaveBeenCalledTimes(1) // seulement /api/auth/me/
  })

  it('une connexion réussie ouvre la page demandée', async () => {
    let loggedIn = false
    mockApi({
      'GET /api/auth/me/': () => (loggedIn ? json(testUser) : notAuthenticated()),
      'POST /api/auth/login/': () => {
        loggedIn = true
        return json(testUser)
      },
    })
    const { router } = renderApp('/settings')

    await userEvent.type(await screen.findByLabelText(t.email), 'awa@example.com')
    await userEvent.type(screen.getByLabelText(t.password), 'Mot-de-passe-solide-1')
    await userEvent.click(screen.getByRole('button', { name: t.submitLogin }))

    expect(await screen.findByRole('heading', { level: 1, name: fr.pages.settings.title })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/settings')
  })

  it('ne stocke rien dans le localStorage', async () => {
    mockApi({
      'GET /api/auth/me/': notAuthenticated,
      'POST /api/auth/login/': () => json(testUser),
    })
    renderApp('/login')

    await userEvent.type(await screen.findByLabelText(t.email), 'awa@example.com')
    await userEvent.type(screen.getByLabelText(t.password), 'Mot-de-passe-solide-1')
    await userEvent.click(screen.getByRole('button', { name: t.submitLogin }))
    await screen.findByRole('heading', { level: 1, name: fr.pages.dashboard.title })

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
