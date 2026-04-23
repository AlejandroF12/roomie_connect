import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'
import { useSession } from '@/hooks/useAuth'
import type { UpdateProfileInput } from '@/schemas/profile.schema'

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Obtiene el perfil de un usuario.
 * Si no se pasa userId, usa el userId de la sesión activa.
 * La query se deshabilita si no hay userId disponible.
 */
export function useProfile(userId?: string) {
  const { data: session } = useSession()
  const resolvedUserId = userId ?? session?.user?.id

  return useQuery({
    queryKey: ['profile', resolvedUserId],
    queryFn: () => profileService.getProfile(resolvedUserId!),
    enabled: !!resolvedUserId,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Actualiza el perfil del usuario autenticado.
 * Invalida la query del perfil en onSuccess.
 */
export function useUpdateProfile() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: UpdateProfileInput) => {
      if (!userId) throw new Error('No hay sesión activa.')
      return profileService.updateProfile(userId, params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })
}

/**
 * Sube un avatar para el usuario autenticado.
 * Invalida la query del perfil en onSuccess.
 */
export function useUploadAvatar() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => {
      if (!userId) throw new Error('No hay sesión activa.')
      return profileService.uploadAvatar(userId, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })
}

/**
 * Elimina la cuenta del usuario autenticado.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => profileService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
