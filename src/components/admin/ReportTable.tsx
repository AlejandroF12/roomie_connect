import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUpdateReport, useAdminDeleteRoom } from '@/hooks/useAdmin'
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

const ALL_STATUSES = 'all'

interface RowState {
  status: ReportStatus
  comment: string
}

export function ReportTable({ reports }: ReportTableProps) {
  const updateReport = useUpdateReport()
  const deleteRoom = useAdminDeleteRoom()

  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>(ALL_STATUSES)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      reports.map((r) => [r.id, { status: r.status, comment: r.admin_comment ?? '' }])
    )
  )

  const handleStatusChange = (id: string, status: ReportStatus) =>
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], status } }))

  const handleCommentChange = (id: string, comment: string) =>
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], comment } }))

  const handleSave = (id: string) => {
    const state = rowStates[id]
    if (!state) return
    updateReport.mutate({ reportId: id, params: { status: state.status, admin_comment: state.comment || undefined } })
  }

  const filtered = filterStatus === ALL_STATUSES
    ? reports
    : reports.filter((r) => r.status === filterStatus)

  if (!reports.length) {
    return <p className="py-8 text-center text-gray-500">No hay reportes para mostrar.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro por estado */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Filtrar:</span>
        {[{ value: ALL_STATUSES, label: 'Todos' }, ...statusOptions].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value as ReportStatus | 'all')}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filterStatus === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {opt.label}
            {opt.value !== ALL_STATUSES && (
              <span className="ml-1 opacity-70">
                ({reports.filter((r) => r.status === opt.value).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} reporte{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Motivo</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Ver</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 min-w-[220px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((report) => {
              const rowState = rowStates[report.id] ?? { status: report.status, comment: report.admin_comment ?? '' }
              const isSaving = updateReport.isPending && (updateReport.variables as any)?.reportId === report.id
              const isExpanded = expandedId === report.id

              return (
                <>
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    {/* Fecha */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3 text-gray-700 capitalize">
                      {report.target_type === 'room' ? 'Habitación' : 'Usuario'}
                    </td>

                    {/* Motivo */}
                    <td className="px-4 py-3 text-gray-700">
                      {reasonLabels[report.reason] ?? report.reason}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <Badge variant={report.status}>
                        {statusOptions.find((s) => s.value === report.status)?.label ?? report.status}
                      </Badge>
                    </td>

                    {/* Ver room */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {report.target_type === 'room' && (
                        <Link
                          to={`/rooms/${report.target_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Ver room
                        </Link>
                      )}
                    </td>

                    {/* Expand indicator */}
                    <td className="px-4 py-3">
                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </td>
                  </tr>

                  {/* Fila expandida con acciones */}
                  {isExpanded && (
                    <tr key={`${report.id}-expanded`} className="bg-indigo-50/40">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Cambiar estado</label>
                            <select
                              value={rowState.status}
                              onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-600">Comentario admin</label>
                            <input
                              type="text"
                              placeholder="Comentario (opcional)"
                              value={rowState.comment}
                              onChange={(e) => handleCommentChange(report.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <Button variant="primary" size="sm" isLoading={isSaving}
                            onClick={(e) => { e.stopPropagation(); handleSave(report.id) }}>
                            Guardar
                          </Button>

                          {report.target_type === 'room' && (
                            <Button variant="danger" size="sm"
                              isLoading={deleteRoom.isPending}
                              onClick={(e) => { e.stopPropagation(); deleteRoom.mutate(report.target_id) }}>
                              Eliminar room
                            </Button>
                          )}
                        </div>

                        {report.admin_comment && (
                          <p className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Comentario actual:</span> {report.admin_comment}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
