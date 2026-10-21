// Vérifie qu'aucune information n8n ne fuit dans le bundle livré au navigateur (critère d'acceptation 7).
// 1. Parcourt dist/ (après `npm run build`) et échoue si une chaîne interdite y apparaît.
// 2. Vérifie que VITE_API_BASE est la seule variable VITE_* utilisée dans src/.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(root, 'dist')
const SRC = join(root, 'src')

const FORBIDDEN = [
  { label: 'N8N', pattern: /N8N/ },
  { label: 'N8N_SHARED_SECRET', pattern: /N8N_SHARED_SECRET/ },
  { label: 'X-Viral-Signature', pattern: /X-Viral-Signature/i },
  { label: '127.0.0.1:5678', pattern: /127\.0\.0\.1:5678/ },
  { label: 'localhost:5678', pattern: /localhost:5678/i },
  { label: 'webhook', pattern: /webhook/i },
]
const ALLOWED_VITE_VARIABLES = new Set(['VITE_API_BASE'])
const BINARY_EXTENSIONS = new Set(['.woff', '.woff2', '.ttf', '.eot', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'])

function* files(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else yield path
  }
}

function exists(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

const problems = []

if (!exists(DIST)) {
  console.error('dist/ introuvable : lancez d’abord `npm run build`.')
  process.exit(1)
}

let scanned = 0
for (const path of files(DIST)) {
  if (BINARY_EXTENSIONS.has(extname(path).toLowerCase())) continue
  const content = readFileSync(path, 'utf8')
  scanned += 1
  for (const { label, pattern } of FORBIDDEN) {
    const match = pattern.exec(content)
    if (match) {
      const start = Math.max(0, match.index - 40)
      const excerpt = content.slice(start, match.index + match[0].length + 40).replace(/\s+/g, ' ')
      problems.push(`dist/${relative(DIST, path)} contient « ${label} » : …${excerpt}…`)
    }
  }
}

const viteVariables = new Set()
for (const path of files(SRC)) {
  if (!/\.(ts|tsx|js|jsx|mjs)$/.test(path)) continue
  for (const match of readFileSync(path, 'utf8').matchAll(/\bVITE_[A-Z0-9_]+/g)) {
    viteVariables.add(match[0])
    if (!ALLOWED_VITE_VARIABLES.has(match[0])) {
      problems.push(`src/${relative(SRC, path)} utilise ${match[0]} : seule VITE_API_BASE est autorisée.`)
    }
  }
}

if (problems.length > 0) {
  console.error(`check:bundle : ${problems.length} problème(s)\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(
  `check:bundle : OK (${scanned} fichiers de dist/ analysés, aucune chaîne interdite ; ` +
    `variables VITE_* utilisées : ${[...viteVariables].sort().join(', ') || 'aucune'}).`,
)
