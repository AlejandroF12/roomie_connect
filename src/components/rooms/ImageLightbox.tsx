import { useEffect, useState, useCallback } from 'react'

interface ImageLightboxProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length)
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [images.length])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length)
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [images.length])

  const zoomIn = () => setScale((s) => Math.min(s + 0.5, 4))
  const zoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1)
      if (next === 1) setOffset({ x: 0, y: 0 })
      return next
    })
  }
  const resetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }) }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === '+') zoomIn()
      if (e.key === '-') zoomOut()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
  }

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => setDragging(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Contenedor central — detiene propagación para no cerrar al hacer click dentro */}
      <div
        className="relative flex flex-col items-center gap-3 max-w-5xl w-full px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen */}
        <div
          className="relative overflow-hidden rounded-lg max-h-[80vh] flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            src={images[current]}
            alt={`Imagen ${current + 1}`}
            className="max-h-[80vh] max-w-full object-contain select-none transition-transform duration-150"
            style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` }}
            draggable={false}
          />
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3">
          {/* Prev */}
          {images.length > 1 && (
            <button onClick={prev}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
              aria-label="Anterior">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Zoom out */}
          <button onClick={zoomOut} disabled={scale <= 1}
            className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors disabled:opacity-30"
            aria-label="Alejar">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>

          {/* Reset zoom */}
          <button onClick={resetZoom}
            className="rounded-full bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs text-white transition-colors"
            aria-label="Restablecer zoom">
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom in */}
          <button onClick={zoomIn} disabled={scale >= 4}
            className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors disabled:opacity-30"
            aria-label="Acercar">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>

          {/* Next */}
          {images.length > 1 && (
            <button onClick={next}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
              aria-label="Siguiente">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Contador */}
        {images.length > 1 && (
          <p className="text-xs text-white/60">{current + 1} / {images.length}</p>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
        aria-label="Cerrar"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
