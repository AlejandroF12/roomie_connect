import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/hooks/useAuth'
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites'
import { Badge } from '@/components/ui/Badge'
import type { RoomCard as RoomCardType } from '@/types'

interface RoomCardProps {
  room: RoomCardType
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/ede9fe/7c3aed?text=Sin+imagen'

export function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { data: isFavorite } = useIsFavorite(room.id)
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) { navigate('/login'); return }
    if (isFavorite) removeFavorite.mutate(room.id)
    else addFavorite.mutate(room.id)
  }

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(room.price)

  return (
    <Link
      to={`/rooms/${room.id}`}
      className="group block rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={room.main_image_url ?? PLACEHOLDER_IMAGE}
          alt={room.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <button
          onClick={handleFavoriteClick}
          disabled={addFavorite.isPending || removeFavorite.isPending}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors disabled:opacity-60"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <svg
            className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-400 text-red-400' : 'fill-none text-slate-400'}`}
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <div className="absolute bottom-2 left-2">
          <Badge variant="active">
            {room.room_type === 'private' ? 'Privada' : 'Compartida'}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-violet-600 transition-colors">
          {room.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {room.city}
        </p>
        <p className="mt-2 text-lg font-bold text-violet-600">
          {formattedPrice}
          <span className="text-sm font-normal text-slate-500">/mes</span>
        </p>
      </div>
    </Link>
  )
}
