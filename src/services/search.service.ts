import { supabase } from '@/lib/supabase'
import type { RoomCard, RoomType } from '@/types'

export interface SearchParams {
  query?: string
  city?: string
  room_type?: RoomType
  min_price?: number
  max_price?: number
  sort?: 'price_asc' | 'recent'
}

export const searchService = {
  /**
   * Busca rooms activos aplicando filtros conjuntivos y ordenamiento.
   * Retorna objetos RoomCard con los campos necesarios para las tarjetas.
   */
  async searchRooms(params: SearchParams = {}): Promise<RoomCard[]> {
    const { query, city, room_type, min_price, max_price, sort = 'recent' } = params

    let dbQuery = supabase
      .from('rooms')
      .select(`
        id,
        title,
        price,
        city,
        room_type,
        created_at,
        room_images!inner (url, is_main)
      `)
      .eq('status', 'active')

    // Búsqueda de texto case-insensitive en title y description
    if (query && query.trim()) {
      dbQuery = dbQuery.or(`title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`)
    }

    // Filtros conjuntivos
    if (city && city.trim()) {
      dbQuery = dbQuery.ilike('city', `%${city.trim()}%`)
    }
    if (room_type) {
      dbQuery = dbQuery.eq('room_type', room_type)
    }
    if (min_price !== undefined) {
      dbQuery = dbQuery.gte('price', min_price)
    }
    if (max_price !== undefined) {
      dbQuery = dbQuery.lte('price', max_price)
    }

    // Ordenamiento
    if (sort === 'price_asc') {
      dbQuery = dbQuery.order('price', { ascending: true })
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false })
    }

    const { data, error } = await dbQuery

    if (error) throw new Error('No se pudieron obtener los rooms.')

    // Mapear a RoomCard extrayendo la imagen principal
    return (data ?? []).map((room: Record<string, unknown>) => {
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
}
