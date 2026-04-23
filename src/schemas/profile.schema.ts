import { z } from 'zod'

const socialUsername = z
  .string()
  .max(60, 'Máximo 60 caracteres')
  .regex(/^[a-zA-Z0-9_.]+$/, 'Solo letras, números, guiones bajos y puntos')
  .optional()
  .or(z.literal(''))

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede superar 30 caracteres')
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      'Solo se permiten letras, números, guiones bajos y puntos'
    )
    .optional(),
  bio: z
    .string()
    .max(500, 'La bio no puede superar 500 caracteres')
    .optional(),
  phone: z
    .string()
    .max(20, 'El teléfono no puede superar 20 caracteres')
    .optional(),
  instagram: socialUsername,
  facebook: socialUsername,
  twitter: socialUsername,
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
