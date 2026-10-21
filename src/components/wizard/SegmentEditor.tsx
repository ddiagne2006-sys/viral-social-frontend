import { faCircleCheck, faTriangleExclamation, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useId, useRef, useState } from 'react'

import type { Segment } from '../../api/types'
import { formatRange } from '../../domain/project'
import { fr } from '../../i18n/fr'
import { IconButton } from '../ui/Button'

/** RG19 : enregistrement automatique après 800 ms sans frappe. */
const AUTOSAVE_DELAY_MS = 800

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type SegmentEditorProps = {
  segment: Segment
  maxLength: number
  onSave: (text: string) => Promise<unknown>
  onRewrite: () => void
  rewriting?: boolean
  disabled?: boolean
}

/** Éditeur d'un passage du script (F7) : auto-sauvegarde, compteur, réécriture par l'agent 2. */
export function SegmentEditor({
  segment,
  maxLength,
  onSave,
  onRewrite,
  rewriting = false,
  disabled = false,
}: SegmentEditorProps) {
  const id = useId()
  const [text, setText] = useState(segment.text)
  // Dernier texte connu côté serveur : reçu dans le projet, ou enregistré avec succès
  const [savedText, setSavedText] = useState(segment.text)
  const [serverText, setServerText] = useState(segment.text)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    onSaveRef.current = onSave
  })

  const isEmpty = text.trim() === ''
  const isDirty = text !== savedText

  // Nouveau texte venu du serveur (réécriture par l'agent) : on l'affiche si rien n'est en cours de frappe
  if (segment.text !== serverText) {
    setServerText(segment.text)
    if (!isDirty) {
      setText(segment.text)
      setSavedText(segment.text)
    }
  }

  useEffect(() => {
    if (!isDirty || isEmpty) return
    const timer = setTimeout(() => {
      setSaveState('saving')
      onSaveRef.current(text).then(
        () => {
          setSavedText(text)
          setSaveState('saved')
        },
        () => setSaveState('error'),
      )
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [text, isDirty, isEmpty])

  const range = formatRange(segment.start_second, segment.end_second)
  const statusId = `${id}-status`
  const errorId = `${id}-error`

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-t border-surface-muted py-4 md:grid-cols-[92px_minmax(0,1fr)_auto] md:gap-x-5">
      <div className="md:pt-2">
        <p className="text-xs font-bold text-primary">{range}</p>
        <p className="text-xs text-muted">{segment.label}</p>
      </div>
      <div className="row-start-2 col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
        <label htmlFor={id} className="sr-only">
          {fr.wizard.script.segmentLabel(segment.label, range)}
        </label>
        <textarea
          id={id}
          value={text}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(event) => {
            setText(event.target.value)
            setSaveState('idle')
          }}
          rows={2}
          aria-invalid={isEmpty || undefined}
          aria-describedby={isEmpty ? `${errorId} ${statusId}` : statusId}
          className="min-h-[52px] w-full resize-none rounded-field border border-transparent bg-transparent px-2.5 py-2 text-[15px] leading-relaxed text-ink transition [field-sizing:content] hover:bg-surface-soft focus:border-primary focus:bg-white aria-invalid:border-danger"
        />
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-2.5 text-xs">
          <span id={statusId} aria-live="polite" className="min-h-4">
            {isEmpty ? (
              <span id={errorId} className="text-danger">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1" aria-hidden />
                {fr.wizard.script.empty}
              </span>
            ) : saveState === 'saving' ? (
              <span className="text-muted">{fr.wizard.script.saving}</span>
            ) : saveState === 'saved' && !isDirty ? (
              <span className="text-success">
                <FontAwesomeIcon icon={faCircleCheck} className="mr-1" aria-hidden />
                {fr.wizard.script.saved}
              </span>
            ) : saveState === 'error' ? (
              <span className="text-danger">{fr.wizard.script.saveFailed}</span>
            ) : null}
          </span>
          <span className={text.length > maxLength - 50 ? 'text-warning' : 'text-muted'}>
            {fr.wizard.script.count(text.length, maxLength)}
          </span>
        </div>
      </div>
      <IconButton
        icon={faWandMagicSparkles}
        label={fr.wizard.script.rewrite}
        onClick={onRewrite}
        loading={rewriting}
        disabled={disabled || isDirty || saveState === 'saving'}
        className="row-start-1 col-start-2 md:col-start-3"
      />
    </div>
  )
}
