// Feature: roomie-connect, Property 8: Autorización de edición y eliminación de rooms

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * Validates: Requirements 7.5
 *
 * Property 8: For any pair (userId, room) where userId !== room.owner_id,
 * any attempt to edit or delete that room SHALL be rejected with an
 * authorization error, without regard to the data sent.
 *
 * The roomService delegates ownership enforcement to Supabase RLS.
 * When a non-owner attempts an UPDATE, Supabase returns error code '42501'
 * (insufficient_privilege). The service maps this to the message:
 * 'No tienes permiso para realizar esta acción.'
 *
 * We mock the Supabase client to simulate this RLS rejection and verify
 * that the service correctly propagates the authorization error.
 */

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// Use vi.hoisted so the mock variables are available when vi.mock factory runs.

const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn(() => ({ single: mockSingle }))
  const mockEq = vi.fn(() => ({ select: mockSelect }))
  const mockUpdate = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ update: mockUpdate }))
  return { mockSingle, mockFrom }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

// Import the service AFTER the mock is set up
import { roomService } from '../room.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simulate Supabase RLS rejection (error code 42501 = insufficient_privilege) */
function simulateRlsRejection() {
  mockSingle.mockResolvedValue({
    data: null,
    error: {
      code: '42501',
      message: 'new row violates row-level security policy for table "rooms"',
      details: null,
      hint: null,
    },
  })
}

/** Simulate a successful Supabase response (owner calling the function) */
function simulateSuccess(roomData: object) {
  mockSingle.mockResolvedValue({ data: roomData, error: null })
}

// ─── Unit examples ────────────────────────────────────────────────────────────

describe('roomService — unit examples for authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updateRoom throws authorization error when Supabase returns 42501', async () => {
    simulateRlsRejection()

    await expect(
      roomService.updateRoom('room-id-123', { title: 'Nuevo título' }),
    ).rejects.toThrow('No tienes permiso para realizar esta acción.')
  })

  it('setRoomStatus throws authorization error when Supabase returns 42501', async () => {
    simulateRlsRejection()

    await expect(
      roomService.setRoomStatus('room-id-123', 'deleted'),
    ).rejects.toThrow('No tienes permiso para realizar esta acción.')
  })

  it('updateRoom succeeds when Supabase returns data (owner calling)', async () => {
    const fakeRoom = {
      id: 'room-id-123',
      owner_id: 'owner-uuid',
      title: 'Nuevo título',
      description: 'Descripción actualizada con suficiente longitud.',
      price: 600,
      city: 'Barcelona',
      zone: null,
      latitude: null,
      longitude: null,
      room_type: 'private',
      available: true,
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    }
    simulateSuccess(fakeRoom)

    const result = await roomService.updateRoom('room-id-123', { title: 'Nuevo título' })
    expect(result).toEqual(fakeRoom)
  })

  it('setRoomStatus succeeds when Supabase returns data (owner calling)', async () => {
    const fakeRoom = {
      id: 'room-id-123',
      owner_id: 'owner-uuid',
      title: 'Mi habitación',
      description: 'Descripción de la habitación.',
      price: 500,
      city: 'Madrid',
      zone: null,
      latitude: null,
      longitude: null,
      room_type: 'shared',
      available: true,
      status: 'paused',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    }
    simulateSuccess(fakeRoom)

    const result = await roomService.setRoomStatus('room-id-123', 'paused')
    expect(result).toEqual(fakeRoom)
  })

  it('updateRoom throws generic error for non-42501 Supabase errors', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value', details: null, hint: null },
    })

    await expect(
      roomService.updateRoom('room-id-123', { title: 'Título' }),
    ).rejects.toThrow('No se pudo actualizar el room.')
  })

  it('setRoomStatus throws generic error for non-42501 Supabase errors', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value', details: null, hint: null },
    })

    await expect(
      roomService.setRoomStatus('room-id-123', 'active'),
    ).rejects.toThrow('No se pudo actualizar el estado del room.')
  })
})

// ─── Property 8: Autorización de edición y eliminación de rooms ───────────────

describe('Property 8: Autorización de edición y eliminación de rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'Property 8a: updateRoom — for any (userId, ownerId) pair where they differ, ' +
    'the service SHALL throw an authorization error when Supabase rejects with 42501',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two distinct UUIDs: one for the requesting user, one for the room owner
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          async ([_userId, _ownerId]) => {
            // Simulate Supabase RLS rejecting the non-owner's update attempt
            simulateRlsRejection()

            let threw = false
            let errorMessage = ''
            try {
              await roomService.updateRoom('some-room-id', { title: 'Intento no autorizado' })
            } catch (err) {
              threw = true
              errorMessage = err instanceof Error ? err.message : String(err)
            }

            return threw && errorMessage === 'No tienes permiso para realizar esta acción.'
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 8b: setRoomStatus (delete) — for any (userId, ownerId) pair where they differ, ' +
    'the service SHALL throw an authorization error when Supabase rejects with 42501',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two distinct UUIDs: one for the requesting user, one for the room owner
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          async ([_userId, _ownerId]) => {
            // Simulate Supabase RLS rejecting the non-owner's delete attempt
            simulateRlsRejection()

            let threw = false
            let errorMessage = ''
            try {
              await roomService.setRoomStatus('some-room-id', 'deleted')
            } catch (err) {
              threw = true
              errorMessage = err instanceof Error ? err.message : String(err)
            }

            return threw && errorMessage === 'No tienes permiso para realizar esta acción.'
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 8c: setRoomStatus (pause) — for any (userId, ownerId) pair where they differ, ' +
    'the service SHALL throw an authorization error when Supabase rejects with 42501',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          async ([_userId, _ownerId]) => {
            simulateRlsRejection()

            let threw = false
            let errorMessage = ''
            try {
              await roomService.setRoomStatus('some-room-id', 'paused')
            } catch (err) {
              threw = true
              errorMessage = err instanceof Error ? err.message : String(err)
            }

            return threw && errorMessage === 'No tienes permiso para realizar esta acción.'
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
