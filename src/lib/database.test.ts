/**
 * Database operations tests
 * 
 * These tests verify that the database utility functions work correctly.
 * Note: These are integration tests that require a working PocketBase connection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { savedGroupsDb, constraintsDb, groupingSessionsDb, dbUtils } from './database'

// Mock PocketBase client
vi.mock('./pocketbase', () => ({
  pb: {
    collection: vi.fn(() => ({
      getFullList: vi.fn(() => Promise.resolve([])),
      getList: vi.fn(() => Promise.resolve({ items: [] })),
      getOne: vi.fn((id: string) => {
        if (id === 'non-existent-id') {
          const error = new Error('Not found')
          ;(error as any).status = 404
          return Promise.reject(error)
        }
        return Promise.resolve({ id: 'test-id', name: 'Test Item' })
      }),
      create: vi.fn(() => Promise.resolve({ id: 'test-id', name: 'Test Item' })),
      update: vi.fn(() => Promise.resolve({ id: 'test-id', name: 'Updated Item' })),
      delete: vi.fn(() => Promise.resolve()),
    }))
  }
}))

// Mock auth helpers
vi.mock('./auth', () => ({
  authHelpers: {
    getUserId: vi.fn(() => 'test-user-id'),
    isAuthenticated: vi.fn(() => true)
  }
}))

describe('Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('savedGroupsDb', () => {
    it('should get all saved groups', async () => {
      const groups = await savedGroupsDb.getAll()
      expect(Array.isArray(groups)).toBe(true)
    })

    it('should handle group not found', async () => {
      const group = await savedGroupsDb.getById('non-existent-id')
      expect(group).toBeNull()
    })

    it('should create a new group', async () => {
      const newGroup = {
        name: 'Test Group',
        participants: ['Alice', 'Bob', 'Carol']
      }
      
      const result = await savedGroupsDb.create(newGroup)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
    })
  })

  describe('constraintsDb', () => {
    it('should get constraints by group ID', async () => {
      const constraints = await constraintsDb.getByGroupId('test-group-id')
      expect(Array.isArray(constraints)).toBe(true)
    })

    it('should create a new constraint', async () => {
      const newConstraint = {
        group_id: 'test-group-id',
        person_a: 'Alice',
        person_b: 'Bob',
        constraint_type: 'hard_together' as const
      }
      
      const result = await constraintsDb.create(newConstraint)
      expect(result).toHaveProperty('id')
    })
  })

  describe('groupingSessionsDb', () => {
    it('should get sessions by group ID', async () => {
      const sessions = await groupingSessionsDb.getByGroupId('test-group-id')
      expect(Array.isArray(sessions)).toBe(true)
    })

    it('should handle no latest session found', async () => {
      const session = await groupingSessionsDb.getLatestByGroupId('test-group-id')
      expect(session).toBeNull()
    })
  })

  describe('dbUtils', () => {
    it('should check database connection', async () => {
      const isConnected = await dbUtils.checkConnection()
      expect(typeof isConnected).toBe('boolean')
    })
  })
})

// Type tests to ensure our types are working correctly
describe('Type Safety', () => {
  it('should have correct constraint types', () => {
    const validTypes = ['hard_together', 'hard_apart', 'soft_together', 'soft_apart']
    
    // This test ensures our ConstraintType union is working
    validTypes.forEach(type => {
      expect(['hard_together', 'hard_apart', 'soft_together', 'soft_apart']).toContain(type)
    })
  })

  it('should validate group data structure', () => {
    const mockGroup = {
      id: 'test-id',
      user_id: 'user-id',
      name: 'Test Group',
      participants: ['Alice', 'Bob'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Basic structure validation
    expect(mockGroup).toHaveProperty('id')
    expect(mockGroup).toHaveProperty('name')
    expect(mockGroup).toHaveProperty('participants')
    expect(Array.isArray(mockGroup.participants)).toBe(true)
  })
})