import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchService, type SearchParams } from '@/services/search.service'
import { useSession } from '@/hooks/useAuth'
import { RoomCard } from '@/components/rooms/RoomCard'
import { RoomCardSkeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Layout } from '@/components/layout/Layout'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const FEATURES = [
  { icon: '🏠', title: 'Publica tu habitación', desc: 'Crea tu anuncio en minutos con fotos, precio y ubicación.' },
  { icon: '🔍', title: 'Explora opciones', desc: 'Filtra por ciudad, tipo y precio para encontrar lo que buscas.' },
  { icon: '💬', title: 'Contacta directo', desc: 'Habla con el propietario por WhatsApp sin intermediarios.' },
]

export function HomePage() {
  const { data: session } = useSession()
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
    setCity(''); setRoomType(''); setMinPrice(''); setMaxPrice(''); setSort('recent')
  }, [])

  const hasActiveFilters = city || roomType || minPrice || maxPrice || sort !== 'recent'

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-purple-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 text-center">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium mb-4">
            🇨🇴 Conectando roomies en Colombia
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Encuentra tu habitación ideal
          </h1>
          <p className="mt-4 text-lg text-violet-100 max-w-xl mx-auto">
            Conectamos a propietarios con personas que buscan compartir vivienda. Simple, directo y sin comisiones.
          </p>
          <div className="mt-8 flex gap-2 max-w-xl mx-auto">
            <input
              type="search"
              placeholder="Buscar por ciudad, título..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 rounded-xl border-0 px-4 py-3 text-slate-800 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className="rounded-xl bg-white/20 hover:bg-white/30 px-4 py-3 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
          {!session && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link to="/register">
                <Button variant="primary" className="bg-white !text-violet-600 hover:bg-violet-50 shadow-lg">
                  Crear cuenta gratis
                </Button>
              </Link>
              <Link to="/login" className="text-sm text-violet-100 hover:text-white underline underline-offset-2">
                Ya tengo cuenta
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-slate-800">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listado */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Filtros */}
        {filtersOpen && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Ciudad" type="text" placeholder="Bogotá"
                value={city} onChange={(e) => setCity(e.target.value)} />
              <div className="flex flex-col gap-1">
                <label htmlFor="room_type_filter" className="text-sm font-medium text-slate-700">Tipo</label>
                <select id="room_type_filter" value={roomType}
                  onChange={(e) => setRoomType(e.target.value as 'private' | 'shared' | '')}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="">Todas</option>
                  <option value="private">Privada</option>
                  <option value="shared">Compartida</option>
                </select>
              </div>
              <Input label="Precio mínimo (COP)" type="number" min={0} placeholder="0"
                value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <Input label="Precio máximo (COP)" type="number" min={0} placeholder="2000000"
                value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            {hasActiveFilters && (
              <div className="mt-3">
                <button onClick={handleClearFilters} className="text-sm text-violet-600 hover:underline">
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Barra resultados */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {rooms ? `${rooms.length} resultado${rooms.length !== 1 ? 's' : ''}` : ''}
            {hasActiveFilters && <span className="ml-1 text-violet-600 font-medium">· filtros activos</span>}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-slate-600">Ordenar:</label>
            <select id="sort" value={sort}
              onChange={(e) => setSort(e.target.value as 'recent' | 'price_asc')}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="recent">Más reciente</option>
              <option value="price_asc">Menor precio</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <RoomCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-slate-500">Error al cargar. Intenta de nuevo.</div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-600">No se encontraron habitaciones</p>
            <p className="mt-1 text-sm text-slate-400">Prueba con otros filtros o términos de búsqueda</p>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="mt-3 text-sm text-violet-600 hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
