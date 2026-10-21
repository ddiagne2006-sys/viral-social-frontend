import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { paths } from '../paths'
import { api, ApiError } from './client'
import { queryKeys } from './queryKeys'
import type { LoginInput, RegisterInput, User } from './types'

/** Utilisateur connecté, ou null sans session (401). */
async function fetchMe(): Promise<User | null> {
  try {
    return await api<User>('/auth/me/')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: fetchMe, staleTime: 5 * 60_000 })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api<User>('/auth/login/', { method: 'POST', json: input }),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) => api<User>('/auth/register/', { method: 'POST', json: input }),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout/', { method: 'POST' }),
    onSuccess: () => {
      navigate(paths.login, { replace: true })
      queryClient.clear()
      queryClient.setQueryData(queryKeys.me, null)
    },
  })
}
