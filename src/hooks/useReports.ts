import { useMutation } from '@tanstack/react-query'
import { reportService } from '@/services/report.service'
import { useSession } from '@/hooks/useAuth'
import type { CreateReportInput } from '@/schemas/report.schema'

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Crea un reporte de un room o usuario.
 * Requiere sesión activa; lanza error si no hay usuario autenticado.
 */
export function useCreateReport() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useMutation({
    mutationFn: (params: CreateReportInput) => {
      if (!userId) throw new Error('No hay sesión activa.')
      return reportService.createReport(userId, params)
    },
  })
}
