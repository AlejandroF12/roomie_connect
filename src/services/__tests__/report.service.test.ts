// Feature: roomie-connect, Property 18: Reporte de contenido propio es rechazado

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * Validates: Requirements 11.3
 *
 * Property 18: For any authenticated user, attempting to create a report where
 * the reporter_id matches the target_id (when target_type = 'user') or where
 * the reporter_id matches the owner_id of the room (when target_type = 'room')
 * SHALL be rejected with a validation error containing "propio" or "No puedes".
 */

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// Use vi.hoisted so the mock variables are available when vi.mock factory runs.

const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()

  // Chain for rooms: .select().eq().single()
  const mockRoomEq = vi.fn(() => ({ single: mockSingle }))
  const mockRoomSelect = vi.fn(() => ({ eq: mockRoomEq }))

  // Chain for reports: .insert().select().single()
  const mockReportSelectAfterInsert = vi.fn(() => ({ single: mockSingle }))
  const mockInsert = vi.fn(() => ({ select: mockReportSelectAfterInsert }))

  const mockFrom = vi.fn((table: string) => {
    if (table === 'rooms') {
      return { select: mockRoomSelect }
    }
    return { insert: mockInsert }
  })
  return { mockSingle, mockFrom }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

// Import the service AFTER the mock is set up
import { reportService } from '../report.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simulate Supabase returning a room owned by the given userId */
function simulateRoomOwnedBy(ownerId: string) {
  mockSingle.mockResolvedValueOnce({
    data: { owner_id: ownerId },
    error: null,
  })
}

/** Simulate a successful report insertion */
function simulateReportInsertSuccess(reportData: object) {
  mockSingle.mockResolvedValue({ data: reportData, error: null })
}

// ─── Unit examples ────────────────────────────────────────────────────────────

describe('reportService — unit examples for self-report rejection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createReport throws when target_type=user and reporterId === target_id', async () => {
    const userId = '11111111-1111-1111-1111-111111111111'

    await expect(
      reportService.createReport(userId, {
        target_type: 'user',
        target_id: userId,
        reason: 'spam',
      }),
    ).rejects.toThrow('No puedes reportar tu propio contenido.')
  })

  it('createReport succeeds when target_type=user and reporterId !== target_id', async () => {
    const reporterId = '11111111-1111-1111-1111-111111111111'
    const targetId = '22222222-2222-2222-2222-222222222222'
    const fakeReport = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      reporter_id: reporterId,
      target_type: 'user',
      target_id: targetId,
      reason: 'spam',
      status: 'pending',
      admin_comment: null,
      created_at: '2024-01-01T00:00:00Z',
    }
    simulateReportInsertSuccess(fakeReport)

    const result = await reportService.createReport(reporterId, {
      target_type: 'user',
      target_id: targetId,
      reason: 'spam',
    })
    expect(result).toEqual(fakeReport)
  })

  it('createReport throws when target_type=room and reporter is the room owner', async () => {
    const reporterId = '33333333-3333-3333-3333-333333333333'
    const roomId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

    simulateRoomOwnedBy(reporterId)

    await expect(
      reportService.createReport(reporterId, {
        target_type: 'room',
        target_id: roomId,
        reason: 'fake_listing',
      }),
    ).rejects.toThrow('No puedes reportar tu propio contenido.')
  })

  it('createReport succeeds when target_type=room and reporter is NOT the room owner', async () => {
    const reporterId = '33333333-3333-3333-3333-333333333333'
    const ownerId = '44444444-4444-4444-4444-444444444444'
    const roomId = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    const fakeReport = {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      reporter_id: reporterId,
      target_type: 'room',
      target_id: roomId,
      reason: 'fake_listing',
      status: 'pending',
      admin_comment: null,
      created_at: '2024-01-01T00:00:00Z',
    }

    simulateRoomOwnedBy(ownerId)
    simulateReportInsertSuccess(fakeReport)

    const result = await reportService.createReport(reporterId, {
      target_type: 'room',
      target_id: roomId,
      reason: 'fake_listing',
    })
    expect(result).toEqual(fakeReport)
  })
})

// ─── Property 18: Reporte de contenido propio es rechazado ───────────────────

describe('Property 18: Reporte de contenido propio es rechazado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'Property 18a: target_type=user — for any userId used as both reporterId and target_id, ' +
    'createReport SHALL throw an error containing "propio" or "No puedes"',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            let threw = false
            let errorMessage = ''
            try {
              await reportService.createReport(userId, {
                target_type: 'user',
                target_id: userId,
                reason: 'spam',
              })
            } catch (err) {
              threw = true
              errorMessage = err instanceof Error ? err.message : String(err)
            }

            return (
              threw &&
              (errorMessage.includes('propio') || errorMessage.includes('No puedes'))
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 18b: target_type=room — for any userId where the room owner_id === reporterId, ' +
    'createReport SHALL throw an error containing "propio" or "No puedes"',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(fc.uuid(), fc.uuid()),
          async ([reporterId, roomId]) => {
            vi.clearAllMocks()
            // Simulate Supabase returning a room owned by the reporter
            simulateRoomOwnedBy(reporterId)

            let threw = false
            let errorMessage = ''
            try {
              await reportService.createReport(reporterId, {
                target_type: 'room',
                target_id: roomId,
                reason: 'harassment',
              })
            } catch (err) {
              threw = true
              errorMessage = err instanceof Error ? err.message : String(err)
            }

            return (
              threw &&
              (errorMessage.includes('propio') || errorMessage.includes('No puedes'))
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
