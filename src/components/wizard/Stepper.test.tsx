import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { fr } from '../../i18n/fr'
import { Stepper } from './Stepper'

const stepButton = (step: 1 | 2 | 3 | 4, done = false) =>
  screen.getByRole('button', { name: `${step}. ${fr.wizard.steps[step]}${done ? `, ${fr.wizard.stepDone}` : ''}` })

describe('Stepper', () => {
  it("marque l'étape courante avec aria-current", () => {
    render(<Stepper current={2} reached={2} onSelect={vi.fn()} />)

    expect(stepButton(2)).toHaveAttribute('aria-current', 'step')
    expect(stepButton(1, true)).not.toHaveAttribute('aria-current')
    expect(stepButton(3)).not.toHaveAttribute('aria-current')
  })

  it("rend une étape future non cliquable (au-delà du statut du projet)", async () => {
    const onSelect = vi.fn()
    render(<Stepper current={2} reached={2} onSelect={onSelect} />)

    expect(stepButton(3)).toBeDisabled()
    expect(stepButton(4)).toBeDisabled()
    await userEvent.click(stepButton(3))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('permet de revenir à une étape validée, et de revenir vers une étape déjà atteinte', async () => {
    const onSelect = vi.fn()
    render(<Stepper current={2} reached={4} onSelect={onSelect} />)

    await userEvent.click(stepButton(1, true))
    await userEvent.click(stepButton(3, true))

    expect(onSelect).toHaveBeenNthCalledWith(1, 1)
    expect(onSelect).toHaveBeenNthCalledWith(2, 3)
  })

  it("bloque la navigation pendant un appel d'agent", () => {
    render(<Stepper current={3} reached={3} onSelect={vi.fn()} disabled />)

    expect(stepButton(1, true)).toBeDisabled()
  })
})
