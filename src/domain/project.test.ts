import { describe, expect, it } from 'vitest'

import { visibleSafetyAlerts } from './project'

describe('visibleSafetyAlerts', () => {
  it('ne garde que la gravité « haute », quelle que soit la casse', () => {
    const alerts = [
      { severity: 'faible', description: 'Rien à signaler.' },
      { severity: 'moyenne', description: 'À surveiller.' },
      { severity: 'Haute', description: 'Contenu dangereux.' },
      { severity: null, description: 'Sans gravité.' },
    ]

    expect(visibleSafetyAlerts(alerts)).toEqual([{ severity: 'Haute', description: 'Contenu dangereux.' }])
  })
})
