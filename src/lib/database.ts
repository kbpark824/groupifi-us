/**
 * Database utility functions for Groupifi Us
 * 
 * This module provides type-safe database operations for the core entities:
 * - SavedGroups
 * - Constraints  
 * - GroupingSessions
 */

import { supabase } from './supabase'
import type { Database } from '../types/database'

// Type aliases for better readability
type SavedGroup = Database['public']['Tables']['saved_groups']['Row']
type SavedGroupInsert = Database['public']['Tables']['saved_groups']['Insert']
type SavedGroupUpdate = Database['public']['Tables']['saved_groups']['Update']

type Constraint = Database['public']['Tables']['constraints']['Row']
type ConstraintInsert = Database['public']['Tables']['constraints']['Insert']
type ConstraintUpdate = Database['public']['Tables']['constraints']['Update']

type GroupingSession = Database['public']['Tables']['grouping_sessions']['Row']
type GroupingSessionInsert = Database['public']['Tables']['grouping_sessions']['Insert']

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
    const { data, error } = await supabase
      .from('saved_groups')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get a specific saved group by ID
   */
  async getById(id: string): Promise<SavedGroup | null> {
    const { data, error } = await supabase
      .from('saved_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  /**
   * Create a new saved group
   */
  async create(group: Omit<SavedGroupInsert, 'user_id'>): Promise<SavedGroup> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('saved_groups')
      .insert({ ...group, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update an existing saved group
   */
  async update(id: string, updates: SavedGroupUpdate): Promise<SavedGroup> {
    const { data, error } = await supabase
      .from('saved_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a saved group (cascades to constraints and sessions)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_groups')
      .delete()
      .eq('id', id)

    if (error) throw error
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
    const { data, error } = await supabase
      .from('constraints')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new constraint
   */
  async create(constraint: ConstraintInsert): Promise<Constraint> {
    const { data, error } = await supabase
      .from('constraints')
      .insert(constraint)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update an existing constraint
   */
  async update(id: string, updates: ConstraintUpdate): Promise<Constraint> {
    const { data, error } = await supabase
      .from('constraints')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a constraint
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('constraints')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Delete all constraints for a group
   */
  async deleteByGroupId(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('constraints')
      .delete()
      .eq('group_id', groupId)

    if (error) throw error
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
    const { data, error } = await supabase
      .from('grouping_sessions')
      .select('*')
      .eq('group_id', groupId)
      .order('session_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Get the most recent session for a group
   */
  async getLatestByGroupId(groupId: string): Promise<GroupingSession | null> {
    const { data, error } = await supabase
      .from('grouping_sessions')
      .select('*')
      .eq('group_id', groupId)
      .order('session_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  /**
   * Create a new grouping session
   */
  async create(session: GroupingSessionInsert): Promise<GroupingSession> {
    const { data, error } = await supabase
      .from('grouping_sessions')
      .insert(session)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete old sessions (keep only the most recent N sessions)
   */
  async cleanupOldSessions(groupId: string, keepCount = 10): Promise<void> {
    // Get sessions to delete (all except the most recent keepCount)
    const { data: sessionsToDelete, error: selectError } = await supabase
      .from('grouping_sessions')
      .select('id')
      .eq('group_id', groupId)
      .order('session_date', { ascending: false })
      .range(keepCount, 1000) // Skip first keepCount, get the rest

    if (selectError) throw selectError

    if (sessionsToDelete && sessionsToDelete.length > 0) {
      const idsToDelete = sessionsToDelete.map(session => session.id)
      const { error: deleteError } = await supabase
        .from('grouping_sessions')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) throw deleteError
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('saved_groups')
      .select('id')
      .eq('id', groupId)
      .eq('user_id', user.id)
      .single()

    if (error) return false
    return !!data
  },

  /**
   * Get database connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_groups')
        .select('id')
        .limit(1)

      return !error
    } catch {
      return false
    }
  }
}

// Export types for use in other modules
export type {
  SavedGroup,
  SavedGroupInsert,
  SavedGroupUpdate,
  Constraint,
  ConstraintInsert,
  ConstraintUpdate,
  GroupingSession,
  GroupingSessionInsert
}