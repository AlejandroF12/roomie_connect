import { supabase } from '@/lib/supabase'
import type { RoomCard, RoomType } from '@/types'

export const favoritesService = {
  /**
   * Guarda un room en favoritos. Si ya existe, lo ignora silenciosamente.
   */
  async addFavorite(userId: string, roomId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .upsert({ user_id: userId, room_id: roomId }, { onConflict: 'user_id,room_id' })

    if (error) throw new Error('No se pudo guardar el room en favoritos.')
  },

  /**
   * Elimina un room de favoritos.
   */
  async removeFavorite(userId: string, roomId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('room_id', roomId)

    if (error) throw new Error('No se pudo quitar el room de favoritos.')
  },

  /**
   * Obtiene la lista de rooms guardados por el usuario.
   * Solo retorna rooms con status 'active' o 'paused' (no los eliminados).
   */
  async getFavorites(userId: string): Promise<RoomCard[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        room_id,
        rooms!inner (
          id,
          title,
          price,
          city,
          room_type,
          status,
          created_at,
          room_images (url, is_main)
        )
      `)
      .eq('user_id', userId)
      .in('rooms.status', ['active', 'paused'])

    if (error) throw new Error('No se pudieron obtener los favoritos.')

    return (data ?? []).map((fav: Record<string, unknown>) => {
      const room = fav.rooms as Record<string, unknown>
      const images = (room.room_images as Array<{ url: string; is_main: boolean }>) ?? []
      const mainImage = images.find((img) => img.is_main) ?? images[0] ?? null

      return {
        id: room.id as string,
        title: room.title as string,
        price: room.price as number,
        city: room.city as string,
        room_type: room.room_type as RoomType,
        main_image_url: mainImage ? mainImage.url : null,
        created_at: room.created_at as string,
      } satisfies RoomCard
    })
  },

  /**
   * Verifica si un room está en los favoritos del usuario.
   */
  async isFavorite(userId: string, roomId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('room_id', roomId)

    if (error) return false
    return (count ?? 0) > 0
  },
}
