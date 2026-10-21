import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fr } from '../../i18n/fr'
import { renderWithProviders, testProject } from '../../test/utils'
import { COPY_FEEDBACK_MS } from '../CopyButton'
import { SceneCard } from './SceneCard'

const scene = testProject('scenes_ready').scenes[1]!
const writeText = vi.fn<(text: string) => Promise<void>>()
const execCommand = vi.fn<(command: string) => boolean>()

/** userEvent.setup() installe son propre presse-papiers : on le remplace ensuite par le nôtre. */
function setup({ clipboard = true }: { clipboard?: boolean } = {}) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  Object.defineProperty(navigator, 'clipboard', { value: clipboard ? { writeText } : undefined, configurable: true })
  renderWithProviders(<SceneCard scene={scene} ratio="9:16" onRegenerate={vi.fn()} />)
  return user
}

const promptButton = () => screen.getByRole('button', { name: fr.wizard.scenes.copyPrompt(2) })
const voiceOverButton = () => screen.getByRole('button', { name: fr.wizard.scenes.copyVoiceOverOf(2) })

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  writeText.mockReset().mockResolvedValue(undefined)
  execCommand.mockReset().mockReturnValue(true)
  Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SceneCard', () => {
  it('copie le prompt vidéo complet et affiche « Copié » pendant 2 secondes', async () => {
    const user = setup()

    await user.click(promptButton())

    expect(writeText).toHaveBeenCalledWith(scene.video_prompt)
    expect(execCommand).not.toHaveBeenCalled()
    const status = within(promptButton().parentElement!).getByRole('status')
    expect(status).toHaveTextContent(fr.common.copied)

    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS - 100))
    expect(status).toHaveTextContent(fr.common.copied)
    act(() => vi.advanceTimersByTime(100))
    expect(status).toBeEmptyDOMElement()
  })

  it('se replie sur execCommand quand l’API Clipboard refuse', async () => {
    writeText.mockRejectedValue(new Error('refusé'))
    const user = setup()

    await user.click(promptButton())

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(within(promptButton().parentElement!).getByRole('status')).toHaveTextContent(fr.common.copied)
    // La zone de texte temporaire est retirée
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('se replie sur execCommand quand l’API Clipboard est absente (contexte non sécurisé)', async () => {
    const user = setup({ clipboard: false })

    await user.click(promptButton())

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(within(promptButton().parentElement!).getByRole('status')).toHaveTextContent(fr.common.copied)
  })

  it('invite à sélectionner le texte quand les deux méthodes échouent', async () => {
    writeText.mockRejectedValue(new Error('refusé'))
    execCommand.mockReturnValue(false)
    const user = setup()

    await user.click(promptButton())

    const status = within(promptButton().parentElement!).getByRole('status')
    expect(status).toHaveTextContent(fr.common.copyFailedSelect)
    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS))
    expect(status).toBeEmptyDOMElement()
  })

  it('copie la voix-off de la scène avec le même retour', async () => {
    const user = setup()

    expect(voiceOverButton()).toHaveTextContent(fr.wizard.scenes.copyVoiceOver)
    await user.click(voiceOverButton())

    expect(writeText).toHaveBeenCalledWith(scene.voice_over)
    expect(within(voiceOverButton().parentElement!).getByRole('status')).toHaveTextContent(fr.common.copied)
    // Le retour ne s'affiche que sur le bouton cliqué
    expect(within(promptButton().parentElement!).getByRole('status')).toBeEmptyDOMElement()
  })

  it('laisse le prompt et la voix-off sélectionnables à la souris', () => {
    setup()

    for (const text of [scene.video_prompt, `« ${scene.voice_over} »`]) {
      const paragraph = screen.getByText((_, node) => node?.tagName === 'P' && node.textContent!.includes(text))
      expect(paragraph).toHaveClass('select-text')
      for (let node: HTMLElement | null = paragraph; node; node = node.parentElement) {
        expect(node).not.toHaveClass('select-none')
      }
    }
  })

  it('affiche voix-off, plan, lumière, ambiance et la vignette au ratio du réseau', () => {
    renderWithProviders(<SceneCard scene={scene} ratio="16:9" onRegenerate={vi.fn()} />)

    expect(screen.getByRole('heading', { name: scene.label })).toBeInTheDocument()
    expect(screen.getByText(`« ${scene.voice_over} »`)).toBeInTheDocument()
    expect(screen.getByText(`${scene.shot} — ${scene.camera}`)).toBeInTheDocument()
    expect(screen.getByText(scene.lighting)).toBeInTheDocument()
    expect(screen.getByText(fr.wizard.scenes.thumbnail)).toHaveStyle({ aspectRatio: '16 / 9' })
  })

  it('rg9 régénère cette scène seulement', async () => {
    const onRegenerate = vi.fn()
    renderWithProviders(<SceneCard scene={scene} ratio="9:16" onRegenerate={onRegenerate} />)

    await userEvent.click(screen.getByRole('button', { name: fr.wizard.scenes.regenerate }))

    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it("affiche le texte à l'écran, la transition et les fiches utilisées", () => {
    const rich = { ...scene, on_screen_text: 'Étape 2', transition: 'Fondu', references: ['PERSO_1', 'LIEU_1'] }
    renderWithProviders(<SceneCard scene={rich} ratio="9:16" onRegenerate={vi.fn()} />)

    expect(screen.getByText('Étape 2')).toBeInTheDocument()
    expect(screen.getByText('Fondu')).toBeInTheDocument()
    expect(screen.getByText('PERSO_1, LIEU_1')).toBeInTheDocument()
  })
})
