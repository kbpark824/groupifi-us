/**
 * Database utility functions for Groupifi Us
 * 
 * This module provides type-safe database operations for the core entities:
 * - SavedGroups
 * - Constraints  
 * - GroupingSessions
 */

import { pb } from './pocketbase'
import { authHelpers } from './auth'
import type { RecordModel } from 'pocketbase'

// Type definitions for PocketBase collections
export interface SavedGroup extends RecordModel {
  user_id: string
  name: string
  participants: string[]
}

export interface Constraint extends RecordModel {
  group_id: string
  person_a: string
  person_b: string
  constraint_type: ConstraintType
}

export interface GroupingSession extends RecordModel {
  group_id: string
  session_date: string
  groups_data: any[]
  participants_count: number
}

// Constraint types for better type safety
export type ConstraintType = 'hard_together' | 'hard_apart' | 'soft_together' | 'soft_apart'

/**
 * SavedGroups operations
 */
export const savedGroupsDb = {
  /**
   * Get all saved groups for the current user
   */
  async getAll(): Promise<SavedGroup[]> {
    try {
      const userId = authHelpers.getUserId()
      if (!userId) throw new Error('User not authenticated')

      const records = await pb.collection('saved_groups').getFullList({
        filter: `user_id = "${userId}"`,
        sort: '-updated'
      })

      return records as SavedGroup[]
    } catch (error) {
      console.error('Error fetching saved groups:', error)
      throw error
    }
  },

  /**
   * Get a specific saved group by ID
   */
  async getById(id: string): Promise<SavedGroup | null> {
    try {
      const record = await pb.collection('saved_groups').getOne(id)
      return record as SavedGroup
    } catch (error: any) {
      if (error.status === 404) return null
      throw error
    }
  },

  /**
   * Create a new saved group
   */
  async create(group: Omit<SavedGroup, 'id' | 'created' | 'updated' | 'user_id'>): Promise<SavedGroup> {
    try {
      const userId = authHelpers.getUserId()
      if (!userId) throw new Error('User not authenticated')

      const record = await pb.collection('saved_groups').create({
        ...group,
        user_id: userId
      })

      return record as SavedGroup
    } catch (error) {
      console.error('Error creating saved group:', error)
      throw error
    }
  },

  /**
   * Update an existing saved group
   */
  async update(id: string, updates: Partial<SavedGroup>): Promise<SavedGroup> {
    try {
      const record = await pb.collection('saved_groups').update(id, updates)
      return record as SavedGroup
    } catch (error) {
      console.error('Error updating saved group:', error)
      throw error
    }
  },

  /**
   * Delete a saved group (cascades to constraints and sessions)
   */
  async delete(id: string): Promise<void> {
    try {
      await pb.collection('saved_groups').delete(id)
    } catch (error) {
      console.error('Error deleting saved group:', error)
      throw error
    }
  }
}

/**
 * Constraints operations
 */
export const constraintsDb = {
  /**
   * Get all constraints for a specific group
   */
  async getByGroupId(groupId: string): Promise<Constraint[]> {
    try {
      const records = await pb.collection('constraints').getFullList({
        filter: `group_id = "${groupId}"`,
        sort: 'created'
      })

      return records as Constraint[]
    } catch (error) {
      console.error('Error fetching constraints:', error)
      throw error
    }
  },

  /**
   * Create a new constraint
   */
  async create(constraint: Omit<Constraint, 'id' | 'created' | 'updated'>): Promise<Constraint> {
    try {
      const record = await pb.collection('constraints').create(constraint)
      return record as Constraint
    } catch (error) {
      console.error('Error creating constraint:', error)
      throw error
    }
  },

  /**
   * Update an existing constraint
   */
  async update(id: string, updates: Partial<Constraint>): Promise<Constraint> {
    try {
      const record = await pb.collection('constraints').update(id, updates)
      return record as Constraint
    } catch (error) {
      console.error('Error updating constraint:', error)
      throw error
    }
  },

  /**
   * Delete a constraint
   */
  async delete(id: string): Promise<void> {
    try {
      await pb.collection('constraints').delete(id)
    } catch (error) {
      console.error('Error deleting constraint:', error)
      throw error
    }
  },

  /**
   * Delete all constraints for a group
   */
  async deleteByGroupId(groupId: string): Promise<void> {
    try {
      const constraints = await this.getByGroupId(groupId)
      for (const constraint of constraints) {
        await pb.collection('constraints').delete(constraint.id)
      }
    } catch (error) {
      console.error('Error deleting constraints by group ID:', error)
      throw error
    }
  }
}

/**
 * GroupingSessions operations
 */
export const groupingSessionsDb = {
  /**
   * Get all sessions for a specific group
   */
  async getByGroupId(groupId: string, limit = 10): Promise<GroupingSession[]> {
    try {
      const records = await pb.collection('grouping_sessions').getList(1, limit, {
        filter: `group_id = "${groupId}"`,
        sort: '-session_date'
      })

      return records.items as GroupingSession[]
    } catch (error) {
      console.error('Error fetching grouping sessions:', error)
      throw error
    }
  },

  /**
   * Get the most recent session for a group
   */
  async getLatestByGroupId(groupId: string): Promise<GroupingSession | null> {
    try {
      const records = await pb.collection('grouping_sessions').getList(1, 1, {
        filter: `group_id = "${groupId}"`,
        sort: '-session_date'
      })

      return records.items.length > 0 ? records.items[0] as GroupingSession : null
    } catch (error: any) {
      if (error.status === 404) return null
      console.error('Error fetching latest grouping session:', error)
      throw error
    }
  },

  /**
   * Create a new grouping session from group generation result
   */
  async create(session: Omit<GroupingSession, 'id' | 'created' | 'updated'>): Promise<GroupingSession> {
    try {
      const record = await pb.collection('grouping_sessions').create(session)
      return record as GroupingSession
    } catch (error) {
      console.error('Error creating grouping session:', error)
      throw error
    }
  },

  /**
   * Save a group generation result as a new session
   */
  async saveGenerationResult(groupId: string, result: import('../types').GroupGenerationResult): Promise<GroupingSession> {
    const sessionData = {
      group_id: groupId,
      groups_data: result.groups, // Store the full Group objects
      participants_count: result.metadata.totalParticipants,
      session_date: new Date().toISOString()
    }

    return this.create(sessionData)
  },

  /**
   * Delete old sessions (keep only the most recent N sessions)
   */
  async cleanupOldSessions(groupId: string, keepCount = 10): Promise<void> {
    try {
      // Get all sessions for the group
      const allSessions = await pb.collection('grouping_sessions').getFullList({
        filter: `group_id = "${groupId}"`,
        sort: '-session_date'
      })

      // Delete sessions beyond the keep count
      if (allSessions.length > keepCount) {
        const sessionsToDelete = allSessions.slice(keepCount)
        for (const session of sessionsToDelete) {
          await pb.collection('grouping_sessions').delete(session.id)
        }
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error)
      throw error
    }
  }
}

/**
 * Utility functions
 */
export const dbUtils = {
  /**
   * Check if the current user owns a specific group
   */
  async userOwnsGroup(groupId: string): Promise<boolean> {
    try {
      const userId = authHelpers.getUserId()
      if (!userId) return false

      const record = await pb.collection('saved_groups').getOne(groupId)
      return record.user_id === userId
    } catch {
      return false
    }
  },

  /**
   * Get database connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      await pb.collection('saved_groups').getList(1, 1)
      return true
    } catch {
      return false
    }
  }
}