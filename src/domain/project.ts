// Aides d'affichage uniquement : aucune règle métier ici (le serveur décide, le front affiche).
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faFacebook, faTiktok, faYoutube } from '@fortawesome/free-brands-svg-icons'

import type { Network, ProjectStatus, SafetyAlert } from '../api/types'
import { fr } from '../i18n/fr'

export type Step = 1 | 2 | 3 | 4
export const STEPS: Step[] = [1, 2, 3, 4]

/** Étape atteinte selon le statut renvoyé par l'API, seule source de vérité. */
export function stepFromStatus(status: ProjectStatus): Step {
  switch (status) {
    case 'draft':
      return 1
    case 'ideas_ready':
    case 'idea_chosen':
      return 2
    case 'script_ready':
      return 3
    case 'scenes_ready':
      return 4
  }
}

export const networkIcon: Record<Network, IconDefinition> = {
  tiktok: faTiktok,
  facebook: faFacebook,
  youtube: faYoutube,
}

export const networkColorClass: Record<Network, string> = {
  tiktok: 'text-brand-tiktok',
  facebook: 'text-brand-facebook',
  youtube: 'text-brand-youtube',
}

/** « 9:16 » -> « 9 / 16 » pour la propriété CSS aspect-ratio. */
export function cssAspectRatio(ratio: string) {
  const [width, height] = ratio.split(':')
  return width && height ? `${width} / ${height}` : '1 / 1'
}

export function orientationLabel(ratio: string) {
  const [width, height] = ratio.split(':').map(Number)
  if (!width || !height) return ''
  const value = width / height
  if (value === 1) return fr.wizard.orientation.square
  if (value > 1) return fr.wizard.orientation.horizontal
  return value < 0.7 ? fr.wizard.orientation.vertical : fr.wizard.orientation.portrait
}

export function formatRange(start: number, end: number) {
  return `${start}–${end} s`
}

/** 75 -> « 01:15 ». */
export function formatClock(seconds: number) {
  const whole = Math.floor(seconds)
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

/** 850 -> « 850 ms », 12400 -> « 12,4 s ». */
export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms} ms`
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(ms / 1000)} s`
}

/** 0.875 -> « 88 % ». */
export function formatRate(rate: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 }).format(rate)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function initials(name: string) {
  return (name.trim()[0] ?? '?').toUpperCase()
}

/** Alertes de sécurité à montrer au créateur : seulement la gravité « haute » (les autres restent enregistrées). */
export function visibleSafetyAlerts(alerts: SafetyAlert[]): SafetyAlert[] {
  return alerts.filter((alert) => alert.severity?.toLowerCase() === 'haute')
}
