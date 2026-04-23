import { supabase } from '@/lib/supabase'
import type { RoomImage } from '@/types'

const MAX_IMAGES_PER_ROOM = 10

export const imageService = {
  /**
   * Sube múltiples imágenes a un room.
   * Valida que el total de imágenes (existentes + nuevas) no supere 10.
   * Si ninguna imagen tiene is_main = true, la primera subida se marca como principal.
   */
  async uploadRoomImages(roomId: string, files: File[]): Promise<RoomImage[]> {
    // Contar imágenes existentes
    const { count, error: countError } = await supabase
      .from('room_images')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)

    if (countError) throw new Error('No se pudo verificar el límite de imágenes.')

    const existing = count ?? 0
    if (existing + files.length > MAX_IMAGES_PER_ROOM) {
      throw new Error(`Solo se permiten hasta ${MAX_IMAGES_PER_ROOM} imágenes por room.`)
    }

    // Verificar si ya hay una imagen principal
    const { data: existingImages } = await supabase
      .from('room_images')
      .select('is_main')
      .eq('room_id', roomId)

    const hasMain = existingImages?.some((img) => img.is_main) ?? false

    const uploaded: RoomImage[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const extension = file.name.split('.').pop()
      const filePath = `rooms/${roomId}/${Date.now()}-${i}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(filePath, file)

      if (uploadError) throw new Error(`No se pudo subir la imagen ${file.name}.`)

      const { data: urlData } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath)

      // La primera imagen subida es principal si no hay ninguna aún
      const isMain = !hasMain && i === 0

      const { data: imageRecord, error: insertError } = await supabase
        .from('room_images')
        .insert({
          room_id: roomId,
          url: urlData.publicUrl,
          is_main: isMain,
          display_order: existing + i,
        })
        .select()
        .single()

      if (insertError) throw new Error('No se pudo registrar la imagen.')
      uploaded.push(imageRecord as RoomImage)
    }

    return uploaded
  },

  /**
   * Establece una imagen como principal del room.
   * Actualiza is_main = false en todas las demás imágenes del mismo room.
   */
  async setMainImage(roomId: string, imageId: string): Promise<void> {
    // Quitar is_main de todas las imágenes del room
    const { error: resetError } = await supabase
      .from('room_images')
      .update({ is_main: false })
      .eq('room_id', roomId)

    if (resetError) throw new Error('No se pudo actualizar la imagen principal.')

    // Marcar la imagen seleccionada como principal
    const { error: setError } = await supabase
      .from('room_images')
      .update({ is_main: true })
      .eq('id', imageId)

    if (setError) throw new Error('No se pudo establecer la imagen principal.')
  },

  /**
   * Elimina una imagen del room: borra el registro y el archivo en Storage.
   */
  async deleteRoomImage(imageId: string): Promise<void> {
    // Obtener la URL para extraer el path en Storage
    const { data: image, error: fetchError } = await supabase
      .from('room_images')
      .select('url, room_id')
      .eq('id', imageId)
      .single()

    if (fetchError || !image) throw new Error('No se encontró la imagen.')

    // Extraer el path relativo del Storage desde la URL pública
    const url = new URL(image.url)
    const pathParts = url.pathname.split('/room-images/')
    const storagePath = pathParts[1] ?? ''

    // Eliminar archivo de Storage
    if (storagePath) {
      await supabase.storage.from('room-images').remove([storagePath])
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase
      .from('room_images')
      .delete()
      .eq('id', imageId)

    if (deleteError) throw new Error('No se pudo eliminar la imagen.')
  },

  /**
   * Obtiene todas las imágenes de un room ordenadas por display_order.
   */
  async getRoomImages(roomId: string): Promise<RoomImage[]> {
    const { data, error } = await supabase
      .from('room_images')
      .select('*')
      .eq('room_id', roomId)
      .order('display_order', { ascending: true })

    if (error) throw new Error('No se pudieron obtener las imágenes.')
    return data as RoomImage[]
  },
}
