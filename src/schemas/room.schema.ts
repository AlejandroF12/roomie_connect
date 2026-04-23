import { z } from 'zod'

export const createRoomSchema = z.object({
  title: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede superar 100 caracteres'),
  description: z
    .string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede superar 2000 caracteres'),
  price: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0')
    .max(100_000_000, 'El precio no puede superar 100,000,000'),
  city: z
    .string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(100, 'La ciudad no puede superar 100 caracteres'),
  zone: z.string().max(100).optional(),
  room_type: z.enum(['private', 'shared'], {
    errorMap: () => ({ message: 'Selecciona un tipo de habitación válido' }),
  }),
  available: z.boolean().default(true),
  latitude: z
    .number({ invalid_type_error: 'Latitud inválida' })
    .min(-90).max(90)
    .optional()
    .or(z.nan().transform(() => undefined)),
  longitude: z
    .number({ invalid_type_error: 'Longitud inválida' })
    .min(-180).max(180)
    .optional()
    .or(z.nan().transform(() => undefined)),
})

export const updateRoomSchema = createRoomSchema.partial()

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
