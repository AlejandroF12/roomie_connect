import { supabase } from '@/lib/supabase'
import type { Report, ReportStatus } from '@/types'

export interface UpdateReportParams {
  status: ReportStatus
  admin_comment?: string
}

export const adminService = {
  /**
   * Obtiene todos los reportes ordenados por fecha de creación (más reciente primero).
   * Solo accesible para administradores (RLS lo garantiza).
   */
  async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error('No se pudieron obtener los reportes.')
    return data as Report[]
  },

  /**
   * Actualiza el estado de un reporte y opcionalmente agrega un comentario del admin.
   */
  async updateReport(reportId: string, params: UpdateReportParams): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .update(params)
      .eq('id', reportId)
      .select()
      .single()

    if (error) {
      if (error.code === '42501') {
        throw new Error('No tienes permiso para realizar esta acción.')
      }
      throw new Error('No se pudo actualizar el reporte.')
    }

    return data as Report
  },

  /**
   * Elimina un room de forma suave (status = 'deleted') desde el panel de admin.
   */
  async deleteRoom(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'deleted' })
      .eq('id', roomId)

    if (error) {
      if (error.code === '42501') {
        throw new Error('No tienes permiso para realizar esta acción.')
      }
      throw new Error('No se pudo eliminar el room.')
    }
  },
}
