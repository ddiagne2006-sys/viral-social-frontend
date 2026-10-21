import { fr } from '../i18n/fr'

const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Erreurs par champ des validations 400, à afficher sous chaque champ. */
export type FieldErrors = Record<string, string[]>

/** Erreur de l'API Django : { detail, code, fields? }. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail: string
  readonly fields: FieldErrors

  constructor(status: number, code: string, detail: string, fields: FieldErrors = {}) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.detail = detail
    this.fields = fields
  }

  /** Premier message d'erreur d'un champ, ou undefined. */
  fieldError(name: string): string | undefined {
    return this.fields[name]?.[0]
  }
}

export type ApiInit = Omit<RequestInit, 'body'> & {
  /** Corps sérialisé en JSON. */
  json?: unknown
  body?: BodyInit | null
}

function readCookie(name: string): string {
  const prefix = `${name}=`
  const part = document.cookie.split('; ').find((c) => c.startsWith(prefix))
  return part ? decodeURIComponent(part.slice(prefix.length)) : ''
}

let csrfReady: Promise<void> | null = null

/** Pose le cookie csrftoken via GET /api/auth/csrf/, une seule fois par session. */
function ensureCsrfCookie(): Promise<void> {
  csrfReady ??= fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' })
    .then((res) => {
      if (!res.ok) throw new Error(`csrf ${res.status}`)
    })
    .catch((error: unknown) => {
      csrfReady = null // on retentera à la prochaine écriture
      throw error
    })
  return csrfReady
}

/** Réservé aux tests : oublie que le cookie CSRF a déjà été demandé. */
export function resetCsrfForTests() {
  csrfReady = null
}

function toFieldErrors(value: unknown): FieldErrors {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: FieldErrors = {}
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) result[field] = messages.map(String)
    else if (typeof messages === 'string') result[field] = [messages]
  }
  return result
}

async function toApiError(res: Response): Promise<ApiError> {
  const body: unknown = await res.json().catch(() => null)
  if (body && typeof body === 'object') {
    const { detail, code, fields } = body as { detail?: unknown; code?: unknown; fields?: unknown }
    if (typeof detail === 'string' && typeof code === 'string') {
      return new ApiError(res.status, code, detail, toFieldErrors(fields))
    }
  }
  return new ApiError(res.status, 'ERROR', fr.errors.generic)
}

/** Télécharge un fichier (export) : le contenu et le nom proposé par le serveur. */
export async function apiDownload(path: string): Promise<{ blob: Blob; filename: string | null }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' })
    if (!res.ok) throw await toApiError(res)
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
    return { blob: await res.blob(), filename: match?.[1] ? decodeURIComponent(match[1]) : null }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'NETWORK_ERROR', fr.errors.network)
  }
}

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, ...rest } = init
  const method = (rest.method ?? 'GET').toUpperCase()
  const headers = new Headers(rest.headers)
  headers.set('Accept', 'application/json')

  let body = rest.body
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }

  try {
    if (!SAFE_METHODS.has(method)) {
      if (!readCookie('csrftoken')) await ensureCsrfCookie()
      headers.set('X-CSRFToken', readCookie('csrftoken'))
    }
    const res = await fetch(`${API_BASE}${path}`, { ...rest, method, headers, body, credentials: 'include' })
    if (!res.ok) throw await toApiError(res)
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'NETWORK_ERROR', fr.errors.network)
  }
}
