import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fr } from '../i18n/fr'
import { api, ApiError, resetCsrfForTests } from './client'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function clearCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  resetCsrfForTests()
  clearCookie('csrftoken')
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function requestAt(index: number) {
  const call = fetchMock.mock.calls[index]
  if (!call) throw new Error(`pas d'appel fetch n°${index}`)
  const [url, init] = call
  return { url: String(url), init: init ?? {}, headers: new Headers(init?.headers) }
}

describe('api()', () => {
  it('pose le cookie CSRF puis envoie X-CSRFToken sur un POST, avec credentials include', async () => {
    fetchMock
      .mockImplementationOnce(async () => {
        document.cookie = 'csrftoken=jeton-123; path=/' // ce que fait Django sur /api/auth/csrf/
        return new Response(null, { status: 204 })
      })
      .mockResolvedValueOnce(jsonResponse({ id: 'p1' }, 201))

    const result = await api<{ id: string }>('/projects/', { method: 'POST', json: { theme: 'Finance' } })

    expect(result).toEqual({ id: 'p1' })
    expect(requestAt(0).url).toBe('/api/auth/csrf/')
    const post = requestAt(1)
    expect(post.url).toBe('/api/projects/')
    expect(post.init.method).toBe('POST')
    expect(post.init.credentials).toBe('include')
    expect(post.headers.get('X-CSRFToken')).toBe('jeton-123')
    expect(post.headers.get('Content-Type')).toBe('application/json')
    expect(post.init.body).toBe(JSON.stringify({ theme: 'Finance' }))
  })

  it("n'appelle /api/auth/csrf/ qu'une seule fois", async () => {
    fetchMock
      .mockImplementationOnce(async () => {
        document.cookie = 'csrftoken=jeton-123; path=/'
        return new Response(null, { status: 204 })
      })
      .mockResolvedValue(new Response(null, { status: 204 }))

    await api('/a/', { method: 'POST' })
    await api('/b/', { method: 'PATCH' })
    await api('/c/', { method: 'DELETE' })

    const csrfCalls = fetchMock.mock.calls.filter(([url]) => String(url) === '/api/auth/csrf/')
    expect(csrfCalls).toHaveLength(1)
  })

  it("n'envoie pas X-CSRFToken sur un GET", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ok' }))

    await api('/health/')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(requestAt(0).headers.has('X-CSRFToken')).toBe(false)
    expect(requestAt(0).init.credentials).toBe('include')
  })

  it('transforme une réponse { detail, code } en ApiError', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ detail: 'Une génération est déjà en cours pour cette étape.', code: 'RUN_ALREADY_ACTIVE' }, 409),
    )

    const error = await api('/projects/p1/ideas/').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 409,
      code: 'RUN_ALREADY_ACTIVE',
      detail: 'Une génération est déjà en cours pour cette étape.',
      message: 'Une génération est déjà en cours pour cette étape.',
    })
  })

  it('garde les erreurs par champ des validations 400', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          detail: 'Les données envoyées sont invalides.',
          code: 'VALIDATION_ERROR',
          fields: { theme: ['Le sujet doit faire au moins 3 caractères.'] },
        },
        400,
      ),
    )

    const error = (await api('/projects/').catch((e: unknown) => e)) as ApiError

    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.fieldError('theme')).toBe('Le sujet doit faire au moins 3 caractères.')
    expect(error.fieldError('duration')).toBeUndefined()
  })

  it('renvoie une ApiError générique si la réponse ne suit pas le format', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Bad gateway</html>', { status: 502 }))

    const error = await api('/projects/').catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 502, code: 'ERROR', detail: fr.errors.generic })
  })

  it('renvoie NETWORK_ERROR quand le serveur est injoignable', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const error = await api('/projects/').catch((e: unknown) => e)

    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR', detail: fr.errors.network })
  })
})
