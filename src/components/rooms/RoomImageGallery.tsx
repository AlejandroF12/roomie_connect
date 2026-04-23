import { useRef, useState } from 'react'
import { useUploadRoomImages, useDeleteRoomImage, useSetMainImage } from '@/hooks/useRooms'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ImageLightbox } from '@/components/rooms/ImageLightbox'
import type { RoomImage } from '@/types'

const MAX_IMAGES = 10

interface RoomImageGalleryProps {
  roomId: string
  images: RoomImage[]
  editable?: boolean
}

export function RoomImageGallery({ roomId, images, editable = false }: RoomImageGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const uploadImages = useUploadRoomImages()
  const deleteImage = useDeleteRoomImage()
  const setMainImage = useSetMainImage()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploadError(null)

    const totalAfterUpload = images.length + files.length
    if (totalAfterUpload > MAX_IMAGES) {
      setUploadError(`Solo se permiten hasta ${MAX_IMAGES} imágenes por room. Actualmente tienes ${images.length}.`)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    uploadImages.mutate(
      { roomId, files },
      {
        onError: (err) => setUploadError(err.message),
        onSettled: () => {
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
      }
    )
  }

  const handleSetMain = (imageId: string) => {
    setMainImage.mutate({ roomId, imageId })
  }

  const handleDelete = (imageId: string) => {
    deleteImage.mutate({ imageId, roomId })
  }

  if (!images.length && !editable) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        <p className="text-sm">Sin imágenes</p>
      </div>
    )
  }

  const imageUrls = images.map((img) => img.url)

  return (
    <div className="flex flex-col gap-4">
      {/* Grid de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, idx) => (
            <div key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
              <img
                src={img.url}
                alt="Imagen del room"
                className="h-full w-full object-cover cursor-zoom-in"
                loading="lazy"
                onClick={() => setLightboxIndex(idx)}
              />

              {/* Badge principal */}
              {img.is_main && (
                <div className="absolute top-1 left-1 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Principal
                </div>
              )}

              {/* Acciones (solo editable) */}
              {editable && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!img.is_main && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetMain(img.id)}
                      disabled={setMainImage.isPending}
                    >
                      Hacer principal
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(img.id)}
                    disabled={deleteImage.isPending}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Subida de imágenes (solo editable) */}
      {editable && (
        <div className="flex flex-col gap-2">
          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}

          {images.length < MAX_IMAGES ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploadImages.isPending}
                className="self-start"
              >
                {uploadImages.isPending ? 'Subiendo...' : 'Agregar imágenes'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500">
                {images.length}/{MAX_IMAGES} imágenes. Formatos: JPG, PNG, WebP.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Has alcanzado el límite de {MAX_IMAGES} imágenes.
            </p>
          )}

          {(deleteImage.isPending || setMainImage.isPending) && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Spinner size="sm" />
              <span>Procesando...</span>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
