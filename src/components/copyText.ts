/**
 * Copie un texte dans le presse-papiers : API Clipboard d'abord, puis repli par zone de texte
 * temporaire et `execCommand('copy')` (API absente hors contexte sécurisé, ou refusée par le navigateur).
 * Renvoie `false` si les deux méthodes échouent.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // On tente le repli
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  // Hors écran visible, sans défilement ni zoom iOS
  Object.assign(area.style, { position: 'fixed', top: '0', left: '0', opacity: '0', fontSize: '16px' })

  const selection = document.getSelection()
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null

  document.body.appendChild(area)
  area.select()
  area.setSelectionRange(0, text.length)
  try {
    return typeof document.execCommand === 'function' && document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
    previousFocus?.focus()
    if (selection && previousRange) {
      selection.removeAllRanges()
      selection.addRange(previousRange)
    }
  }
}
