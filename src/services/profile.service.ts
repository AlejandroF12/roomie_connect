import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'
import type { UpdateProfileInput } from '@/schemas/profile.schema'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export const profileService = {
  /**
   * Obtiene el perfil de un usuario por su ID.
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw new Error('No se pudo obtener el perfil del usuario.')
    if (!data) throw new Error('Perfil no encontrado. Es posible que tu cuenta no se haya configurado correctamente.')
    return data as UserProfile
  },

  /**
   * Actualiza los campos editables del perfil del usuario autenticado.
   */
  async updateProfile(userId: string, params: UpdateProfileInput): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update(params)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Este nombre de usuario no está disponible.')
      }
      throw new Error('No se pudo actualizar el perfil.')
    }

    return data as UserProfile
  },

  /**
   * Sube una imagen de avatar a Supabase Storage y actualiza avatar_url en el perfil.
   * Valida que el archivo no supere 2 MB.
   * Retorna la URL pública de la imagen.
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new Error('La imagen no puede superar 2 MB.')
    }

    const extension = file.name.split('.').pop()
    const filePath = `avatars/${userId}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw new Error('No se pudo subir la imagen de perfil.')

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    await profileService.updateProfile(userId, { avatar_url: avatarUrl } as UpdateProfileInput & { avatar_url: string })

    return avatarUrl
  },
}
