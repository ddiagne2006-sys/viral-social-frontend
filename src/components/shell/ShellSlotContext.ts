import { createContext } from 'react'

/**
 * Emplacement en bas de la barre latérale (desktop) où une page peut afficher un panneau
 * avec createPortal, par exemple le panneau « Agents IA » de l'assistant.
 */
export const ShellSlotContext = createContext<HTMLElement | null>(null)
