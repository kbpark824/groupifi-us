import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authHelpers } from './auth'

// Mock PocketBase
vi.mock('./pocketbase', () => ({
  pb: {
    authStore: {
      model: null,
      isValid: false,
      clear: vi.fn(),
      onChange: vi.fn(() => vi.fn()), // Return unsubscribe function
    },
    collection: vi.fn(() => ({
      create: vi.fn(),
      authWithPassword: vi.fn(),
      authWithOAuth2Code: vi.fn(),
      listAuthMethods: vi.fn(),
      requestVerification: vi.fn(),
      requestPasswordReset: vi.fn(),
      update: vi.fn(),
      authRefresh: vi.fn(),
    }))
  }
}))

describe('authHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isAuthenticated', () => {
    it('should return true when auth store is valid', async () => {
      const { pb } = await import('./pocketbase')
      pb.authStore.isValid = true
      expect(authHelpers.isAuthenticated()).toBe(true)
    })

    it('should return false when auth store is invalid', async () => {
      const { pb } = await import('./pocketbase')
      pb.authStore.isValid = false
      expect(authHelpers.isAuthenticated()).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user from auth store', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const { pb } = await import('./pocketbase')
      pb.authStore.model = mockUser
      expect(authHelpers.getCurrentUser()).toBe(mockUser)
    })

    it('should return null when no user in auth store', async () => {
      const { pb } = await import('./pocketbase')
      pb.authStore.model = null
      expect(authHelpers.getCurrentUser()).toBe(null)
    })
  })

  describe('getUserId', () => {
    it('should return user ID from auth store', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const { pb } = await import('./pocketbase')
      pb.authStore.model = mockUser
      expect(authHelpers.getUserId()).toBe('123')
    })

    it('should return null when no user in auth store', async () => {
      const { pb } = await import('./pocketbase')
      pb.authStore.model = null
      expect(authHelpers.getUserId()).toBe(null)
    })
  })

  describe('getUserEmail', () => {
    it('should return user email from auth store', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const { pb } = await import('./pocketbase')
      pb.authStore.model = mockUser
      expect(authHelpers.getUserEmail()).toBe('test@example.com')
    })

    it('should return null when no user in auth store', async () => {
      const { pb } = await import('./pocketbase')
      pb.authStore.model = null
      expect(authHelpers.getUserEmail()).toBe(null)
    })
  })
})