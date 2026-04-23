import { useState } from 'react'
import { useUpdateReport } from '@/hooks/useAdmin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Report, ReportStatus } from '@/types'

interface ReportTableProps {
  reports: Report[]
}

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  inappropriate_content: 'Contenido inapropiado',
  fake_listing: 'Anuncio falso',
  harassment: 'Acoso',
  other: 'Otro',
}

const statusOptions: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'review', label: 'En revisión' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'rejected', label: 'Rechazado' },
]

interface RowState {
  status: ReportStatus
  comment: string
}

export function ReportTable({ reports }: ReportTableProps) {
  const updateReport = useUpdateReport()

  // Estado local por fila para edición
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      reports.map((r) => [r.id, { status: r.status, comment: r.admin_comment ?? '' }])
    )
  )

  const handleStatusChange = (reportId: string, status: ReportStatus) => {
    setRowStates((prev) => ({ ...prev, [reportId]: { ...prev[reportId], status } }))
  }

  const handleCommentChange = (reportId: string, comment: string) => {
    setRowStates((prev) => ({ ...prev, [reportId]: { ...prev[reportId], comment } }))
  }

  const handleSave = (reportId: string) => {
    const state = rowStates[reportId]
    if (!state) return
    updateReport.mutate({
      reportId,
      params: {
        status: state.status,
        admin_comment: state.comment || undefined,
      },
    })
  }

  if (!reports.length) {
    return (
      <p className="py-8 text-center text-gray-500">No hay reportes para mostrar.</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Motivo</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 min-w-[200px]">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {reports.map((report) => {
            const rowState = rowStates[report.id] ?? {
              status: report.status,
              comment: report.admin_comment ?? '',
            }
            const isSaving =
              updateReport.isPending &&
              (updateReport.variables as { reportId: string })?.reportId === report.id

            return (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                {/* Fecha */}
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(report.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>

                {/* Tipo */}
                <td className="px-4 py-3">
                  <span className="capitalize text-gray-700">
                    {report.target_type === 'room' ? 'Habitación' : 'Usuario'}
                  </span>
                </td>

                {/* Motivo */}
                <td className="px-4 py-3 text-gray-700">
                  {reasonLabels[report.reason] ?? report.reason}
                </td>

                {/* Estado actual */}
                <td className="px-4 py-3">
                  <Badge variant={report.status}>{
                    statusOptions.find((s) => s.value === report.status)?.label ?? report.status
                  }</Badge>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <select
                      value={rowState.status}
                      onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Comentario (opcional)"
                      value={rowState.comment}
                      onChange={(e) => handleCommentChange(report.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isSaving}
                      onClick={() => handleSave(report.id)}
                    >
                      Guardar
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
