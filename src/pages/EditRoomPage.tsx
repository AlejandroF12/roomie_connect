import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoomDetail, useUpdateRoom, useSetRoomStatus } from '@/hooks/useRooms'
import { RoomForm } from '@/components/rooms/RoomForm'
import { RoomImageGallery } from '@/components/rooms/RoomImageGallery'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Layout } from '@/components/layout/Layout'
import type { CreateRoomInput } from '@/schemas/room.schema'

export function EditRoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: room, isLoading, isError } = useRoomDetail(id ?? '')
  const updateRoom = useUpdateRoom()
  const setRoomStatus = useSetRoomStatus()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleSubmit = (data: CreateRoomInput) => {
    if (!id) return
    updateRoom.mutate(
      { roomId: id, params: data },
      {
        onSuccess: () => {
          navigate(`/rooms/${id}`)
        },
      }
    )
  }

  const handleToggleStatus = () => {
    if (!id || !room) return
    const newStatus = room.status === 'active' ? 'paused' : 'active'
    setRoomStatus.mutate({ roomId: id, status: newStatus })
  }

  const handleDelete = () => {
    if (!id) return
    setRoomStatus.mutate(
      { roomId: id, status: 'deleted' },
      {
        onSuccess: () => navigate('/'),
      }
    )
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (isError || !room) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500">No se pudo cargar el room.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Editar habitación</h1>

          {/* Acciones de estado */}
          <div className="flex items-center gap-2">
            <Button
              variant={room.status === 'active' ? 'secondary' : 'primary'}
              size="sm"
              isLoading={setRoomStatus.isPending}
              onClick={handleToggleStatus}
            >
              {room.status === 'active' ? 'Pausar' : 'Publicar'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Eliminar
            </Button>
          </div>
        </div>

        {/* Formulario */}
        <Card className="mb-6 p-6">
          {updateRoom.isError && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
              {updateRoom.error?.message ?? 'Error al actualizar el room.'}
            </div>
          )}
          {updateRoom.isSuccess && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Room actualizado correctamente.
            </div>
          )}
          <RoomForm
            defaultValues={{
              title: room.title,
              description: room.description,
              price: room.price,
              city: room.city,
              zone: room.zone ?? undefined,
              room_type: room.room_type,
              available: room.available,
            }}
            onSubmit={handleSubmit}
            isLoading={updateRoom.isPending}
          />
        </Card>

        {/* Galería de imágenes */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Imágenes</h2>
          <RoomImageGallery
            roomId={room.id}
            images={room.room_images}
            editable
          />
        </Card>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar habitación"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro de que quieres eliminar esta habitación? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            isLoading={setRoomStatus.isPending}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
