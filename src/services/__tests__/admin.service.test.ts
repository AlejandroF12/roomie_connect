// Feature: roomie-connect, Property 19: Reportes del panel de administración están ordenados por fecha

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { Report } from '@/types'

/**
 * Validates: Requirements 12.1
 *
 * Property 19: For any list of reports returned by adminService.getReports,
 * for every adjacent pair (r_i, r_{i+1}), r_i.created_at >= r_{i+1}.created_at
 * (most recent to oldest).
 */

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const { mockOrder, mockFrom } = vi.hoisted(() => {
  const mockOrder = vi.fn()

  const mockSelect = vi.fn(() => ({ order: mockOrder }))

  const mockFrom = vi.fn(() => ({ select: mockSelect }))

  return { mockOrder, mockFrom }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

// Import the service AFTER the mock is set up
import { adminService } from '../admin.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    reporter_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    target_type: 'room',
    target_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    reason: 'spam',
    status: 'pending',
    admin_comment: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

/** Simulate Supabase returning a list of reports */
function simulateGetReports(reports: Report[]) {
  mockOrder.mockResolvedValueOnce({ data: reports, error: null })
}

/** Simulate Supabase returning an error */
function simulateGetReportsError() {
  mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
}

// ─── Unit examples ────────────────────────────────────────────────────────────

describe('adminService.getReports — unit examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty array when there are no reports', async () => {
    simulateGetReports([])
    const result = await adminService.getReports()
    expect(result).toEqual([])
  })

  it('returns a single report unchanged', async () => {
    const report = makeReport({ created_at: '2024-06-15T10:00:00Z' })
    simulateGetReports([report])
    const result = await adminService.getReports()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(report)
  })

  it('returns multiple reports in the order provided by Supabase (most recent first)', async () => {
    const reports = [
      makeReport({ id: '1', created_at: '2024-06-15T12:00:00Z' }),
      makeReport({ id: '2', created_at: '2024-06-15T10:00:00Z' }),
      makeReport({ id: '3', created_at: '2024-06-14T08:00:00Z' }),
    ]
    simulateGetReports(reports)
    const result = await adminService.getReports()
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('1')
    expect(result[1].id).toBe('2')
    expect(result[2].id).toBe('3')
  })

  it('throws when Supabase returns an error', async () => {
    simulateGetReportsError()
    await expect(adminService.getReports()).rejects.toThrow(
      'No se pudieron obtener los reportes.',
    )
  })

  it('calls .order("created_at", { ascending: false }) on the Supabase query', async () => {
    simulateGetReports([])
    await adminService.getReports()
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})

// ─── Property 19: Reportes del panel de administración están ordenados por fecha ───

describe('Property 19: Reportes del panel de administración están ordenados por fecha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'Property 19: For any list of reports returned by getReports, ' +
      'every adjacent pair (r_i, r_{i+1}) satisfies r_i.created_at >= r_{i+1}.created_at',
    async () => {
      // Arbitrary ISO timestamp generator (year 2020–2030)
      const isoTimestamp = fc
        .integer({ min: 1577836800000, max: 1893456000000 }) // 2020-01-01 to 2030-01-01 in ms
        .map((ms) => new Date(ms).toISOString())

      const reportArb = fc.record<Report>({
        id: fc.uuid(),
        reporter_id: fc.uuid(),
        target_type: fc.constantFrom('room' as const, 'user' as const),
        target_id: fc.uuid(),
        reason: fc.constantFrom(
          'spam' as const,
          'inappropriate_content' as const,
          'fake_listing' as const,
          'harassment' as const,
          'other' as const,
        ),
        status: fc.constantFrom(
          'pending' as const,
          'review' as const,
          'resolved' as const,
          'rejected' as const,
        ),
        admin_comment: fc.option(fc.string(), { nil: null }),
        created_at: isoTimestamp,
      })

      await fc.assert(
        fc.asyncProperty(fc.array(reportArb, { minLength: 0, maxLength: 20 }), async (reports) => {
          vi.clearAllMocks()

          // Sort descending (most recent first) — this is what Supabase .order() does
          const sortedReports = [...reports].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )

          // Simulate Supabase returning already-sorted data (as .order() would)
          simulateGetReports(sortedReports)

          const result = await adminService.getReports()

          // Verify the service preserves the order returned by Supabase
          // and that the order is descending by created_at
          for (let i = 0; i < result.length - 1; i++) {
            const current = new Date(result[i].created_at).getTime()
            const next = new Date(result[i + 1].created_at).getTime()
            if (current < next) return false
          }

          return true
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 19 (query check): getReports always calls Supabase with ascending: false',
    async () => {
      const isoTimestamp = fc
        .integer({ min: 1577836800000, max: 1893456000000 })
        .map((ms) => new Date(ms).toISOString())

      const reportArb = fc.record<Report>({
        id: fc.uuid(),
        reporter_id: fc.uuid(),
        target_type: fc.constantFrom('room' as const, 'user' as const),
        target_id: fc.uuid(),
        reason: fc.constantFrom(
          'spam' as const,
          'inappropriate_content' as const,
          'fake_listing' as const,
          'harassment' as const,
          'other' as const,
        ),
        status: fc.constantFrom(
          'pending' as const,
          'review' as const,
          'resolved' as const,
          'rejected' as const,
        ),
        admin_comment: fc.option(fc.string(), { nil: null }),
        created_at: isoTimestamp,
      })

      await fc.assert(
        fc.asyncProperty(fc.array(reportArb, { minLength: 0, maxLength: 10 }), async (reports) => {
          vi.clearAllMocks()
          simulateGetReports(reports)

          await adminService.getReports()

          // The service must always request descending order from Supabase
          const calls = mockOrder.mock.calls
          return (
            calls.length === 1 &&
            calls[0][0] === 'created_at' &&
            calls[0][1]?.ascending === false
          )
        }),
        { numRuns: 100 },
      )
    },
  )
})
