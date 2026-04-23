import { supabase } from '@/lib/supabase'
import type { Room, RoomWithDetails, RoomStatus } from '@/types'
import type { CreateRoomInput, UpdateRoomInput } from '@/schemas/room.schema'

export const roomService = {
  /**
   * Crea un nuevo room con status 'active' y asigna el owner_id.
   */
  async createRoom(ownerId: string, params: CreateRoomInput): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        ...params,
        owner_id: ownerId,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw new Error('No se pudo crear el room.')
    return data as Room
  },

  /**
   * Actualiza los campos de un room propio.
   * RLS garantiza que solo el propietario puede actualizar.
   */
  async updateRoom(roomId: string, params: UpdateRoomInput): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .update(params)
      .eq('id', roomId)
      .select()
      .single()

    if (error) {
      if (error.code === '42501') {
        throw new Error('No tienes permiso para realizar esta acción.')
      }
      throw new Error('No se pudo actualizar el room.')
    }

    return data as Room
  },

  /**
   * Cambia el status de un room (active, paused, deleted).
   * RLS garantiza que solo el propietario puede cambiar el status.
   */
  async setRoomStatus(roomId: string, status: RoomStatus): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single()

    if (error) {
      if (error.code === '42501') {
        throw new Error('No tienes permiso para realizar esta acción.')
      }
      throw new Error('No se pudo actualizar el estado del room.')
    }

    return data as Room
  },

  /**
   * Obtiene el detalle completo de un room con sus imágenes y datos del propietario.
   */
  async getRoomById(roomId: string): Promise<RoomWithDetails> {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_images (*),
        owner:users!owner_id (id, username, avatar_url, bio, phone, instagram, facebook, twitter)
      `)
      .eq('id', roomId)
      .single()

    if (error) throw new Error('No se pudo obtener el room.')
    return data as RoomWithDetails
  },

  /**
   * Obtiene todos los rooms del usuario autenticado (todos los status), incluyendo imágenes.
   */
  async getMyRooms(ownerId: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, room_images(*)')
      .eq('owner_id', ownerId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })

    if (error) throw new Error('No se pudieron obtener tus rooms.')
    return data as Room[]
  },
}
