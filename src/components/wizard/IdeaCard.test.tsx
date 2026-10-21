import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { fr } from '../../i18n/fr'
import { renderWithProviders, testProject } from '../../test/utils'
import { IdeaCard } from './IdeaCard'

const t = fr.wizard.ideas
const idea = testProject('ideas_ready').ideas[1]! // idée 2 : analyse, vérifiée, avec sources

describe('IdeaCard', () => {
  it("affiche l'essentiel : type, vérification, titre, accroche, angle et score sur 10", () => {
    renderWithProviders(<IdeaCard idea={idea} selected={false} onSelect={vi.fn()} />)

    const select = screen.getByRole('button', { name: /Idée numéro 2/ })
    expect(select).toHaveAttribute('aria-pressed', 'false')
    expect(within(select).getByText('Analyse')).toBeInTheDocument()
    expect(within(select).getByText(t.verification.verifie!)).toBeInTheDocument()
    expect(within(select).getByText(idea.hook)).toBeInTheDocument()
    expect(within(select).getByText(idea.angle)).toBeInTheDocument()
    // viral_score 89 sur 100 → 8,9 sur 10
    expect(within(select).getByLabelText(t.score('8,9'))).toBeInTheDocument()
  })

  it('la sélection appelle onSelect', async () => {
    const onSelect = vi.fn()
    renderWithProviders(<IdeaCard idea={idea} selected onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: /Idée numéro 2/ }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: /Idée numéro 2/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('déplie les détails : faits, sources, détails propres, risques et notes', async () => {
    renderWithProviders(<IdeaCard idea={idea} selected={false} onSelect={vi.fn()} />)
    const toggle = screen.getByRole('button', { name: t.details })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(idea.key_facts[0]!)).not.toBeInTheDocument()

    await userEvent.click(toggle)

    expect(screen.getByRole('button', { name: t.hideDetails })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(idea.platform_fit)).toBeInTheDocument()
    expect(screen.getByText(idea.key_facts[0]!)).toBeInTheDocument()
    expect(screen.getByText(idea.risks[0]!)).toBeInTheDocument()
    expect(screen.getByText(fr.wizard.ideas.detailKeys.objectif_apprentissage!)).toBeInTheDocument()
    expect(screen.getByText('Second point')).toBeInTheDocument()
    expect(screen.getByText('10/10')).toBeInTheDocument() // adéquation à la plateforme
    expect(screen.getByText(t.noScore)).toBeInTheDocument() // fraîcheur non évaluée
    expect(screen.getByText(/source primaire · 2024-03-15/)).toBeInTheDocument()
  })

  it("n'affiche un lien que pour une source http(s), ouverte dans un nouvel onglet", async () => {
    renderWithProviders(<IdeaCard idea={idea} selected={false} onSelect={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: t.details }))

    const link = screen.getByRole('link', { name: /Rapport OCDE 2024/ })
    expect(link).toHaveAttribute('href', 'https://www.oecd.org/rapport')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow')
    expect(screen.getByText('Lien piégé').closest('a')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it("n'affiche pas de score quand l'agent n'en donne pas", () => {
    renderWithProviders(<IdeaCard idea={{ ...idea, viral_score: null }} selected={false} onSelect={vi.fn()} />)

    expect(screen.queryByText(t.outOf10)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Idée numéro 2/ })).toBeInTheDocument()
  })

  it("le bouton Détails reste utilisable pendant l'envoi d'un choix", () => {
    renderWithProviders(<IdeaCard idea={idea} selected={false} disabled onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Idée numéro 2/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: t.details })).toBeEnabled()
  })
})
