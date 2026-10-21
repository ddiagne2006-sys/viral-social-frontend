import { faCircleNotch, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useLogin, useMe, useRegister } from '../api/auth'
import { ApiError } from '../api/client'
import { TextField } from '../components/form/TextField'
import { Logo } from '../components/Logo'
import { LoadingState } from '../components/StateViews'
import { fr } from '../i18n/fr'
import { paths } from '../paths'

type Mode = 'login' | 'register'
type Field = 'full_name' | 'email' | 'password'
type Values = Record<Field, string>
type FieldErrors = Partial<Record<Field, string>>

const FIELDS: Field[] = ['full_name', 'email', 'password']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8 // MinimumLengthValidator de Django
const t = fr.pages.login
const SUBMIT_LABELS: Record<Mode, { idle: string; pending: string }> = {
  login: { idle: t.submitLogin, pending: t.submittingLogin },
  register: { idle: t.submitRegister, pending: t.submittingRegister },
}

/** Validation locale, pour le confort seulement : le serveur reste juge. */
function validate(mode: Mode, values: Values): FieldErrors {
  const errors: FieldErrors = {}
  if (mode === 'register' && !values.full_name.trim()) errors.full_name = t.errors.fullNameRequired
  if (!values.email.trim()) errors.email = t.errors.emailRequired
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = t.errors.emailInvalid
  if (!values.password) errors.password = t.errors.passwordRequired
  else if (mode === 'register' && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = t.errors.passwordTooShort
  }
  return errors
}

/** Répartit une ApiError : erreurs `fields` sous chaque champ, le reste en message général. */
function splitApiError(error: unknown): { fieldErrors: FieldErrors; formError?: string } {
  if (!(error instanceof ApiError)) return { fieldErrors: {}, formError: fr.errors.generic }
  const fieldErrors: FieldErrors = {}
  const others: string[] = []
  for (const [name, messages] of Object.entries(error.fields)) {
    if ((FIELDS as string[]).includes(name)) fieldErrors[name as Field] = messages[0]
    else others.push(...messages)
  }
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  return { fieldErrors, formError: others.length ? others.join(' ') : hasFieldErrors ? undefined : error.detail }
}

export function Login() {
  const me = useMe()
  const location = useLocation()
  const login = useLogin()
  const register = useRegister()

  const [mode, setMode] = useState<Mode>('login')
  const [values, setValues] = useState<Values>({ full_name: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>()

  const mutation = mode === 'login' ? login : register
  const from = (location.state as { from?: string } | null)?.from ?? paths.dashboard

  if (me.data) return <Navigate to={from} replace />

  function switchMode(next: Mode) {
    setMode(next)
    setFieldErrors({})
    setFormError(undefined)
    login.reset()
    register.reset()
  }

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending) return
    setFormError(undefined)

    const errors = validate(mode, values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const onError = (error: unknown) => {
      const split = splitApiError(error)
      setFieldErrors(split.fieldErrors)
      setFormError(split.formError)
    }
    const email = values.email.trim()
    if (mode === 'login') login.mutate({ email, password: values.password }, { onError })
    else register.mutate({ email, password: values.password, full_name: values.full_name.trim() }, { onError })
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <Logo />
        </div>

        {me.isPending ? (
          <LoadingState />
        ) : (
          <>
            <h1 className="text-title text-ink">{mode === 'login' ? t.title : t.registerTitle}</h1>
            <p className="mt-2 text-muted">{mode === 'login' ? t.subtitle : t.registerSubtitle}</p>

            <div role="group" aria-label={t.modeLabel} className="mt-6 grid grid-cols-2 gap-1 rounded-field bg-primary-tint p-1">
              {(['login', 'register'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => switchMode(value)}
                  className={`min-h-touch rounded-field font-medium ${
                    mode === value ? 'bg-white text-primary shadow-sm' : 'text-ink-soft hover:bg-nav-hover'
                  }`}
                >
                  {value === 'login' ? t.modeLogin : t.modeRegister}
                </button>
              ))}
            </div>

            <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" aria-busy={mutation.isPending}>
              {formError && (
                <div role="alert" className="flex items-start gap-2 rounded-field bg-danger-bg px-3 py-2.5 text-danger">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" aria-hidden />
                  <p className="min-w-0 break-words">{formError}</p>
                </div>
              )}

              {mode === 'register' && (
                <TextField
                  label={t.fullName}
                  name="full_name"
                  autoComplete="name"
                  value={values.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  error={fieldErrors.full_name}
                />
              )}
              <TextField
                label={t.email}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => update('email', e.target.value)}
                error={fieldErrors.email}
              />
              <TextField
                label={t.password}
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={values.password}
                onChange={(e) => update('password', e.target.value)}
                error={fieldErrors.password}
                placeholder={mode === 'register' ? t.passwordHint : undefined}
              />

              <button
                type="submit"
                disabled={mutation.isPending}
                className="mt-2 inline-flex min-h-touch items-center justify-center gap-2 rounded-field bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-70"
              >
                {mutation.isPending && <FontAwesomeIcon icon={faCircleNotch} spin aria-hidden />}
                {SUBMIT_LABELS[mode][mutation.isPending ? 'pending' : 'idle']}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
