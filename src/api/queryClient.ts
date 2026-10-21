import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from './client'
import { queryKeys } from './queryKeys'

export function createQueryClient() {
  // Une réponse 401 en cours de session : on oublie les données et l'utilisateur.
  // RequireAuth voit alors me === null et ramène à /login.
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.me[0] })
      client.setQueryData(queryKeys.me, null)
    }
  }

  const client = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Inutile de réessayer une erreur client (400 à 499) : la réponse ne changera pas
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
      mutations: {
        // Les appels d'agent ne sont jamais rejoués automatiquement (RG13, quotas)
        retry: false,
      },
    },
  })
  return client
}
