import { supabase } from '@/lib/supabase'
import type { Report } from '@/types'
import type { CreateReportInput } from '@/schemas/report.schema'

export const reportService = {
  async createReport(_reporterId: string, params: CreateReportInput): Promise<Report> {
    const { target_type, target_id, reason } = params

    // Llamar a la función RPC que corre con security definer
    // Esto bypasea RLS y usa auth.uid() internamente
    const { data, error } = await supabase.rpc('create_report', {
      p_target_type: target_type,
      p_target_id: target_id,
      p_reason: reason,
    })

    if (error) {
      if (error.message.includes('propio contenido')) {
        throw new Error('No puedes reportar tu propio contenido.')
      }
      if (error.message.includes('sesión')) {
        throw new Error('No hay sesión activa. Por favor inicia sesión de nuevo.')
      }
      throw new Error('No se pudo enviar el reporte.')
    }

    // La RPC retorna el UUID del reporte creado
    return { id: data, target_type, target_id, reason, status: 'pending' } as unknown as Report
  },
}
