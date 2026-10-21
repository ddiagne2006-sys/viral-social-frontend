import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'

import { resetCsrfForTests } from '../api/client'
import { createQueryClient } from '../api/queryClient'
import type { AppConfig, Project, ProjectStatus, User } from '../api/types'
import { ToastProvider } from '../components/toast/ToastProvider'
import { routes } from '../routes'

export const testUser: User = {
  id: '6f1c2f4e-0000-4000-8000-000000000001',
  email: 'awa@example.com',
  full_name: 'Awa Diallo',
  role: 'creator',
}

export const testAdmin: User = { ...testUser, id: '6f1c2f4e-0000-4000-8000-000000000002', role: 'admin' }

export const testConfig: AppConfig = {
  networks: [
    { value: 'tiktok', label: 'TikTok', ratio: '9:16' },
    { value: 'facebook', label: 'Facebook', ratio: '4:5' },
    { value: 'youtube', label: 'YouTube', ratio: '16:9' },
  ],
  durations: [15, 30, 60, 90],
  suggestions: ['Finance personnelle'],
  theme_min_length: 3,
  theme_max_length: 200,
  segment_max_length: 600,
}

const LABELS = ['Accroche', 'Contexte', 'Point clé', 'Preuve', 'Appel à l’action']
const BOUNDS = [0, 5, 12, 20, 26, 30]
const uuid = (prefix: string, n: number) => `${prefix}000000-0000-4000-8000-00000000000${n}`

/** Projet complet cohérent avec son statut : idées, segments et scènes présents selon l'étape atteinte. */
export function testProject(status: ProjectStatus, overrides: Partial<Project> = {}): Project {
  const order: ProjectStatus[] = ['draft', 'ideas_ready', 'idea_chosen', 'script_ready', 'scenes_ready']
  const level = order.indexOf(status)
  const ideas =
    level >= 1
      ? [1, 2, 3, 4, 5].map((n) => ({
          id: uuid('1dea', n),
          position: n,
          angle: n === 1 ? 'Révélation' : 'Liste',
          title: `Idée numéro ${n}`,
          hook: `Accroche de l’idée ${n}`,
          viral_score: 95 - n * 3,
          batch: 1,
          content_type: n === 2 ? 'analyse' : 'formation',
          platform_fit: `Format vertical pensé pour le réseau (idée ${n}).`,
          key_facts: [`Fait clé de l’idée ${n}`],
          sources:
            n === 2
              ? [
                  { title: 'Rapport OCDE 2024', url: 'https://www.oecd.org/rapport', date: '2024-03-15', kind: 'primaire' },
                  { title: 'Lien piégé', url: 'javascript:alert(1)', date: null, kind: null },
                ]
              : [],
          verification_level: n === 2 ? 'verifie' : 'non_verifie',
          risks: [`Risque de l’idée ${n}`],
          criteria_scores: {
            hook: 9,
            interest: 8,
            shareability: 7,
            platform_fit: 10,
            visual_feasibility: 9,
            originality: 7,
            freshness: null,
          },
          details: { objectif_apprentissage: `Objectif de l’idée ${n}`, points_cles: ['Premier point', 'Second point'] },
        }))
      : []
  const segments =
    level >= 3
      ? LABELS.map((label, i) => ({
          id: uuid('5e6e', i + 1),
          position: i + 1,
          label,
          start_second: BOUNDS[i]!,
          end_second: BOUNDS[i + 1]!,
          text: `Texte du passage ${i + 1}.`,
        }))
      : []
  const scenes =
    level >= 4
      ? segments.map((segment, i) => ({
          id: uuid('5cee', i + 1),
          segment_id: segment.id,
          position: i + 1,
          label: segment.label,
          start_second: segment.start_second,
          end_second: segment.end_second,
          voice_over: segment.text,
          shot: 'Gros plan',
          camera: 'Slow push-in, 50mm f/1.8',
          lighting: 'Contre-jour doré',
          mood: 'Intrigant',
          video_prompt: `Close-up shot ${i + 1}. Cinematic, 9:16 framing, 24fps, ${segment.start_second} to ${segment.end_second}s.`,
          variant: 0,
          is_stale: false,
          on_screen_text: '',
          transition: '',
          references: [],
        }))
      : []
  return {
    id: '0b1ec700-0000-4000-8000-000000000001',
    title: 'Finance personnelle',
    theme: 'Finance personnelle',
    duration_seconds: 30,
    network: 'tiktok',
    ratio: '9:16',
    status,
    created_at: '2026-10-07T09:00:00Z',
    updated_at: '2026-10-07T10:00:00Z',
    chosen_idea_id: level >= 2 ? ideas[0]!.id : null,
    ideas,
    scenes_context: {
      title: null,
      visual_style: null,
      visual_references: [],
      notes: [],
      warnings: [],
      safety_alerts: [],
      fiction_label: null,
    },
    script_context: {
      title: null,
      caption: level >= 3 ? 'Légende proposée par l’agent' : null,
      hashtags: level >= 3 ? ['#finance', '#epargne'] : [],
      facts_to_check: [],
      warnings: [],
      safety_alerts: [],
      fiction_label: null,
    },
    ideas_context: { interpreted_theme: level >= 1 ? 'Le sujet tel que compris par l’agent' : null, alerts: [], safety_alerts: [] },
    segments,
    scenes,
    word_count: level >= 3 ? 75 : 0,
    reading_seconds: level >= 3 ? 30 : 0,
    too_long: false,
    scenes_stale: false,
    agents: { ideas: null, script: null, scenes: null },
    ...overrides,
  }
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export const notAuthenticated = () => json({ detail: 'Vous devez être connecté.', code: 'NOT_AUTHENTICATED' }, 401)

export const apiError = (status: number, code: string, detail: string) => () => json({ detail, code }, status)

type Handler = (init: RequestInit) => Response | Promise<Response>

/**
 * Simule l'API : clés "METHODE /api/chemin/" (avec ou sans « ?query »). Toute requête non prévue
 * fait échouer le test. `bodies(key)` renvoie les corps JSON envoyés à une route.
 */
export function mockApi(handlers: Record<string, Handler>) {
  resetCsrfForTests()
  document.cookie = 'csrftoken=jeton-test; path=/'
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    const method = (init.method ?? 'GET').toUpperCase()
    const handler = handlers[`${method} ${url}`] ?? handlers[`${method} ${url.split('?')[0]}`]
    if (!handler) throw new Error(`Requête non prévue dans le test : ${method} ${url}`)
    return handler(init)
  })
  vi.stubGlobal('fetch', fetchMock)
  const bodies = (key: string) =>
    fetchMock.mock.calls
      .filter(([input, init]) => `${(init?.method ?? 'GET').toUpperCase()} ${String(input)}` === key)
      .map(([, init]) => (init?.body ? JSON.parse(String(init.body)) : undefined))
  return Object.assign(fetchMock, { bodies })
}

/** Monte l'application complète (routes réelles) à l'adresse donnée. */
export function renderApp(path: string) {
  const queryClient = createQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { router, queryClient }
}

/** Monte un composant isolé avec les fournisseurs (cache, toasts, routeur). */
export function renderWithProviders(ui: ReactNode) {
  const queryClient = createQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { queryClient }
}
