import { faClapperboard, faLightbulb, faMicrophoneLines } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type FormEvent, useId, useState } from 'react'

import type { AppConfig, Duration, Network, ProjectCreate } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { cardClass, fieldClass } from '../../components/ui/styles'
import { DurationPicker, NetworkPicker } from '../../components/wizard/BriefPickers'
import { StepActions } from '../../components/wizard/StepActions'
import { fr } from '../../i18n/fr'

const t = fr.wizard.brief
const HOW_TO_ICONS = [faLightbulb, faMicrophoneLines, faClapperboard]

type BriefStepProps = {
  config: AppConfig
  /** Brief du projet, ou réglages du dernier projet pour une nouvelle vidéo (F3). */
  initial: Partial<ProjectCreate>
  busy: boolean
  onSubmit: (brief: ProjectCreate) => void
}

/** Étape 1 (F2, F3) : sujet, réseau, durée. La validation locale n'est qu'un confort (RG1 vérifiée par l'API). */
export function BriefStep({ config, initial, busy, onSubmit }: BriefStepProps) {
  const themeId = useId()
  const [theme, setTheme] = useState(initial.theme ?? '')
  const [network, setNetwork] = useState<Network>(initial.network ?? config.networks[0]?.value ?? 'tiktok')
  const [duration, setDuration] = useState<Duration>(
    initial.duration_seconds ?? (config.durations.includes(30) ? 30 : (config.durations[0] ?? 30)),
  )
  const [themeError, setThemeError] = useState<string>()

  const trimmed = theme.trim()

  function validate(value: string) {
    if (value.length < config.theme_min_length) return t.themeTooShort(config.theme_min_length)
    if (value.length > config.theme_max_length) return t.themeTooLong(config.theme_max_length)
    return undefined
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const error = validate(trimmed)
    setThemeError(error)
    if (error) {
      document.getElementById(themeId)?.focus()
      return
    }
    onSubmit({ theme: trimmed, network, duration_seconds: duration })
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className={`${cardClass} animate-fade-up flex flex-col gap-6 p-5 sm:p-6`}>
        <div>
          <h2 className="text-lg font-bold text-ink">{t.title}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{t.subtitle}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={themeId} className="font-medium text-ink-soft">
            {t.theme} <span aria-hidden="true">*</span>
          </label>
          <input
            id={themeId}
            value={theme}
            disabled={busy}
            maxLength={config.theme_max_length}
            placeholder={t.themePlaceholder}
            onChange={(event) => {
              setTheme(event.target.value)
              if (themeError) setThemeError(validate(event.target.value.trim()))
            }}
            aria-invalid={themeError ? true : undefined}
            aria-describedby={`${themeId}-hint${themeError ? ` ${themeId}-error` : ''}`}
            className={`${fieldClass} bg-surface-soft focus:bg-white aria-invalid:border-danger`}
          />
          <div className="flex items-start justify-between gap-3 text-xs">
            <span id={`${themeId}-error`} className="text-danger">
              {themeError}
            </span>
            <span id={`${themeId}-hint`} className="shrink-0 text-muted">
              {t.themeCount(theme.length, config.theme_max_length)}
            </span>
          </div>
          {config.suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{t.suggestions}</span>
              {config.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setTheme(suggestion)
                    setThemeError(undefined)
                  }}
                  className="min-h-touch rounded-full bg-primary-tint px-3 text-xs text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <NetworkPicker options={config.networks} value={network} onChange={setNetwork} disabled={busy} />
        <DurationPicker options={config.durations} value={duration} onChange={setDuration} disabled={busy} />

        <StepActions>
          <Button type="submit" variant="brand" icon={faLightbulb} loading={busy} className="lg:self-start">
            {t.submit}
          </Button>
        </StepActions>
      </div>

      <aside className="flex flex-col gap-5 rounded-card bg-primary-tint p-5 sm:p-6" aria-label={t.howTo}>
        <div className="flex flex-col gap-3.5">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">{t.howTo}</p>
          {t.howToSteps.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[13px] text-primary">
                <FontAwesomeIcon icon={HOW_TO_ICONS[index] ?? faLightbulb} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">{step.title}</p>
                <p className="text-xs leading-snug text-ink-soft">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </form>
  )
}
