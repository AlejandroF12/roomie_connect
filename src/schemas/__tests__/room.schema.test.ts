// Feature: roomie-connect, Property 4: Validación de campos obligatorios de room
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { createRoomSchema } from '../room.schema'

/**
 * Validates: Requirements 6.2, 6.3
 *
 * Property 4: For any room creation object that has at least one required field
 * (title, description, price, city, room_type) absent, empty, or with a value
 * outside the allowed range, the Zod room schema SHALL reject it and return a
 * validation error.
 */

const validRoom = {
  title: 'Habitación céntrica',
  description: 'Habitación amplia con luz natural y buena ubicación en el centro.',
  price: 500,
  city: 'Madrid',
  room_type: 'private' as const,
}

describe('createRoomSchema — unit examples', () => {
  it('accepts a fully valid room', () => {
    const result = createRoomSchema.safeParse(validRoom)
    expect(result.success).toBe(true)
  })

  it('rejects when title is too short (< 5 chars)', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, title: 'Hab' })
    expect(result.success).toBe(false)
  })

  it('rejects when title is empty', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects when title exceeds 100 chars', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, title: 'A'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects when description is too short (< 20 chars)', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, description: 'Muy corta' })
    expect(result.success).toBe(false)
  })

  it('rejects when description exceeds 2000 chars', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, description: 'A'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('rejects when price is zero', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, price: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects when price is negative', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, price: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects when price exceeds 100000', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, price: 100001 })
    expect(result.success).toBe(false)
  })

  it('rejects when city is too short (< 2 chars)', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, city: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects when city is empty', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, city: '' })
    expect(result.success).toBe(false)
  })

  it('rejects when room_type is invalid', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, room_type: 'studio' })
    expect(result.success).toBe(false)
  })

  it('accepts room_type "shared"', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, room_type: 'shared' })
    expect(result.success).toBe(true)
  })
})

describe('createRoomSchema — Property 4: Validación de campos obligatorios de room', () => {
  it('Property 4a: rejects any title shorter than 5 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 4 }),
        (shortTitle) => {
          const result = createRoomSchema.safeParse({ ...validRoom, title: shortTitle })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 4b: rejects any description shorter than 20 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 19 }),
        (shortDescription) => {
          const result = createRoomSchema.safeParse({ ...validRoom, description: shortDescription })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 4c: rejects any non-positive price (zero or negative)', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(0), fc.float({ min: Math.fround(-100000), max: Math.fround(-0.01) })),
        (nonPositivePrice) => {
          const result = createRoomSchema.safeParse({ ...validRoom, price: nonPositivePrice })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 4d: rejects any price exceeding 100000', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100001, max: 999999 }),
        (excessivePrice) => {
          const result = createRoomSchema.safeParse({ ...validRoom, price: excessivePrice })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 4e: rejects any city shorter than 2 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 1 }),
        (shortCity) => {
          const result = createRoomSchema.safeParse({ ...validRoom, city: shortCity })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 4f: rejects any room_type that is not "private" or "shared"', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'private' && s !== 'shared'),
        (invalidType) => {
          const result = createRoomSchema.safeParse({ ...validRoom, room_type: invalidType })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })
})
