import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import { queryKeys } from './queryKeys'
import type { Profile, ProfileUpdate } from './types'

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: () => api<Profile>('/auth/profile/') })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (update: ProfileUpdate) => api<Profile>('/auth/profile/', { method: 'PATCH', json: update }),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile, profile)
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
  })
}
