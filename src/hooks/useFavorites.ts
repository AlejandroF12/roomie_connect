import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesService } from '@/services/favorites.service'
import { useSession } from '@/hooks/useAuth'

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Obtiene la lista de rooms favoritos del usuario autenticado.
 * La query se deshabilita si no hay sesión activa.
 */
export function useFavorites() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => favoritesService.getFavorites(userId!),
    enabled: !!userId,
  })
}

/**
 * Verifica si un room está en los favoritos del usuario autenticado.
 * La query se deshabilita si no hay sesión activa o no se pasa roomId.
 */
export function useIsFavorite(roomId: string) {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['favorites', 'check', userId, roomId],
    queryFn: () => favoritesService.isFavorite(userId!, roomId),
    enabled: !!userId && !!roomId,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Agrega un room a los favoritos del usuario autenticado.
 * Invalida las queries de favoritos en onSuccess.
 */
export function useAddFavorite() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roomId: string) => {
      if (!userId) throw new Error('No hay sesión activa.')
      return favoritesService.addFavorite(userId, roomId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

/**
 * Elimina un room de los favoritos del usuario autenticado.
 * Invalida las queries de favoritos en onSuccess.
 */
export function useRemoveFavorite() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roomId: string) => {
      if (!userId) throw new Error('No hay sesión activa.')
      return favoritesService.removeFavorite(userId, roomId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
