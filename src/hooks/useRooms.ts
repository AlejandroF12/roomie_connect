import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { roomService } from '@/services/room.service'
import { imageService } from '@/services/image.service'
import { useSession } from '@/hooks/useAuth'
import type { CreateRoomInput, UpdateRoomInput } from '@/schemas/room.schema'
import type { RoomStatus } from '@/types'

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Obtiene los rooms del usuario autenticado.
 * La query se deshabilita si no hay sesión activa.
 */
export function useMyRooms() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['rooms', 'my', userId],
    queryFn: () => roomService.getMyRooms(userId!),
    enabled: !!userId,
  })
}

/**
 * Obtiene el detalle completo de un room por su ID.
 */
export function useRoomDetail(roomId: string) {
  return useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => roomService.getRoomById(roomId),
    enabled: !!roomId,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Crea un nuevo room para el usuario autenticado.
 * Invalida la lista de rooms propios en onSuccess.
 */
export function useCreateRoom() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateRoomInput) => {
      if (!userId) throw new Error('No hay sesión activa.')
      return roomService.createRoom(userId, params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my'] })
    },
  })
}

/**
 * Actualiza los datos de un room.
 * Invalida el detalle del room y la lista de rooms propios en onSuccess.
 */
export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, params }: { roomId: string; params: UpdateRoomInput }) =>
      roomService.updateRoom(roomId, params),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my'] })
    },
  })
}

/**
 * Cambia el status de un room (active, paused, deleted).
 * Invalida el detalle del room y la lista de rooms propios en onSuccess.
 */
export function useSetRoomStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: RoomStatus }) =>
      roomService.setRoomStatus(roomId, status),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my'] })
    },
  })
}

/**
 * Sube imágenes a un room.
 * Invalida el detalle del room en onSuccess.
 */
export function useUploadRoomImages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, files }: { roomId: string; files: File[] }) =>
      imageService.uploadRoomImages(roomId, files),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
    },
  })
}

/**
 * Elimina una imagen de un room.
 * Invalida el detalle del room en onSuccess.
 */
export function useDeleteRoomImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ imageId, roomId: _roomId }: { imageId: string; roomId: string }) =>
      imageService.deleteRoomImage(imageId),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
    },
  })
}

/**
 * Establece una imagen como principal del room.
 * Invalida el detalle del room en onSuccess.
 */
export function useSetMainImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, imageId }: { roomId: string; imageId: string }) =>
      imageService.setMainImage(roomId, imageId),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
    },
  })
}
