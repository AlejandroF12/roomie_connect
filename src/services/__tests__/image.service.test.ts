// Feature: roomie-connect, Property 5: Primera imagen es asignada como principal automáticamente

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * Validates: Requirements 6.6
 *
 * Property 5: For any list of images uploaded to a room where none has
 * is_main = true, the automatic assignment logic SHALL mark the first image
 * in the list as is_main = true and all others as is_main = false.
 *
 * The imageService embeds this logic inside uploadRoomImages:
 *   const isMain = !hasMain && i === 0
 *
 * We mock Supabase to simulate a room with no existing images (hasMain = false)
 * and capture the insert payloads to verify the is_main assignments.
 */

// ─── Mock Supabase ────────────────────────────────────────────────────────────

// Capture insert payloads so we can assert on is_main values
const insertedRecords: Array<{ is_main: boolean }> = []

const { mockFrom } = vi.hoisted(() => {
  // Storage mock
  const mockGetPublicUrl = vi.fn(() => ({
    data: { publicUrl: 'https://example.com/image.jpg' },
  }))
  const mockUpload = vi.fn().mockResolvedValue({ error: null })
  const mockStorageBucket = vi.fn(() => ({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  }))

  // DB mock — we need to track insert payloads
  const mockSingle = vi.fn()
  const mockSelect = vi.fn(() => ({ single: mockSingle }))
  const mockInsert = vi.fn(() => ({ select: mockSelect }))

  // For the count query (head: true)
  const mockHead = vi.fn().mockResolvedValue({ count: 0, error: null })
  const mockEqForCount = vi.fn(() => mockHead)
  const mockSelectCount = vi.fn(() => ({ eq: mockEqForCount }))

  // For the existingImages query (select is_main)
  const mockExistingImagesResult = vi.fn().mockResolvedValue({
    data: [],
    error: null,
  })
  const mockEqForImages = vi.fn(() => mockExistingImagesResult)
  const mockSelectIsMain = vi.fn(() => ({ eq: mockEqForImages }))

  // from() dispatcher — routes to the right mock chain based on call order
  let fromCallCount = 0
  const mockFrom = vi.fn(() => {
    fromCallCount++
    // Call 1: count query  → select('*', { count: 'exact', head: true })
    // Call 2: existingImages query → select('is_main')
    // Calls 3+: insert calls (one per file)
    if (fromCallCount === 1) {
      return { select: mockSelectCount }
    }
    if (fromCallCount === 2) {
      return { select: mockSelectIsMain }
    }
    // Insert call — capture the payload
    const captureInsert = vi.fn((payload: { is_main: boolean }) => {
      insertedRecords.push({ is_main: payload.is_main })
      return { select: mockSelect }
    })
    return { insert: captureInsert }
  })

  return {
    mockFrom,
    mockSingle,
    mockStorageBucket,
    mockUpload,
    mockGetPublicUrl,
    fromCallCount: () => fromCallCount,
    resetFromCallCount: () => { fromCallCount = 0 },
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/image.jpg' },
        })),
      })),
    },
  },
}))

import { imageService } from '../image.service'

// ─── Helper: create a minimal File mock ──────────────────────────────────────

function makeFile(name: string): File {
  return new File(['content'], name, { type: 'image/jpeg' })
}

// ─── Unit examples ────────────────────────────────────────────────────────────

describe('imageService — unit examples for auto-assignment of main image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertedRecords.length = 0
  })

  it('marks the first image as is_main=true when uploading a single image to a room with no images', async () => {
    // Arrange: mock returns for this specific test
    const { supabase } = await import('@/lib/supabase')
    const fromMock = vi.mocked(supabase.from)

    let callCount = 0
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: 'img-1', room_id: 'room-1', url: 'https://example.com/image.jpg', is_main: true, display_order: 0, created_at: '' },
      error: null,
    })

    fromMock.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // count query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        } as any
      }
      if (callCount === 2) {
        // existingImages query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any
      }
      // insert call
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: singleMock,
          }),
        }),
      } as any
    })

    const files = [makeFile('photo1.jpg')]
    const result = await imageService.uploadRoomImages('room-1', files)

    expect(result).toHaveLength(1)
    expect(result[0].is_main).toBe(true)
  })

  it('marks only the first image as is_main=true when uploading multiple images', async () => {
    const { supabase } = await import('@/lib/supabase')
    const fromMock = vi.mocked(supabase.from)

    let callCount = 0
    fromMock.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        } as any
      }
      if (callCount === 2) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any
      }
      // insert calls — return is_main based on whether it's the first insert
      const insertIndex = callCount - 3 // 0-based index of this insert
      const isMain = insertIndex === 0
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: `img-${insertIndex}`,
                room_id: 'room-1',
                url: 'https://example.com/image.jpg',
                is_main: isMain,
                display_order: insertIndex,
                created_at: '',
              },
              error: null,
            }),
          }),
        }),
      } as any
    })

    const files = [makeFile('photo1.jpg'), makeFile('photo2.jpg'), makeFile('photo3.jpg')]
    const result = await imageService.uploadRoomImages('room-1', files)

    expect(result).toHaveLength(3)
    expect(result[0].is_main).toBe(true)
    expect(result[1].is_main).toBe(false)
    expect(result[2].is_main).toBe(false)
  })

  it('does NOT mark any image as is_main=true when a main image already exists', async () => {
    const { supabase } = await import('@/lib/supabase')
    const fromMock = vi.mocked(supabase.from)

    let callCount = 0
    fromMock.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
          }),
        } as any
      }
      if (callCount === 2) {
        // existing images already has a main
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ is_main: true }],
              error: null,
            }),
          }),
        } as any
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'img-new',
                room_id: 'room-1',
                url: 'https://example.com/image.jpg',
                is_main: false,
                display_order: 1,
                created_at: '',
              },
              error: null,
            }),
          }),
        }),
      } as any
    })

    const files = [makeFile('photo-new.jpg')]
    const result = await imageService.uploadRoomImages('room-1', files)

    expect(result).toHaveLength(1)
    expect(result[0].is_main).toBe(false)
  })
})

// ─── Property 5: Primera imagen es asignada como principal automáticamente ────

describe('Property 5: Primera imagen es asignada como principal automáticamente', () => {
  /**
   * Validates: Requirements 6.6
   *
   * For any list of N images (N >= 1) uploaded to a room where no existing
   * image has is_main = true, the service SHALL:
   *   - Insert the first image with is_main = true
   *   - Insert all subsequent images with is_main = false
   *
   * We verify this by inspecting the is_main values in the insert payloads
   * captured from the Supabase mock.
   */
  it(
    'Property 5: for any non-empty list of images uploaded to a room with no main image, ' +
    'the first image SHALL be inserted with is_main=true and all others with is_main=false',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arrays of image descriptors (minLength: 1, maxLength: 10 — the service limit)
          fc.array(
            fc.record({
              id: fc.uuid(),
              url: fc.webUrl(),
              is_main: fc.constant(false),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (imageDescriptors) => {
            // Reset mocks for each run
            vi.clearAllMocks()
            const capturedInsertPayloads: Array<{ is_main: boolean }> = []

            const { supabase } = await import('@/lib/supabase')
            const fromMock = vi.mocked(supabase.from)

            let callCount = 0
            fromMock.mockImplementation(() => {
              callCount++
              if (callCount === 1) {
                // count query — 0 existing images
                return {
                  select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
                  }),
                } as any
              }
              if (callCount === 2) {
                // existingImages query — no main image exists
                return {
                  select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                } as any
              }
              // insert call — capture the is_main value from the payload
              const insertIndex = callCount - 3
              return {
                insert: vi.fn().mockImplementation((payload: { is_main: boolean }) => {
                  capturedInsertPayloads.push({ is_main: payload.is_main })
                  return {
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: {
                          id: imageDescriptors[insertIndex]?.id ?? `img-${insertIndex}`,
                          room_id: 'room-test',
                          url: imageDescriptors[insertIndex]?.url ?? 'https://example.com/img.jpg',
                          is_main: payload.is_main,
                          display_order: insertIndex,
                          created_at: '',
                        },
                        error: null,
                      }),
                    }),
                  }
                }),
              } as any
            })

            // Create File objects matching the number of image descriptors
            const files = imageDescriptors.map((_, i) => makeFile(`photo-${i}.jpg`))

            // Execute the service
            const result = await imageService.uploadRoomImages('room-test', files)

            // Verify the result length matches
            if (result.length !== imageDescriptors.length) return false

            // Property: first image must have is_main = true
            if (result[0].is_main !== true) return false

            // Property: all other images must have is_main = false
            for (let i = 1; i < result.length; i++) {
              if (result[i].is_main !== false) return false
            }

            // Also verify the insert payloads captured directly
            if (capturedInsertPayloads.length !== imageDescriptors.length) return false
            if (capturedInsertPayloads[0].is_main !== true) return false
            for (let i = 1; i < capturedInsertPayloads.length; i++) {
              if (capturedInsertPayloads[i].is_main !== false) return false
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// Feature: roomie-connect, Property 7: Exactamente una imagen principal por room

describe('Property 7: Exactamente una imagen principal por room', () => {
  /**
   * Validates: Requirements 7.6
   *
   * For any room with N images (N ≥ 1), after selecting any one of them as
   * the main image, there SHALL be exactly one image with is_main = true and
   * the remaining N-1 images SHALL have is_main = false.
   *
   * setMainImage performs two Supabase updates:
   *   1. update({ is_main: false }).eq('room_id', roomId)  — resets all
   *   2. update({ is_main: true }).eq('id', imageId)       — sets selected
   *
   * We simulate this in-memory and verify the uniqueness invariant.
   */
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'Property 7: for any room with N images (N ≥ 1), after setMainImage, ' +
    'exactly one image SHALL have is_main=true and all others SHALL have is_main=false',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate N images (N ≥ 1) with unique IDs and arbitrary initial is_main values
          fc.array(
            fc.record({
              id: fc.uuid(),
              is_main: fc.boolean(),
            }),
            { minLength: 1, maxLength: 15 },
          ),
          // Generate the index of the image to set as main
          fc.nat(),
          async (images, rawIndex) => {
            vi.clearAllMocks()

            // Clamp the selected index to the valid range
            const selectedIndex = rawIndex % images.length
            const selectedImageId = images[selectedIndex].id
            const roomId = 'room-property-7'

            // In-memory state: start with a copy of the generated images
            const state = images.map((img) => ({ ...img }))

            const { supabase } = await import('@/lib/supabase')
            const fromMock = vi.mocked(supabase.from)

            let callCount = 0
            fromMock.mockImplementation(() => {
              callCount++

              if (callCount === 1) {
                // First call: update({ is_main: false }).eq('room_id', roomId)
                // Simulate resetting all images to is_main = false
                return {
                  update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockImplementation((_col: string, _val: string) => {
                      // Reset all images in state
                      state.forEach((img) => { img.is_main = false })
                      return Promise.resolve({ error: null })
                    }),
                  }),
                } as any
              }

              // Second call: update({ is_main: true }).eq('id', imageId)
              // Simulate setting the selected image to is_main = true
              return {
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockImplementation((_col: string, val: string) => {
                    const target = state.find((img) => img.id === val)
                    if (target) target.is_main = true
                    return Promise.resolve({ error: null })
                  }),
                }),
              } as any
            })

            // Execute the service
            await imageService.setMainImage(roomId, selectedImageId)

            // Verify: exactly one image has is_main = true
            const mainImages = state.filter((img) => img.is_main === true)
            const nonMainImages = state.filter((img) => img.is_main === false)

            if (mainImages.length !== 1) return false
            if (nonMainImages.length !== images.length - 1) return false

            // Verify: the selected image is the one with is_main = true
            if (mainImages[0].id !== selectedImageId) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// Feature: roomie-connect, Property 6: Límite de imágenes por room

describe('Property 6: Límite de imágenes por room', () => {
  /**
   * Validates: Requirements 6.7
   *
   * For any attempt to upload images to a room where the total
   * (existing + new) would exceed 10, the service SHALL reject the upload
   * and throw an error indicating the maximum limit.
   */
  it(
    'Property 6: for any combination of existing + new images that exceeds 10, ' +
    'uploadRoomImages SHALL throw an error indicating the maximum limit',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }),   // existing image count
          fc.integer({ min: 1, max: 20 }),   // new files count
          async (existing, newCount) => {
            // Only test cases where the total exceeds the limit
            fc.pre(existing + newCount > 10)

            const { supabase } = await import('@/lib/supabase')
            const fromMock = vi.mocked(supabase.from)

            fromMock.mockImplementation(() => ({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: existing, error: null }),
              }),
            } as any))

            const files = Array.from({ length: newCount }, (_, i) => makeFile(`photo-${i}.jpg`))

            await expect(
              imageService.uploadRoomImages('room-limit-test', files),
            ).rejects.toThrow(/10|límite|máximo/i)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
