import { z } from 'zod'

export const createReportSchema = z.object({
  target_type: z.enum(['room', 'user'], {
    errorMap: () => ({ message: 'El tipo de reporte debe ser "room" o "user"' }),
  }),
  target_id: z.string().uuid('El ID del objetivo no es válido'),
  reason: z.enum(
    ['spam', 'inappropriate_content', 'fake_listing', 'harassment', 'other'],
    {
      errorMap: () => ({ message: 'Selecciona un motivo válido' }),
    }
  ),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
