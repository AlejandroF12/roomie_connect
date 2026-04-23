import { lazy, Suspense, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRoomDetail } from '@/hooks/useRooms'
import { useSession } from '@/hooks/useAuth'
import { useCreateReport } from '@/hooks/useReports'
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites'
import { contactService } from '@/services/contact.service'
import { createReportSchema, type CreateReportInput } from '@/schemas/report.schema'
import { RoomImageGallery } from '@/components/rooms/RoomImageGallery'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { Layout } from '@/components/layout/Layout'
import type { RoomStatus } from '@/types'

// Lazy-load the map to avoid SSR issues with Leaflet
const RoomMap = lazy(() =>
  import('@/components/rooms/RoomMap').then((m) => ({ default: m.RoomMap }))
)

const statusLabels: Record<RoomStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  deleted: 'Eliminado',
}

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  inappropriate_content: 'Contenido inapropiado',
  fake_listing: 'Anuncio falso',
  harassment: 'Acoso',
  other: 'Otro',
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { data: room, isLoading, isError } = useRoomDetail(id ?? '')
  const createReport = useCreateReport()
  const { data: isFavorite } = useIsFavorite(id ?? '')
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleFavoriteClick = () => {
    if (!session) { navigate('/login'); return }
    if (isFavorite) removeFavorite.mutate(id ?? '')
    else addFavorite.mutate(id ?? '')
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: { target_type: 'room', target_id: id ?? '' },
  })

  const isOwner = session?.user?.id === room?.owner_id

  const handleCopyPhone = () => {
    if (room?.owner?.phone) {
      navigator.clipboard.writeText(room.owner.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReport = (data: CreateReportInput) => {
    createReport.mutate(data, {
      onSuccess: () => {
        setReportSuccess(true)
        reset()
        setTimeout(() => { setShowReportModal(false); setReportSuccess(false) }, 2000)
      },
    })
  }

  if (isLoading) return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>
    </Layout>
  )

  if (isError || !room) return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">No se pudo cargar la habitación.</p>
      </div>
    </Layout>
  )

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(room.price)

  const owner = room.owner as typeof room.owner & {
    instagram?: string | null
    facebook?: string | null
    twitter?: string | null
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Galería con lightbox */}
            <RoomImageGallery roomId={room.id} images={room.room_images} editable={false} />

            {/* Info del room */}
            <div>
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <Badge variant={room.status}>{statusLabels[room.status]}</Badge>
                <Badge variant={room.room_type === 'private' ? 'active' : 'review'}>
                  {room.room_type === 'private' ? 'Privada' : 'Compartida'}
                </Badge>
                {!room.available && <Badge variant="paused">No disponible</Badge>}
              </div>

              <h1 className="text-2xl font-bold text-gray-900">{room.title}</h1>

              <p className="mt-1 text-gray-500 flex items-center gap-1">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {room.city}{room.zone ? `, ${room.zone}` : ''}
              </p>

              <p className="mt-3 text-3xl font-bold text-indigo-600">
                {formattedPrice}
                <span className="text-base font-normal text-gray-500">/mes</span>
              </p>

              <div className="mt-4 prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{room.description}</p>
              </div>
            </div>

            {/* Mapa (solo si hay coordenadas) */}
            {room.latitude && room.longitude && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Ubicación
                </h2>
                <Suspense fallback={<div className="h-64 rounded-xl bg-gray-100 animate-pulse" />}>
                  <RoomMap
                    latitude={room.latitude}
                    longitude={room.longitude}
                    title={room.title}
                    city={room.city}
                  />
                </Suspense>
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="flex flex-col gap-4">
            {/* Botón favorito (solo para no-propietarios) */}
            {!isOwner && (
              <button
                onClick={handleFavoriteClick}
                disabled={addFavorite.isPending || removeFavorite.isPending}
                className={[
                  'flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                  isFavorite
                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                <svg
                  className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400'}`}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isFavorite ? 'Guardado en favoritos' : 'Guardar en favoritos'}
              </button>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Propietario
              </h2>

              {/* Avatar + nombre */}
              <div className="flex items-center gap-3 mb-4">
                {owner.avatar_url ? (
                  <img src={owner.avatar_url} alt={owner.username ?? 'Avatar'}
                    className="h-12 w-12 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-lg font-bold">
                    {owner.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{owner.username ?? 'Usuario'}</p>
                  {owner.bio && <p className="text-xs text-gray-500 line-clamp-2">{owner.bio}</p>}
                </div>
              </div>

              {/* Redes sociales como iconos */}
              {(owner.instagram || owner.facebook || owner.twitter) && (
                <div className="flex items-center gap-3 mb-4">
                  {owner.instagram && (
                    <a href={`https://instagram.com/${owner.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600 transition-colors"
                      aria-label={`Instagram de ${owner.username}`}>
                      <InstagramIcon />
                    </a>
                  )}
                  {owner.facebook && (
                    <a href={`https://facebook.com/${owner.facebook}`} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      aria-label={`Facebook de ${owner.username}`}>
                      <FacebookIcon />
                    </a>
                  )}
                  {owner.twitter && (
                    <a href={`https://x.com/${owner.twitter}`} target="_blank" rel="noopener noreferrer"
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                      aria-label={`X de ${owner.username}`}>
                      <TwitterIcon />
                    </a>
                  )}
                </div>
              )}

              {isOwner ? (
                <Link to={`/rooms/${room.id}/edit`}
                  className="block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                  Editar habitación
                </Link>
              ) : (
                <>
                  {owner.phone ? (
                    <div className="flex flex-col gap-2">
                      <a href={contactService.generateWhatsAppLink(owner.phone)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Contactar por WhatsApp
                      </a>
                      <Button variant="secondary" size="sm" onClick={handleCopyPhone} className="w-full">
                        {copied ? '¡Copiado!' : 'Copiar número'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      El propietario no ha proporcionado información de contacto.
                    </p>
                  )}

                  {session && (
                    <button onClick={() => setShowReportModal(true)}
                      className="mt-3 w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-center">
                      Reportar anuncio
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de reporte */}
      <Modal isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportSuccess(false); reset() }}
        title="Reportar anuncio">
        {reportSuccess ? (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            Reporte enviado. Lo revisaremos pronto.
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleReport)} noValidate className="flex flex-col gap-4">
            {createReport.isError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
                {createReport.error?.message ?? 'Error al enviar el reporte.'}
              </div>
            )}
            <input type="hidden" {...register('target_type')} />
            <input type="hidden" {...register('target_id')} />
            <div className="flex flex-col gap-1">
              <label htmlFor="reason" className="text-sm font-medium text-gray-700">Motivo del reporte</label>
              <select id="reason"
                className={['rounded-md border px-3 py-2 text-sm shadow-sm bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                  errors.reason ? 'border-red-500' : 'border-gray-300'].join(' ')}
                {...register('reason')}>
                <option value="">Selecciona un motivo</option>
                {Object.entries(reasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.reason && <p className="text-xs text-red-600">{errors.reason.message}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowReportModal(false)} type="button">Cancelar</Button>
              <Button type="submit" variant="danger" isLoading={createReport.isPending}>Enviar reporte</Button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  )
}
