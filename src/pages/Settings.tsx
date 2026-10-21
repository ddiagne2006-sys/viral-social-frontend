import { faClockRotateLeft, faFloppyDisk, faRobot } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type FormEvent, useId, useState } from 'react'
import { Link } from 'react-router-dom'

import { useMe } from '../api/auth'
import { ApiError } from '../api/client'
import { useProfile, useUpdateProfile } from '../api/profile'
import type { ContentLanguage, Profile } from '../api/types'
import { TextField } from '../components/form/TextField'
import { PageHeader } from '../components/PageHeader'
import { LoadingState, QueryState } from '../components/StateViews'
import { useErrorToast } from '../components/toast/useErrorToast'
import { useToast } from '../components/toast/useToast'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Fields'
import { buttonClass, cardClass, fieldClass, sectionTitleClass } from '../components/ui/styles'
import { fr } from '../i18n/fr'
import { paths } from '../paths'

const t = fr.pages.settings
const BRAND_TONE_MAX = 500
const LANGUAGES = Object.keys(t.languages) as ContentLanguage[]

type FormValues = Pick<Profile, 'full_name' | 'content_language' | 'brand_tone'>

/** Paramètres (F16) : profil, langue du contenu généré (français par défaut), ton de marque. */
export function Settings() {
  const { data: user } = useMe()
  const profile = useProfile()

  // Le formulaire n'apparaît qu'avec le profil chargé : jamais de valeurs par défaut écrasant le profil réel
  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {profile.isPending ? (
        <LoadingState label={t.loading} />
      ) : (
        <QueryState query={profile}>
          {({ email, full_name, content_language, brand_tone }) => (
            <SettingsForm email={email} initial={{ full_name, content_language, brand_tone }} />
          )}
        </QueryState>
      )}
      {user?.role === 'admin' && (
        <section className={`${cardClass} mt-5 flex flex-col gap-3 p-5 sm:p-6`} aria-labelledby="settings-admin">
          <h2 id="settings-admin" className={sectionTitleClass}>
            {t.admin}
          </h2>
          <p className="text-muted">{t.adminHint}</p>
          <div className="flex flex-wrap gap-2">
            <Link to={paths.adminAgents} className={buttonClass('outline')}>
              <FontAwesomeIcon icon={faRobot} aria-hidden />
              {fr.nav.adminAgents}
            </Link>
            <Link to={paths.adminRuns} className={buttonClass('outline')}>
              <FontAwesomeIcon icon={faClockRotateLeft} aria-hidden />
              {fr.nav.adminRuns}
            </Link>
          </div>
        </section>
      )}
    </>
  )
}

function SettingsForm({ email, initial }: { email: string; initial: FormValues }) {
  const toneId = useId()
  const update = useUpdateProfile()
  const toast = useToast()
  const showError = useErrorToast()
  const [values, setValues] = useState<FormValues>(initial)
  const [nameError, setNameError] = useState<string>()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const fullName = values.full_name.trim()
    if (!fullName) {
      setNameError(t.fullNameRequired)
      return
    }
    update.mutate(
      { ...values, full_name: fullName },
      {
        onSuccess: () => toast.show({ message: t.saved }),
        onError: (error) => {
          const field = error instanceof ApiError ? error.fieldError('full_name') : undefined
          if (field) setNameError(field)
          showError(error)
        },
      },
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <section className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`} aria-labelledby="settings-profile">
        <h2 id="settings-profile" className={sectionTitleClass}>
          {t.profile}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label={t.fullName}
            autoComplete="name"
            value={values.full_name}
            onChange={(event) => {
              setValues({ ...values, full_name: event.target.value })
              setNameError(undefined)
            }}
            error={nameError}
          />
          <div className="flex flex-col gap-1.5">
            <TextField label={t.email} type="email" value={email} readOnly className="bg-surface-soft text-ink-soft" />
            <p className="text-xs text-muted">{t.emailHint}</p>
          </div>
        </div>
      </section>

      <section className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`} aria-labelledby="settings-content">
        <h2 id="settings-content" className={sectionTitleClass}>
          {t.content}
        </h2>
        <Select
          label={t.language}
          className="md:max-w-xs"
          value={values.content_language}
          onChange={(event) => setValues({ ...values, content_language: event.target.value as ContentLanguage })}
          options={LANGUAGES.map((language) => ({ value: language, label: t.languages[language] }))}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={toneId} className="font-medium text-ink-soft">
            {t.brandTone}
          </label>
          <textarea
            id={toneId}
            rows={3}
            maxLength={BRAND_TONE_MAX}
            placeholder={t.brandTonePlaceholder}
            value={values.brand_tone}
            onChange={(event) => setValues({ ...values, brand_tone: event.target.value })}
            className={`${fieldClass} py-2.5`}
          />
          <p className="text-right text-xs text-muted">
            {values.brand_tone.length} / {BRAND_TONE_MAX}
          </p>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" icon={faFloppyDisk} loading={update.isPending}>
          {update.isPending ? t.saving : t.save}
        </Button>
      </div>
    </form>
  )
}
