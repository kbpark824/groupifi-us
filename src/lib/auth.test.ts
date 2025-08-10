import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authHelpers } from './auth'

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    }
  }
}))

describe('authHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isAuthenticated', () => {
    it('should return true when user is provided', () => {
      const mockUser = { id: '123', email: 'test@example.com' } as any
      expect(authHelpers.isAuthenticated(mockUser)).toBe(true)
    })

    it('should return false when user is null', () => {
      expect(authHelpers.isAuthenticated(null)).toBe(false)
    })
  })

  describe('getUserId', () => {
    it('should return user ID when user is provided', () => {
      const mockUser = { id: '123', email: 'test@example.com' } as any
      expect(authHelpers.getUserId(mockUser)).toBe('123')
    })

    it('should return null when user is null', () => {
      expect(authHelpers.getUserId(null)).toBe(null)
    })
  })

  describe('getUserEmail', () => {
    it('should return user email when user is provided', () => {
      const mockUser = { id: '123', email: 'test@example.com' } as any
      expect(authHelpers.getUserEmail(mockUser)).toBe('test@example.com')
    })

    it('should return null when user is null', () => {
      expect(authHelpers.getUserEmail(null)).toBe(null)
    })
  })
})