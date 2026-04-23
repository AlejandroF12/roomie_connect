import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchService, type SearchParams } from '@/services/search.service'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Layout } from '@/components/layout/Layout'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function HomePage() {
  const [searchText, setSearchText] = useState('')
  const [city, setCity] = useState('')
  const [roomType, setRoomType] = useState<'private' | 'shared' | ''>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<'recent' | 'price_asc'>('recent')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debouncedSearch = useDebounce(searchText, 300)

  const params: SearchParams = {
    query: debouncedSearch || undefined,
    city: city || undefined,
    room_type: roomType || undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    sort,
  }

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ['rooms', 'search', params],
    queryFn: () => searchService.searchRooms(params),
  })

  const handleClearFilters = useCallback(() => {
    setCity('')
    setRoomType('')
    setMinPrice('')
    setMaxPrice('')
    setSort('recent')
  }, [])

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero / Búsqueda */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Encuentra tu habitación ideal
          </h1>
          <p className="mt-2 text-gray-500">
            Explora habitaciones disponibles y conecta con propietarios
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Buscar por título o descripción..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </Button>
        </div>

        {/* Panel de filtros colapsable */}
        {filtersOpen && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Ciudad"
                type="text"
                placeholder="Madrid"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <div className="flex flex-col gap-1">
                <label htmlFor="room_type_filter" className="text-sm font-medium text-gray-700">
                  Tipo de habitación
                </label>
                <select
                  id="room_type_filter"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as 'private' | 'shared' | '')}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todas</option>
                  <option value="private">Privada</option>
                  <option value="shared">Compartida</option>
                </select>
              </div>

              <Input
                label="Precio mínimo (€)"
                type="number"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />

              <Input
                label="Precio máximo (€)"
                type="number"
                min={0}
                placeholder="2000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Ordenamiento */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {rooms ? `${rooms.length} resultado${rooms.length !== 1 ? 's' : ''}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600">
              Ordenar por:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'recent' | 'price_asc')}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Más reciente</option>
              <option value="price_asc">Menor precio</option>
            </select>
          </div>
        </div>

        {/* Resultados */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-gray-500">
            Error al cargar los rooms. Intenta de nuevo.
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-lg font-medium text-gray-500">No se encontraron rooms</p>
            <p className="mt-1 text-sm text-gray-400">
              Prueba con otros filtros o términos de búsqueda
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
