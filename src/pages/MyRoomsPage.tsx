import { Link, useNavigate } from 'react-router-dom'
import { useMyRooms } from '@/hooks/useRooms'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RoomRowSkeleton } from '@/components/ui/Skeleton'
import { Layout } from '@/components/layout/Layout'
import type { RoomStatus } from '@/types'

const statusLabels: Record<RoomStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  deleted: 'Eliminado',
}

const PLACEHOLDER = 'https://placehold.co/400x300/ede9fe/7c3aed?text=Sin+imagen'

export function MyRoomsPage() {
  const navigate = useNavigate()
  const { data: rooms, isLoading, isError } = useMyRooms()

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Mis habitaciones</h1>
          <Button variant="primary" size="sm" onClick={() => navigate('/rooms/new')}>
            + Publicar nueva
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => <RoomRowSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            No se pudieron cargar tus habitaciones.
          </div>
        )}

        {!isLoading && !isError && rooms?.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-slate-500">Aún no has publicado ninguna habitación.</p>
            <Link to="/rooms/new">
              <Button variant="primary">Publicar mi primera habitación</Button>
            </Link>
          </div>
        )}

        {rooms && rooms.length > 0 && (
          <div className="flex flex-col gap-4">
            {rooms.map((room) => {
              const images = (room as any).room_images ?? []
              const mainImage = images.find((i: any) => i.is_main)?.url ?? images[0]?.url ?? null

              return (
                <div key={room.id} className="flex gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img src={mainImage ?? PLACEHOLDER} alt={room.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={room.status}>{statusLabels[room.status]}</Badge>
                        <Badge variant={room.room_type === 'private' ? 'active' : 'review'}>
                          {room.room_type === 'private' ? 'Privada' : 'Compartida'}
                        </Badge>
                      </div>
                      <h2 className="mt-1 font-semibold text-slate-800 truncate">{room.title}</h2>
                      <p className="text-sm text-slate-500">{room.city}</p>
                    </div>
                    <p className="text-lg font-bold text-violet-600">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(room.price)}
                      <span className="text-sm font-normal text-slate-500">/mes</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link to={`/rooms/${room.id}`}>
                      <Button variant="secondary" size="sm" className="w-full">Ver</Button>
                    </Link>
                    <Link to={`/rooms/${room.id}/edit`}>
                      <Button variant="primary" size="sm" className="w-full">Editar</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
