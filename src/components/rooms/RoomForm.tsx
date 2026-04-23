import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRoomSchema, type CreateRoomInput } from '@/schemas/room.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface RoomFormProps {
  defaultValues?: Partial<CreateRoomInput>
  onSubmit: (data: CreateRoomInput) => void
  isLoading?: boolean
}

export function RoomForm({ defaultValues, onSubmit, isLoading = false }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      available: true,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input
        label="Título"
        type="text"
        placeholder="Ej: Habitación luminosa en el centro"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="description"
          rows={5}
          placeholder="Describe el espacio, las comodidades, normas de la casa..."
          className={[
            'rounded-md border px-3 py-2 text-sm shadow-sm transition-colors resize-none',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            errors.description ? 'border-red-500' : 'border-gray-300',
          ].join(' ')}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="text-sm font-medium text-gray-700">
            Precio mensual (COP)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step={1000}
            placeholder="800000"
            className={[
              'rounded-md border px-3 py-2 text-sm shadow-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              errors.price ? 'border-red-500' : 'border-gray-300',
            ].join(' ')}
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-xs text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="room_type" className="text-sm font-medium text-gray-700">
            Tipo de habitación
          </label>
          <select
            id="room_type"
            className={[
              'rounded-md border px-3 py-2 text-sm shadow-sm transition-colors bg-white',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              errors.room_type ? 'border-red-500' : 'border-gray-300',
            ].join(' ')}
            {...register('room_type')}
          >
            <option value="">Selecciona un tipo</option>
            <option value="private">Habitación privada</option>
            <option value="shared">Habitación compartida</option>
          </select>
          {errors.room_type && (
            <p className="text-xs text-red-600">{errors.room_type.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Ciudad"
          type="text"
          placeholder="Madrid"
          error={errors.city?.message}
          {...register('city')}
        />

        <Input
          label="Zona / Barrio (opcional)"
          type="text"
          placeholder="Malasaña"
          error={errors.zone?.message}
          {...register('zone')}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="available"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          {...register('available')}
        />
        <label htmlFor="available" className="text-sm text-gray-700">
          Disponible actualmente
        </label>
      </div>

      {/* Coordenadas para el mapa (opcional) */}
      <div className="border-t border-gray-100 pt-4">
        <p className="mb-1 text-sm font-medium text-gray-700">Ubicación en el mapa (opcional)</p>
        <p className="mb-3 text-xs text-gray-500">
          Puedes obtener las coordenadas buscando la dirección en{' '}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer"
            className="text-indigo-600 underline">openstreetmap.org</a>{' '}
          y haciendo clic derecho → "Mostrar dirección".
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="latitude" className="text-sm font-medium text-gray-700">Latitud</label>
            <input id="latitude" type="number" step="any" placeholder="4.7110"
              className={[
                'rounded-md border px-3 py-2 text-sm shadow-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                errors.latitude ? 'border-red-500' : 'border-gray-300',
              ].join(' ')}
              {...register('latitude', { valueAsNumber: true })} />
            {errors.latitude && <p className="text-xs text-red-600">{errors.latitude.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="longitude" className="text-sm font-medium text-gray-700">Longitud</label>
            <input id="longitude" type="number" step="any" placeholder="-74.0721"
              className={[
                'rounded-md border px-3 py-2 text-sm shadow-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                errors.longitude ? 'border-red-500' : 'border-gray-300',
              ].join(' ')}
              {...register('longitude', { valueAsNumber: true })} />
            {errors.longitude && <p className="text-xs text-red-600">{errors.longitude.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
