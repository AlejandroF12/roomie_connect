import { useAdminReports } from '@/hooks/useAdmin'
import { ReportTable } from '@/components/admin/ReportTable'
import { Spinner } from '@/components/ui/Spinner'
import { Layout } from '@/components/layout/Layout'

export function AdminPage() {
  const { data: reports, isLoading, isError } = useAdminReports()

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los reportes de contenido de la plataforma
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-gray-500">
            Error al cargar los reportes. Intenta de nuevo.
          </div>
        ) : (
          <ReportTable reports={reports ?? []} />
        )}
      </div>
    </Layout>
  )
}
