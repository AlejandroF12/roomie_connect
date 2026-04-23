import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateRoom, useRoomDetail } from '@/hooks/useRooms'
import { RoomForm } from '@/components/rooms/RoomForm'
import { RoomImageGallery } from '@/components/rooms/RoomImageGallery'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Layout } from '@/components/layout/Layout'
import type { CreateRoomInput } from '@/schemas/room.schema'

// Sub-componente que carga el room recién creado para tener imágenes reactivas
function ImageStep({ roomId, onFinish }: { roomId: string; onFinish: () => void }) {
  const { data: room, isLoading } = useRoomDetail(roomId)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
        ¡Habitación creada! Ahora puedes agregar fotos.
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Imágenes</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner size="md" /></div>
        ) : (
          <RoomImageGallery
            roomId={roomId}
            images={room?.room_images ?? []}
            editable
          />
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onFinish}>
          Ver publicación
        </Button>
      </div>
    </div>
  )
}

export function CreateRoomPage() {
  const navigate = useNavigate()
  const createRoom = useCreateRoom()
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)

  const handleSubmit = (data: CreateRoomInput) => {
    createRoom.mutate(data, {
      onSuccess: (room) => setCreatedRoomId(room.id),
    })
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Publicar habitación</h1>

        {!createdRoomId ? (
          <Card className="p-6">
            {createRoom.isError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
                {createRoom.error?.message ?? 'Error al crear la habitación.'}
              </div>
            )}
            <RoomForm onSubmit={handleSubmit} isLoading={createRoom.isPending} />
          </Card>
        ) : (
          <ImageStep
            roomId={createdRoomId}
            onFinish={() => navigate(`/rooms/${createdRoomId}`)}
          />
        )}
      </div>
    </Layout>
  )
}
