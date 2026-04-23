import { supabase } from '@/lib/supabase'

export interface ContactInfo {
  phone: string | null
  bio: string | null
}

export const contactService = {
  /**
   * Obtiene la información de contacto pública de un propietario.
   */
  async getContactInfo(ownerId: string): Promise<ContactInfo> {
    const { data, error } = await supabase
      .from('users')
      .select('phone, bio')
      .eq('id', ownerId)
      .single()

    if (error) throw new Error('No se pudo obtener la información de contacto.')
    return { phone: data.phone ?? null, bio: data.bio ?? null }
  },

  /**
   * Genera un enlace de WhatsApp con el número del propietario y un mensaje predeterminado.
   * El número se limpia de espacios y caracteres no numéricos (excepto el +).
   */
  generateWhatsAppLink(phone: string, message = '¡Hola! Vi tu publicación en Roomie Connect y me interesa.'): string {
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  },
}
