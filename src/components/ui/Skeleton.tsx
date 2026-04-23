interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={['animate-pulse rounded-md bg-slate-200', className].join(' ')} />
  )
}

// Skeleton de RoomCard
export function RoomCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3 mt-1" />
      </div>
    </div>
  )
}

// Skeleton de fila en lista (MyRooms, Favorites)
export function RoomRowSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-100 bg-white p-4">
      <Skeleton className="h-24 w-32 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2 justify-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-1/4 mt-1" />
      </div>
    </div>
  )
}

// Skeleton de perfil
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

// Skeleton de página de detalle de room
export function RoomDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Galería */}
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />

          {/* Info */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-9 w-1/4 mt-1" />
            <div className="flex flex-col gap-2 mt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
