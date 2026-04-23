// Feature: roomie-connect, Property 17: Motivo de reporte debe pertenecer a la lista predefinida
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { createReportSchema } from '../report.schema'

const VALID_REASONS = ['spam', 'inappropriate_content', 'fake_listing', 'harassment', 'other'] as const
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

/**
 * Validates: Requirement 11.2
 *
 * Property 17: For any string that is NOT one of the ReportReason enum values
 * (spam, inappropriate_content, fake_listing, harassment, other),
 * the createReportSchema SHALL reject it and return a validation error.
 */
describe('createReportSchema — reason validation', () => {
  it('Property 17: rejects any string not in the predefined reason list', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_REASONS.includes(s as typeof VALID_REASONS[number])),
        (invalidReason) => {
          const result = createReportSchema.safeParse({
            target_type: 'room',
            target_id: VALID_UUID,
            reason: invalidReason,
          })
          return result.success === false
        },
      ),
      { numRuns: 100 },
    )
  })

  it('accepts "spam" as a valid reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: 'spam',
    })
    expect(result.success).toBe(true)
  })

  it('accepts "inappropriate_content" as a valid reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: 'inappropriate_content',
    })
    expect(result.success).toBe(true)
  })

  it('accepts "fake_listing" as a valid reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: 'fake_listing',
    })
    expect(result.success).toBe(true)
  })

  it('accepts "harassment" as a valid reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: 'harassment',
    })
    expect(result.success).toBe(true)
  })

  it('accepts "other" as a valid reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: 'other',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty string as reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a random string as reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: 'invalid_reason',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a numeric string as reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: '123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a near-match string as reason', () => {
    const result = createReportSchema.safeParse({
      target_type: 'room',
      target_id: VALID_UUID,
      reason: 'SPAM',
    })
    expect(result.success).toBe(false)
  })
})
