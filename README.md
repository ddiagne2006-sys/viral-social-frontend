# Viral Social — front

Application React + TypeScript + Vite + Tailwind de Viral Social. Elle ne parle qu'à l'API Django
(dépôt `viral-social-backend`) et n'appelle jamais n8n.

## Démarrer

Le dépôt backend doit être cloné à côté de celui-ci (`../backend`) : le proxy de développement et la génération des
types de l'API s'en servent.

```powershell
npm ci
copy .env.example .env
npm run dev            # http://localhost:5173, proxy /api vers http://localhost:8000 (backend lancé à part)
```

## Vérifications

```powershell
npm run api:types      # types TypeScript générés depuis ../backend/openapi.yaml
npm run lint
npm run build
npm run check:bundle   # aucune information n8n dans le bundle
npx vitest run
```

La CI (`.github/workflows/ci.yml`) récupère `openapi.yaml` du dépôt backend avec le secret `BACKEND_REPO_TOKEN`
(jeton GitHub en lecture seule limité au dépôt backend) et échoue si `src/api/schema.d.ts` n'est pas à jour.

## Configuration

`VITE_API_BASE` est la seule variable (par défaut `/api`, même domaine que le site). Aucune URL n8n ni aucun secret
ne doit jamais atteindre le bundle.
