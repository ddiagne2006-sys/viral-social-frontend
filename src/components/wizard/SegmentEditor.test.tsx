import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Segment } from '../../api/types'
import { fr } from '../../i18n/fr'
import { SegmentEditor } from './SegmentEditor'

const segment: Segment = {
  id: '5e6e0000-0000-4000-8000-000000000001',
  position: 1,
  label: 'Accroche',
  start_second: 0,
  end_second: 5,
  text: 'Texte initial.',
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

function setup(onSave = vi.fn().mockResolvedValue(undefined)) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<SegmentEditor segment={segment} maxLength={600} onSave={onSave} onRewrite={vi.fn()} />)
  const textarea = screen.getByRole('textbox', { name: fr.wizard.script.segmentLabel('Accroche', '0–5 s') })
  return { user, textarea, onSave }
}

describe('SegmentEditor', () => {
  it('rg19 enregistre automatiquement 800 ms après la dernière frappe', async () => {
    const { user, textarea, onSave } = setup()

    await user.type(textarea, ' Suite')
    act(() => vi.advanceTimersByTime(700))
    expect(onSave).not.toHaveBeenCalled()

    await act(async () => vi.advanceTimersByTime(150))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('Texte initial. Suite')
    expect(await screen.findByText(fr.wizard.script.saved)).toBeInTheDocument()
  })

  it('chaque frappe repousse la sauvegarde (un seul envoi)', async () => {
    const { user, textarea, onSave } = setup()

    await user.type(textarea, 'a')
    act(() => vi.advanceTimersByTime(500))
    await user.type(textarea, 'b')
    act(() => vi.advanceTimersByTime(500))
    expect(onSave).not.toHaveBeenCalled()

    await act(async () => vi.advanceTimersByTime(400))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('Texte initial.ab')
  })

  it("rg7 n'enregistre pas un passage vide et l'indique sous le champ", async () => {
    const { user, textarea, onSave } = setup()

    await user.clear(textarea)
    await act(async () => vi.advanceTimersByTime(1000))

    expect(onSave).not.toHaveBeenCalled()
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(fr.wizard.script.empty)).toBeInTheDocument()
  })

  it("signale un échec d'enregistrement", async () => {
    const { user, textarea } = setup(vi.fn().mockRejectedValue(new Error('panne')))

    await user.type(textarea, '!')
    await act(async () => vi.advanceTimersByTime(900))

    expect(await screen.findByText(fr.wizard.script.saveFailed)).toBeInTheDocument()
  })
})
