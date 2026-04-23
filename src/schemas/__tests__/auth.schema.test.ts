// Feature: roomie-connect, Property 1: Validación de contraseña rechaza entradas cortas
// Feature: roomie-connect, Property 2: Validación de email rechaza formatos inválidos
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { registerSchema } from '../auth.schema'

/**
 * Validates: Requirement 1.4
 *
 * Property 1: For any string with length between 0 and 7 characters (inclusive),
 * the registerSchema SHALL reject it and return a validation error.
 */
describe('registerSchema — password validation', () => {
  it('Property 1: rejects any password shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 7 }),
        (shortPassword) => {
          const result = registerSchema.safeParse({
            email: 'test@example.com',
            password: shortPassword,
          })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('accepts a password with 8 or more characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'validPass1',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a password with exactly 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a password with exactly 7 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

/**
 * Validates: Requirement 1.5
 *
 * Property 2: For any string that does NOT conform to email format
 * (no `@`, no domain, with spaces, etc.), the registerSchema SHALL
 * reject it and return a validation error.
 */
describe('registerSchema — email validation', () => {
  it('Property 2: rejects any string without "@" as email', () => {
    // Feature: roomie-connect, Property 2: Validación de email rechaza formatos inválidos
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@')),
        (invalidEmail) => {
          const result = registerSchema.safeParse({
            email: invalidEmail,
            password: 'validPass1',
          })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('accepts a valid email address', () => {
    const result = registerSchema.safeParse({
      email: 'usuario@ejemplo.com',
      password: 'validPass1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an email without "@"', () => {
    const result = registerSchema.safeParse({
      email: 'usuarioejemplo.com',
      password: 'validPass1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an email without domain', () => {
    const result = registerSchema.safeParse({
      email: 'usuario@',
      password: 'validPass1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an email with spaces', () => {
    const result = registerSchema.safeParse({
      email: 'usuario @ejemplo.com',
      password: 'validPass1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty email', () => {
    const result = registerSchema.safeParse({
      email: '',
      password: 'validPass1',
    })
    expect(result.success).toBe(false)
  })
})
