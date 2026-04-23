// Feature: roomie-connect, Property 20: Redirección post-login basada en rol

/**
 * Validates: Requirements 2.2, 12.5
 *
 * Property 20: Post-login role-based redirection
 *
 * - For any user with role = 'admin', the system SHALL redirect to /admin
 *   after a successful login.
 * - For any user with role = 'user', the system SHALL redirect to / after
 *   a successful login.
 * - A user with role = 'user' SHALL NEVER be redirected to /admin.
 *
 * The useLogin hook (src/hooks/useAuth.ts) implements this logic:
 *   1. Calls authService.login(params) → returns { user: { id } }
 *   2. Invalidates the 'session' query cache
 *   3. Calls profileService.getProfile(userId) → returns UserProfile with role
 *   4. Navigates to '/admin' if role === 'admin', else navigates to '/'
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// ─── Hoisted mock variables ───────────────────────────────────────────────────
// vi.hoisted ensures these are available when vi.mock factories run (which are
// hoisted to the top of the file by Vitest's transform).

const { mockNavigate, mockInvalidateQueries, mockAuthLogin, mockGetProfile } = vi.hoisted(() => {
  const mockNavigate = vi.fn()
  const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined)
  const mockAuthLogin = vi.fn()
  const mockGetProfile = vi.fn()
  return { mockNavigate, mockInvalidateQueries, mockAuthLogin, mockGetProfile }
})

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: {
    mutationFn: (params: unknown) => Promise<unknown>
    onSuccess?: (data: unknown) => Promise<void> | void
  }) => ({
    mutateAsync: async (params: unknown) => {
      const data = await options.mutationFn(params)
      if (options.onSuccess) {
        await options.onSuccess(data)
      }
      return data
    },
    mutate: async (params: unknown) => {
      const data = await options.mutationFn(params)
      if (options.onSuccess) {
        await options.onSuccess(data)
      }
      return data
    },
  }),
  useQuery: vi.fn(),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    clear: vi.fn(),
  }),
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: mockAuthLogin,
    logout: vi.fn(),
    register: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    getSession: vi.fn(),
  },
}))

vi.mock('@/services/profile.service', () => ({
  profileService: {
    getProfile: mockGetProfile,
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
  },
}))

// Import the hook AFTER all mocks are set up
import { useLogin } from '../useAuth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Builds a minimal UserProfile for a given role. */
function buildProfile(userId: string, role: 'admin' | 'user') {
  return {
    id: userId,
    username: 'testuser',
    bio: null,
    phone: null,
    avatar_url: null,
    role,
    created_at: '2024-01-01T00:00:00Z',
  }
}

/** Builds a minimal Supabase auth response for a given userId. */
function buildAuthResponse(userId: string) {
  return {
    user: { id: userId },
    session: { access_token: 'token', refresh_token: 'refresh' },
  }
}

/**
 * Invokes the useLogin hook's mutation logic directly (without React rendering).
 * The hook is a plain function that returns a mutation object; we call it
 * outside a component because all its dependencies (useNavigate, useQueryClient)
 * are mocked at the module level.
 */
async function invokeLogin(userId: string, role: 'admin' | 'user') {
  mockAuthLogin.mockResolvedValue(buildAuthResponse(userId))
  mockGetProfile.mockResolvedValue(buildProfile(userId, role))

  const mutation = useLogin()
  await mutation.mutateAsync({ email: 'test@example.com', password: 'password123' })
}

// ─── Unit examples ────────────────────────────────────────────────────────────

describe('useLogin — unit examples for post-login redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvalidateQueries.mockResolvedValue(undefined)
  })

  it('redirects admin user to /admin after successful login', async () => {
    await invokeLogin('admin-user-id', 'admin')
    expect(mockNavigate).toHaveBeenCalledWith('/admin')
    expect(mockNavigate).not.toHaveBeenCalledWith('/')
  })

  it('redirects regular user to / after successful login', async () => {
    await invokeLogin('regular-user-id', 'user')
    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(mockNavigate).not.toHaveBeenCalledWith('/admin')
  })

  it('calls profileService.getProfile with the userId from auth response', async () => {
    const userId = 'specific-user-id-123'
    await invokeLogin(userId, 'user')
    expect(mockGetProfile).toHaveBeenCalledWith(userId)
  })

  it('invalidates the session query after login', async () => {
    await invokeLogin('some-user-id', 'user')
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['session'] })
  })

  it('does not navigate if user id is missing from auth response', async () => {
    mockAuthLogin.mockResolvedValue({ user: null, session: null })
    const mutation = useLogin()
    await mutation.mutateAsync({ email: 'test@example.com', password: 'password123' })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ─── Property 20: Redirección post-login basada en rol ────────────────────────

describe('Property 20: Redirección post-login basada en rol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvalidateQueries.mockResolvedValue(undefined)
  })

  it(
    'Property 20a: For any admin user, login SHALL redirect to /admin',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          async (userId, credentials) => {
            vi.clearAllMocks()
            mockInvalidateQueries.mockResolvedValue(undefined)

            mockAuthLogin.mockResolvedValue(buildAuthResponse(userId))
            mockGetProfile.mockResolvedValue(buildProfile(userId, 'admin'))

            const mutation = useLogin()
            await mutation.mutateAsync(credentials)

            const calls = mockNavigate.mock.calls
            return calls.length === 1 && calls[0][0] === '/admin'
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 20b: For any regular user, login SHALL redirect to /',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          async (userId, credentials) => {
            vi.clearAllMocks()
            mockInvalidateQueries.mockResolvedValue(undefined)

            mockAuthLogin.mockResolvedValue(buildAuthResponse(userId))
            mockGetProfile.mockResolvedValue(buildProfile(userId, 'user'))

            const mutation = useLogin()
            await mutation.mutateAsync(credentials)

            const calls = mockNavigate.mock.calls
            return calls.length === 1 && calls[0][0] === '/'
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 20c: A user with role = "user" SHALL NEVER be redirected to /admin',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          async (userId, credentials) => {
            vi.clearAllMocks()
            mockInvalidateQueries.mockResolvedValue(undefined)

            mockAuthLogin.mockResolvedValue(buildAuthResponse(userId))
            mockGetProfile.mockResolvedValue(buildProfile(userId, 'user'))

            const mutation = useLogin()
            await mutation.mutateAsync(credentials)

            const navigatedToAdmin = mockNavigate.mock.calls.some(
              (call) => call[0] === '/admin',
            )
            return !navigatedToAdmin
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Property 20d: For any user, the navigation target is determined solely by role',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom<'admin' | 'user'>('admin', 'user'),
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          async (userId, role, credentials) => {
            vi.clearAllMocks()
            mockInvalidateQueries.mockResolvedValue(undefined)

            mockAuthLogin.mockResolvedValue(buildAuthResponse(userId))
            mockGetProfile.mockResolvedValue(buildProfile(userId, role))

            const mutation = useLogin()
            await mutation.mutateAsync(credentials)

            const calls = mockNavigate.mock.calls
            if (calls.length !== 1) return false

            const destination = calls[0][0]
            if (role === 'admin') return destination === '/admin'
            if (role === 'user') return destination === '/'
            return false
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
