import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Profile } from '../api/types'
import { fr } from '../i18n/fr'
import { apiError, json, mockApi, renderApp, testUser } from '../test/utils'

// Page chargée à la demande par le routeur : préchargée pour ne pas fausser les délais
beforeAll(() => import('./Settings'))

const t = fr.pages.settings
const patience = { timeout: 3000 }
const profile: Profile = {
  id: testUser.id,
  email: testUser.email,
  full_name: 'Awa Diallo Ndiaye',
  content_language: 'en',
  brand_tone: 'Direct et chaleureux',
}

describe('Paramètres', () => {
  it('affiche un chargement annoncé, sans formulaire, tant que le profil n’est pas arrivé', async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testUser),
      'GET /api/auth/profile/': () => new Promise<Response>(() => {}),
    })
    renderApp('/settings')

    const loading = (await screen.findByText(t.loading, {}, patience)).parentElement!
    expect(loading).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByRole('textbox', { name: t.fullName })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.save })).not.toBeInTheDocument()
  })

  it('affiche l’erreur avec Réessayer, puis le formulaire une fois le profil chargé', async () => {
    let calls = 0
    mockApi({
      'GET /api/auth/me/': () => json(testUser),
      'GET /api/auth/profile/': () =>
        ++calls === 1 ? apiError(404, 'NOT_FOUND', 'Profil introuvable.')() : json(profile),
    })
    renderApp('/settings')

    expect(await screen.findByRole('alert', {}, patience)).toHaveTextContent('Profil introuvable.')
    expect(screen.queryByRole('textbox', { name: t.fullName })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: fr.states.retry }))

    expect(await screen.findByRole('textbox', { name: t.fullName })).toHaveValue(profile.full_name)
    expect(calls).toBe(2)
  })

  it('pré-remplit le formulaire avec le profil chargé', async () => {
    mockApi({
      'GET /api/auth/me/': () => json(testUser),
      'GET /api/auth/profile/': () => json(profile),
    })
    renderApp('/settings')

    expect(await screen.findByRole('textbox', { name: t.fullName }, patience)).toHaveValue(profile.full_name)
    expect(screen.getByRole('combobox', { name: t.language })).toHaveValue('en')
    expect(screen.getByRole('textbox', { name: t.brandTone })).toHaveValue(profile.brand_tone)
    expect(screen.queryByText(t.loading)).not.toBeInTheDocument()
  })
})
