// Feature: roomie-connect, Property 14: Favoritos filtran rooms eliminados

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * Validates: Requirements 9.3
 *
 * Property 14: For any user with favorites that include rooms of status `active`,
 * `paused`, and `deleted`, the list returned by `favoritesService.getFavorites`
 * SHALL contain only rooms with `status = 'active'` or `status = 'paused'`.
 *
 * The favoritesService delegates status filtering to Supabase via:
 *   `.in('rooms.status', ['active', 'paused'])`
 *
 * We verify:
 *   1. The service ALWAYS calls `.in('rooms.status', ['active', 'paused'])` on the query.
 *   2. When Supabase returns favorites with rooms of mixed statuses (simulating correct
 *      DB-level filtering), the service output contains only active/paused rooms.
 *   3. The returned objects are valid `RoomCard` instances with all required fields.
 */

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// Use vi.hoisted so mock variables are available when vi.mock factory runs.

const { mockFrom, capturedInCalls, resetCapturedInCalls, setMockResult } = vi.hoisted(() => {
  // Track all .in(column, values) calls made on the query chain
  const capturedInCalls: Array<{ column: string; values: unknown[] }> = []

  // The result that the mock query will resolve with
  let mockResult: { data: unknown[] | null; error: null | { message: string } } = {
    data: [],
    error: null,
  }

  // Chainable query builder mock that captures .in() calls
  function makeQueryBuilder(): Record<string, unknown> {
    const builder: Record<string, (...args: unknown[]) => unknown> = {
      select: () => makeQueryBuilder(),
      eq: () => makeQueryBuilder(),
      in: (column: string, values: unknown[]) => {
        capturedInCalls.push({ column, values })
        return makeQueryBuilder()
      },
      // Make the builder thenable so `await supabase.from(...).select(...).eq(...).in(...)` works
      then: (
        resolve: (value: { data: unknown[] | null; error: null | { message: string } }) => unknown,
      ) => Promise.resolve(mockResult).then(resolve),
    }
    return builder
  }

  const mockFrom = vi.fn(() => makeQueryBuilder())

  return {
    mockFrom,
    capturedInCalls,
    resetCapturedInCalls: () => {
      capturedInCalls.length = 0
    },
    setMockResult: (result: {
      data: unknown[] | null
      error: null | { message: string }
    }) => {
      mockResult = result
    },
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

// Import the service AFTER the mock is set up
import { favoritesService } from '../favorites.service'
import type { RoomStatus, RoomType } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a raw favorite row as Supabase would return it */
function makeFavoriteRow(overrides: {
  roomId?: string
  title?: string
  price?: number
  city?: string
  roomType?: RoomType
  status?: RoomStatus
  createdAt?: string
  images?: Array<{ url: string; is_main: boolean }>
}) {
  return {
    room_id: overrides.roomId ?? 'room-id',
    rooms: {
      id: overrides.roomId ?? 'room-id',
      title: overrides.title ?? 'Habitación en Madrid',
      price: overrides.price ?? 500,
      city: overrides.city ?? 'Madrid',
      room_type: overrides.roomType ?? 'private',
      status: overrides.status ?? 'active',
      created_at: overrides.createdAt ?? '2024-01-01T00:00:00Z',
      room_images: overrides.images ?? [{ url: 'https://example.com/img.jpg', is_main: true }],
    },
  }
}

// ─── Unit examples ────────────────────────────────────────────────────────────

describe('favoritesService — unit examples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCapturedInCalls()
  })

  it('addFavorite calls supabase upsert without throwing on success', async () => {
    // Mock the upsert chain: from().upsert() → { error: null }
    mockFrom.mockImplementationOnce(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }))

    await expect(favoritesService.addFavorite('user-1', 'room-1')).resolves.toBeUndefined()
  })

  it('addFavorite throws when Supabase returns an error', async () => {
    mockFrom.mockImplementationOnce(() => ({
      upsert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    }))

    await expect(favoritesService.addFavorite('user-1', 'room-1')).rejects.toThrow(
      'No se pudo guardar el room en favoritos.',
    )
  })

  it('removeFavorite calls supabase delete without throwing on success', async () => {
    mockFrom.mockImplementationOnce(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }))

    await expect(favoritesService.removeFavorite('user-1', 'room-1')).resolves.toBeUndefined()
  })

  it('removeFavorite throws when Supabase returns an error', async () => {
    mockFrom.mockImplementationOnce(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
      }),
    }))

    await expect(favoritesService.removeFavorite('user-1', 'room-1')).rejects.toThrow(
      'No se pudo quitar el room de favoritos.',
    )
  })

  it('getFavorites returns empty array when user has no favorites', async () => {
    setMockResult({ data: [], error: null })

    const results = await favoritesService.getFavorites('user-1')

    expect(results).toEqual([])
  })

  it('getFavorites throws when Supabase returns an error', async () => {
    setMockResult({ data: null, error: { message: 'DB error' } })

    await expect(favoritesService.getFavorites('user-1')).rejects.toThrow(
      'No se pudieron obtener los favoritos.',
    )
  })

  it('getFavorites returns only active and paused rooms (not deleted)', async () => {
    const activeFav = makeFavoriteRow({ roomId: 'r1', status: 'active' })
    const pausedFav = makeFavoriteRow({ roomId: 'r2', status: 'paused' })
    // Supabase with .in('rooms.status', ['active', 'paused']) would NOT return deleted rooms.
    // We simulate correct DB behavior by only returning active/paused rows.
    setMockResult({ data: [activeFav, pausedFav], error: null })

    const results = await favoritesService.getFavorites('user-1')

    expect(results).toHaveLength(2)
    expect(results.every((r) => r.id === 'r1' || r.id === 'r2')).toBe(true)
  })

  it('getFavorites maps room_images to main_image_url correctly (is_main = true)', async () => {
    const fav = makeFavoriteRow({
      roomId: 'r1',
      status: 'active',
      images: [
        { url: 'https://example.com/secondary.jpg', is_main: false },
        { url: 'https://example.com/main.jpg', is_main: true },
      ],
    })
    setMockResult({ data: [fav], error: null })

    const results = await favoritesService.getFavorites('user-1')

    expect(results[0].main_image_url).toBe('https://example.com/main.jpg')
  })

  it('getFavorites sets main_image_url to null when room has no images', async () => {
    const fav = makeFavoriteRow({ roomId: 'r1', status: 'active', images: [] })
    setMockResult({ data: [fav], error: null })

    const results = await favoritesService.getFavorites('user-1')

    expect(results[0].main_image_url).toBeNull()
  })

  it('getFavorites applies .in("rooms.status", ["active", "paused"]) filter', async () => {
    resetCapturedInCalls()
    setMockResult({ data: [], error: null })

    await favoritesService.getFavorites('user-1')

    const inCall = capturedInCalls.find(
      (c) =>
        c.column === 'rooms.status' &&
        Array.isArray(c.values) &&
        c.values.includes('active') &&
        c.values.includes('paused') &&
        !c.values.includes('deleted'),
    )
    expect(inCall).toBeDefined()
  })
})

// ─── Property 14: Favoritos filtran rooms eliminados ─────────────────────────

describe('Property 14: Favoritos filtran rooms eliminados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCapturedInCalls()
  })

  it(
    'Property 14: for any user with favorites containing rooms of mixed statuses, ' +
      'getFavorites SHALL apply .in("rooms.status", ["active", "paused"]) and ' +
      'SHALL NOT return rooms with status = "deleted"',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a userId
          fc.uuid(),
          // Generate a list of favorite rows with rooms of mixed statuses
          fc.array(
            fc.record({
              roomId: fc.uuid(),
              title: fc.string({ minLength: 5, maxLength: 50 }),
              price: fc.integer({ min: 100, max: 5000 }),
              city: fc.string({ minLength: 2, maxLength: 30 }),
              roomType: fc.constantFrom('private', 'shared' as RoomType),
              status: fc.constantFrom('active', 'paused', 'deleted' as RoomStatus),
              createdAt: fc
                .date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') })
                .map((d) => d.toISOString()),
            }),
            { minLength: 0, maxLength: 20 },
          ),
          async (userId, allFavorites) => {
            resetCapturedInCalls()

            // Supabase applies .in('rooms.status', ['active', 'paused']) server-side.
            // Simulate correct DB behavior: only return active/paused favorites.
            const visibleFavorites = allFavorites
              .filter((f) => f.status === 'active' || f.status === 'paused')
              .map((f) =>
                makeFavoriteRow({
                  roomId: f.roomId,
                  title: f.title,
                  price: f.price,
                  city: f.city,
                  roomType: f.roomType,
                  status: f.status,
                  createdAt: f.createdAt,
                  images: [{ url: 'https://example.com/img.jpg', is_main: true }],
                }),
              )

            setMockResult({ data: visibleFavorites, error: null })

            const results = await favoritesService.getFavorites(userId)

            // Property 14a: The service must have called .in('rooms.status', ['active', 'paused'])
            const inCall = capturedInCalls.find(
              (c) =>
                c.column === 'rooms.status' &&
                Array.isArray(c.values) &&
                c.values.includes('active') &&
                c.values.includes('paused'),
            )
            if (!inCall) return false

            // Property 14b: The filter must NOT include 'deleted'
            if (inCall.values.includes('deleted')) return false

            // Property 14c: All returned rooms must have status 'active' or 'paused'
            // (the service maps rooms from the Supabase response — if Supabase filters correctly,
            // the output will only contain active/paused rooms)
            for (const card of results) {
              // Verify the card has all required RoomCard fields
              if (typeof card.id !== 'string' || card.id === '') return false
              if (typeof card.title !== 'string' || card.title === '') return false
              if (typeof card.price !== 'number') return false
              if (typeof card.city !== 'string' || card.city === '') return false
              if (card.room_type !== 'private' && card.room_type !== 'shared') return false
              if (typeof card.created_at !== 'string' || card.created_at === '') return false
              if (card.main_image_url !== null && typeof card.main_image_url !== 'string')
                return false
            }

            // Property 14d: The count of returned rooms matches the active/paused subset
            if (results.length !== visibleFavorites.length) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 14 (deleted rooms never appear): when Supabase correctly filters, ' +
      'no room with status = "deleted" SHALL appear in the getFavorites output',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          // Generate at least one favorite with mixed statuses
          fc.array(
            fc.record({
              roomId: fc.uuid(),
              title: fc.string({ minLength: 5, maxLength: 50 }),
              price: fc.integer({ min: 100, max: 5000 }),
              city: fc.string({ minLength: 2, maxLength: 30 }),
              roomType: fc.constantFrom('private', 'shared' as RoomType),
              status: fc.constantFrom('active', 'paused', 'deleted' as RoomStatus),
              createdAt: fc
                .date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') })
                .map((d) => d.toISOString()),
            }),
            { minLength: 1, maxLength: 15 },
          ),
          async (userId, allFavorites) => {
            resetCapturedInCalls()

            // Simulate Supabase filtering: only active/paused rows are returned
            const filteredFavorites = allFavorites
              .filter((f) => f.status !== 'deleted')
              .map((f) =>
                makeFavoriteRow({
                  roomId: f.roomId,
                  title: f.title,
                  price: f.price,
                  city: f.city,
                  roomType: f.roomType,
                  status: f.status,
                  createdAt: f.createdAt,
                  images: [],
                }),
              )

            setMockResult({ data: filteredFavorites, error: null })

            const results = await favoritesService.getFavorites(userId)

            // The result count must equal the non-deleted favorites count
            return results.length === filteredFavorites.length
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 15: Idempotencia al guardar favorito duplicado ─────────────────
// Feature: roomie-connect, Property 15: Idempotencia al guardar favorito duplicado

/**
 * Validates: Requirements 9.4
 *
 * Property 15: For any authenticated user who already has a room in their favorites,
 * attempting to add it again SHALL leave the favorites list unchanged (no duplicates)
 * and SHALL complete without returning an error to the user.
 *
 * The favoritesService uses:
 *   supabase.from('favorites').upsert({ user_id, room_id }, { onConflict: 'user_id,room_id' })
 *
 * We verify:
 *   1. Calling `addFavorite` twice with the same (userId, roomId) does NOT throw an error.
 *   2. The service uses `upsert` (not `insert`) so duplicates are handled silently at the DB level.
 *   3. Both calls resolve successfully regardless of the order or number of repetitions.
 */

describe('Property 15: Idempotencia al guardar favorito duplicado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCapturedInCalls()
  })

  it(
    'Property 15: calling addFavorite twice with the same (userId, roomId) ' +
      'SHALL NOT throw an error on either call',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a userId and roomId pair
          fc.uuid(),
          fc.uuid(),
          async (userId, roomId) => {
            // Both calls should succeed — upsert handles the duplicate silently
            const upsertMock = vi.fn().mockResolvedValue({ error: null })
            mockFrom.mockImplementation(() => ({
              upsert: upsertMock,
            }))

            // First call: add the favorite
            await expect(favoritesService.addFavorite(userId, roomId)).resolves.toBeUndefined()

            // Second call: add the same favorite again — must NOT throw
            await expect(favoritesService.addFavorite(userId, roomId)).resolves.toBeUndefined()

            // The upsert must have been called exactly twice (once per addFavorite call)
            expect(upsertMock).toHaveBeenCalledTimes(2)

            // Both calls must have used the same (userId, roomId) payload
            for (const call of upsertMock.mock.calls) {
              const payload = call[0] as { user_id: string; room_id: string }
              if (payload.user_id !== userId || payload.room_id !== roomId) return false
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 15 (upsert strategy): addFavorite SHALL use upsert with onConflict ' +
      'so that duplicate favorites are silently ignored at the database level',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (userId, roomId) => {
            const upsertMock = vi.fn().mockResolvedValue({ error: null })
            mockFrom.mockImplementation(() => ({
              upsert: upsertMock,
            }))

            await favoritesService.addFavorite(userId, roomId)

            // The service must call upsert (not insert) to handle duplicates silently
            expect(upsertMock).toHaveBeenCalledTimes(1)

            // The upsert must include the onConflict option targeting 'user_id,room_id'
            const [payload, options] = upsertMock.mock.calls[0] as [
              { user_id: string; room_id: string },
              { onConflict: string },
            ]

            if (payload.user_id !== userId || payload.room_id !== roomId) return false
            if (!options || options.onConflict !== 'user_id,room_id') return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
