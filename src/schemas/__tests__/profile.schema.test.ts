// Feature: roomie-connect, Property 3: Validación de username rechaza caracteres no permitidos
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { updateProfileSchema } from '../profile.schema'

/**
 * Validates: Requirement 5.4
 *
 * Property 3: For any string that contains at least one character that is NOT
 * a letter (a-z, A-Z), number (0-9), underscore (_) or period (.),
 * the updateProfileSchema SHALL reject it and return a validation error.
 */
describe('updateProfileSchema — username validation', () => {
  it('Property 3: rejects any username containing at least one invalid character', () => {
    fc.assert(
      fc.property(
        fc
          .tuple(
            fc.string(),
            fc.constantFrom('!', '@', '#', '$', '%', ' ', '-', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', ';', ':', "'", '"', '<', '>', ',', '?', '/', '\\'),
            fc.string(),
          )
          .map(([a, b, c]) => a + b + c),
        (invalidUsername) => {
          const result = updateProfileSchema.safeParse({ username: invalidUsername })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  // Unit examples — valid usernames
  it('accepts a username with only letters', () => {
    const result = updateProfileSchema.safeParse({ username: 'validuser' })
    expect(result.success).toBe(true)
  })

  it('accepts a username with letters and numbers', () => {
    const result = updateProfileSchema.safeParse({ username: 'user123' })
    expect(result.success).toBe(true)
  })

  it('accepts a username with underscores', () => {
    const result = updateProfileSchema.safeParse({ username: 'user_name' })
    expect(result.success).toBe(true)
  })

  it('accepts a username with periods', () => {
    const result = updateProfileSchema.safeParse({ username: 'user.name' })
    expect(result.success).toBe(true)
  })

  it('accepts a username mixing letters, numbers, underscore and period', () => {
    const result = updateProfileSchema.safeParse({ username: 'User_123.ok' })
    expect(result.success).toBe(true)
  })

  // Unit examples — invalid usernames
  it('rejects a username with a space', () => {
    const result = updateProfileSchema.safeParse({ username: 'user name' })
    expect(result.success).toBe(false)
  })

  it('rejects a username with a hyphen', () => {
    const result = updateProfileSchema.safeParse({ username: 'user-name' })
    expect(result.success).toBe(false)
  })

  it('rejects a username with an exclamation mark', () => {
    const result = updateProfileSchema.safeParse({ username: 'user!' })
    expect(result.success).toBe(false)
  })

  it('rejects a username with an at sign', () => {
    const result = updateProfileSchema.safeParse({ username: 'user@domain' })
    expect(result.success).toBe(false)
  })

  it('rejects a username shorter than 3 characters', () => {
    const result = updateProfileSchema.safeParse({ username: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejects a username longer than 30 characters', () => {
    const result = updateProfileSchema.safeParse({ username: 'a'.repeat(31) })
    expect(result.success).toBe(false)
  })
})
