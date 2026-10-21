import { faChevronDown, faCircleCheck, faQuoteLeft } from '@fortawesome/free-solid-svg-icons'
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ReactNode, useId, useState } from 'react'

import type { CriteriaScores, Idea, IdeaSource } from '../../api/types'
import { fr } from '../../i18n/fr'

const t = fr.wizard.ideas

type IdeaCardProps = {
  idea: Idea
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}

/** Score sur 100 renvoyé par l'API, affiché sur 10 (« 8,5 »). */
function score10(viralScore: number) {
  return (viralScore / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

/** Libellé connu, sinon la valeur brute rendue lisible (« micro_fiction » → « Micro fiction »). */
function label(labels: Record<string, string>, value: string) {
  const known = labels[value]
  if (known) return known
  const text = value.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const VERIFICATION_TONE: Record<string, string> = {
  verifie: 'bg-success-bg text-success',
  partiellement_verifie: 'bg-warning-bg text-ink',
  non_verifie: 'bg-warning-bg text-ink',
}

function hasDetails(idea: Idea) {
  return Boolean(
    idea.platform_fit ||
      idea.key_facts.length ||
      idea.sources.length ||
      idea.risks.length ||
      idea.criteria_scores ||
      Object.keys(idea.details).length,
  )
}

/** Carte idée (F4, F5) : sélection unique (`aria-pressed`) et détails dépliables pour aider au choix. */
export function IdeaCard({ idea, selected, disabled = false, onSelect }: IdeaCardProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const score = idea.viral_score === null ? null : score10(idea.viral_score)

  return (
    <article
      className={`animate-fade-up overflow-hidden rounded-card border-2 shadow-card transition motion-reduce:transition-none ${
        selected ? 'border-primary bg-primary-tint' : 'border-transparent bg-white'
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={onSelect}
        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-soft disabled:cursor-wait sm:gap-4 sm:px-5"
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-field font-bold ${
            selected ? 'bg-primary text-white' : 'bg-primary-tint text-primary'
          }`}
          aria-hidden="true"
        >
          {idea.position}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1.5 flex flex-wrap gap-1.5">
            {idea.content_type && (
              <span className="rounded-md bg-accent-tint px-2.5 py-0.5 text-xs font-medium text-accent">
                {label(t.contentTypes, idea.content_type)}
              </span>
            )}
            {idea.verification_level && (
              <span
                className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${
                  VERIFICATION_TONE[idea.verification_level] ?? 'bg-surface-muted text-ink-soft'
                }`}
              >
                {label(t.verification, idea.verification_level)}
              </span>
            )}
          </span>
          <span className="block text-base font-bold break-words text-ink">{idea.title}</span>
          <span className="mt-1 block text-[13px] leading-relaxed break-words text-ink-soft">
            <FontAwesomeIcon icon={faQuoteLeft} className="mr-1 text-[11px] text-muted" aria-hidden />
            {idea.hook}
          </span>
          <span className="mt-2 block text-[13px] leading-relaxed break-words text-muted">
            <span className="font-medium text-ink-soft">{t.sections.angle} : </span>
            {idea.angle}
          </span>
        </span>
        {score !== null && (
          <span className="w-14 shrink-0 text-center" aria-label={t.score(score)}>
            <span className="block text-xl font-bold text-success" aria-hidden="true">
              {score}
            </span>
            <span className="block text-[11px] text-muted" aria-hidden="true">
              {t.outOf10}
            </span>
            <span className="my-1 block h-1 rounded-full bg-line" aria-hidden="true">
              <span className="block h-full rounded-full bg-success" style={{ width: `${idea.viral_score}%` }} />
            </span>
          </span>
        )}
        <FontAwesomeIcon
          icon={selected ? faCircleCheck : farCircle}
          className="mt-2 hidden text-[22px] text-primary sm:block"
          aria-hidden
        />
      </button>

      {hasDetails(idea) && (
        <>
          <div className="border-t border-line px-4 sm:px-5">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen(!open)}
              className="inline-flex min-h-touch items-center gap-2 text-[13px] font-medium text-primary"
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-xs transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
              {open ? t.hideDetails : t.details}
            </button>
          </div>
          <div id={panelId} hidden={!open} className="flex flex-col gap-4 px-4 pb-4 text-[13px] text-ink-soft sm:px-5">
            {open && <IdeaDetails idea={idea} />}
          </div>
        </>
      )}
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-bold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5">
      {items.map((item, index) => (
        <li key={index} className="break-words">
          {item}
        </li>
      ))}
    </ul>
  )
}

function IdeaDetails({ idea }: { idea: Idea }) {
  const details = Object.entries(idea.details)
  return (
    <>
      {idea.platform_fit && (
        <Section title={t.sections.platformFit}>
          <p className="break-words">{idea.platform_fit}</p>
        </Section>
      )}
      {idea.key_facts.length > 0 && (
        <Section title={t.sections.keyFacts}>
          <BulletList items={idea.key_facts} />
        </Section>
      )}
      {idea.sources.length > 0 && (
        <Section title={t.sections.sources}>
          <ul className="flex flex-col gap-1.5">
            {idea.sources.map((source, index) => (
              <SourceItem key={index} source={source} />
            ))}
          </ul>
        </Section>
      )}
      {details.length > 0 && (
        <Section title={t.sections.specifics}>
          <dl className="flex flex-col gap-2">
            {details.map(([key, value]) => (
              <div key={key}>
                <dt className="font-medium text-ink">{label(t.detailKeys, key)}</dt>
                <dd>
                  <DetailValue value={value} />
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      {idea.risks.length > 0 && (
        <Section title={t.sections.risks}>
          <div className="rounded-field bg-warning-bg px-3 py-2 text-ink">
            <BulletList items={idea.risks} />
          </div>
        </Section>
      )}
      {idea.criteria_scores && (
        <Section title={t.sections.criteria}>
          <Criteria scores={idea.criteria_scores} />
        </Section>
      )}
    </>
  )
}

function isHttpUrl(url: string | null): url is string {
  return Boolean(url && /^https?:\/\//i.test(url))
}

function SourceItem({ source }: { source: IdeaSource }) {
  const meta = [source.kind && label(t.sourceKinds, source.kind), source.date].filter(Boolean).join(' · ')
  const title = source.title || source.url || ''
  return (
    <li className="break-words">
      {isHttpUrl(source.url) ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium break-all text-primary underline-offset-2 hover:underline sm:break-words"
        >
          {title}
          <span className="sr-only"> {t.newTab}</span>
        </a>
      ) : (
        <span className="font-medium text-ink">{title}</span>
      )}
      {meta && <span className="block text-xs text-muted">{meta}</span>}
    </li>
  )
}

/** Rendu générique des détails propres au type de contenu : texte, liste ou sous-objet. */
function DetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return <span>{t.noScore}</span>
  if (Array.isArray(value)) return <BulletList items={value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))} />
  if (typeof value === 'object') {
    return (
      <dl className="mt-1 flex flex-col gap-1 border-l-2 border-line pl-3">
        {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
          <div key={key}>
            <dt className="inline font-medium text-ink">{label(t.detailKeys, key)} : </dt>
            <dd className="inline">
              {typeof item === 'object' && item !== null ? <DetailValue value={item} /> : String(item)}
            </dd>
          </div>
        ))}
      </dl>
    )
  }
  return <p className="break-words">{String(value)}</p>
}

function Criteria({ scores }: { scores: CriteriaScores }) {
  const entries = Object.entries(t.criteria) as [keyof CriteriaScores, string][]
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, name]) => {
        const value = scores[key]
        return (
          <li key={key} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="h-1.5 w-16 shrink-0 rounded-full bg-line" aria-hidden="true">
              {value !== null && (
                <span className="block h-full rounded-full bg-primary" style={{ width: `${value * 10}%` }} />
              )}
            </span>
            <span className="w-10 shrink-0 text-right font-medium text-ink tabular-nums">
              {value === null ? t.noScore : `${value.toLocaleString('fr-FR')}/10`}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
