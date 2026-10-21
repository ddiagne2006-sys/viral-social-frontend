/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Seule variable publique du front (/api par défaut). */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
