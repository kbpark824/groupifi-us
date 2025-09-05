// Re-export PocketBase types for convenience
export type { RecordModel } from 'pocketbase'

// Legacy User interface (kept for backward compatibility)
export interface UserProfile {
  id: string
  email: string
  created_at: string
}

export interface SavedGroup {
  id: string
  user_id: string
  name: string
  participants: string[]
  created_at: string
  updated_at: string
}

export interface Constraint {
  id: string
  user_id: string
  saved_group_id: string
  type: 'together' | 'apart'
  strength: 'hard' | 'soft'
  participants: string[]
  created_at: string
}

// Database constraint format (from PocketBase)
export interface DbConstraint {
  id: string
  user_id?: string
  group_id?: string
  saved_group_id?: string
  person_a: string
  person_b: string
  constraint_type: 'hard_together' | 'hard_apart' | 'soft_together' | 'soft_apart'
  created_at: string
}

export interface GroupingSession {
  id: string
  user_id: string
  saved_group_id: string | null
  participants: string[]
  groups: string[][]
  created_at: string
}

// Database format for grouping sessions (matches database schema)
export interface DbGroupingSession {
  id: string
  group_id: string
  session_date: string
  groups_data: Group[] | string[][]  // Can be either format
  participants_count: number
}

export interface GroupGenerationOptions {
  participants: string[]
  groupSizeType: 'fixed' | 'target'
  groupSize: number
  constraints?: Constraint[]
  dbConstraints?: DbConstraint[]
  historicalSessions?: GroupingSession[]
  avoidRecentPairings?: boolean
}

export interface Group {
  id: string
  name?: string
  members: string[]
  size: number
}

export interface GroupGenerationResult {
  groups: Group[]
  metadata: {
    totalParticipants: number
    groupCount: number
    averageGroupSize: number
    sizeVariation: number
    constraintsApplied?: number
    constraintsViolated?: number
    impossibleConstraints?: string[]
    historyConflictsAvoided?: number
  }
  warnings?: string[]
  errors?: string[]
}