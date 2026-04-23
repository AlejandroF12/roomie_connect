import { useFavorites } from '@/hooks/useFavorites'
import { RoomCard } from '@/components/rooms/RoomCard'
import { RoomCardSkeleton } from '@/components/ui/Skeleton'
import { Layout } from '@/components/layout/Layout'

export function FavoritesPage() {
  const { data: favorites, isLoading, isError } = useFavorites()

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Mis favoritos</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <RoomCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-slate-500">
            Error al cargar tus favoritos. Intenta de nuevo.
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((room) => <RoomCard key={room.id} room={room} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-lg font-medium text-slate-500">No tienes rooms guardados</p>
            <p className="mt-1 text-sm text-slate-400">Explora habitaciones y guarda las que te interesen</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
