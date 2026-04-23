import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import type { UpdateReportParams } from '@/services/admin.service'

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Obtiene todos los reportes del panel de administración.
 * Solo accesible para usuarios con rol 'admin' (RLS lo garantiza en Supabase).
 */
export function useAdminReports() {
  return useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminService.getReports(),
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Actualiza el estado y/o comentario de un reporte.
 * Invalida la lista de reportes en onSuccess.
 */
export function useUpdateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportId, params }: { reportId: string; params: UpdateReportParams }) =>
      adminService.updateReport(reportId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
    },
  })
}

/**
 * Elimina (soft delete) un room desde el panel de administración.
 * Invalida las queries de rooms y admin en onSuccess.
 */
export function useAdminDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roomId: string) => adminService.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
