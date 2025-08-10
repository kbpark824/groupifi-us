export interface User {
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

export interface GroupingSession {
  id: string
  user_id: string
  saved_group_id: string | null
  participants: string[]
  groups: string[][]
  created_at: string
}

export interface GroupGenerationOptions {
  participants: string[]
  groupSizeType: 'fixed' | 'target'
  groupSize: number
  constraints?: Constraint[]
  avoidRecentPairings?: boolean
}

export interface Group {
  id: string
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
  }
}