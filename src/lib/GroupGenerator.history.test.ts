import { describe, it, expect } from 'vitest'
import { GroupGenerator } from './GroupGenerator'
import type { GroupingSession } from '../types'

describe('GroupGenerator - Historical Tracking', () => {
  const generator = new GroupGenerator()

  it('should avoid recent pairings when historical sessions are provided', () => {
    const participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']
    
    // Create a mock historical session where Alice and Bob were together
    const historicalSessions: GroupingSession[] = [
      {
        id: 'session-1',
        user_id: 'user-1',
        saved_group_id: 'group-1',
        participants: participants,
        groups: [
          ['Alice', 'Bob', 'Charlie'],
          ['David', 'Eve', 'Frank']
        ],
        created_at: new Date().toISOString()
      }
    ]

    // Generate groups multiple times and check if Alice and Bob are avoided
    let aliceAndBobTogether = 0
    let totalHistoryConflictsAvoided = 0
    const attempts = 50

    for (let i = 0; i < attempts; i++) {
      const result = generator.generateGroups({
        participants,
        groupSizeType: 'fixed',
        groupSize: 3,
        historicalSessions,
        avoidRecentPairings: true
      })

      // Check if Alice and Bob are in the same group
      const aliceGroup = result.groups.find(group => group.members.includes('Alice'))
      if (aliceGroup && aliceGroup.members.includes('Bob')) {
        aliceAndBobTogether++
      }

      // Track history conflicts avoided
      if (result.metadata.historyConflictsAvoided) {
        totalHistoryConflictsAvoided += result.metadata.historyConflictsAvoided
      }
    }

    // Alice and Bob should be together less often when avoiding recent pairings
    // With random distribution, they would be together about 40% of the time (2/5 chance)
    // With avoidance, it should be significantly less
    expect(aliceAndBobTogether).toBeLessThan(attempts * 0.5) // Less than 50%
    
    // We should have some history conflicts avoided across all attempts
    expect(totalHistoryConflictsAvoided).toBeGreaterThan(0)
  })

  it('should include historyConflictsAvoided in metadata when avoiding pairings', () => {
    const participants = ['Alice', 'Bob', 'Charlie', 'David']
    
    const historicalSessions: GroupingSession[] = [
      {
        id: 'session-1',
        user_id: 'user-1',
        saved_group_id: 'group-1',
        participants: participants,
        groups: [
          ['Alice', 'Bob'],
          ['Charlie', 'David']
        ],
        created_at: new Date().toISOString()
      }
    ]

    const result = generator.generateGroups({
      participants,
      groupSizeType: 'fixed',
      groupSize: 2,
      historicalSessions,
      avoidRecentPairings: true
    })

    expect(result.metadata.historyConflictsAvoided).toBeDefined()
    expect(typeof result.metadata.historyConflictsAvoided).toBe('number')
  })

  it('should work normally when no historical sessions are provided', () => {
    const participants = ['Alice', 'Bob', 'Charlie', 'David']

    const result = generator.generateGroups({
      participants,
      groupSizeType: 'fixed',
      groupSize: 2,
      avoidRecentPairings: true // This should be ignored when no history
    })

    expect(result.groups).toHaveLength(2)
    expect(result.metadata.historyConflictsAvoided).toBeUndefined()
  })

  it('should handle empty historical sessions gracefully', () => {
    const participants = ['Alice', 'Bob', 'Charlie', 'David']

    const result = generator.generateGroups({
      participants,
      groupSizeType: 'fixed',
      groupSize: 2,
      historicalSessions: [],
      avoidRecentPairings: true
    })

    expect(result.groups).toHaveLength(2)
    expect(result.metadata.historyConflictsAvoided).toBeUndefined()
  })

  it('should prioritize hard constraints over history avoidance', () => {
    const participants = ['Alice', 'Bob', 'Charlie', 'David']
    
    // Historical session where Alice and Bob were together
    const historicalSessions: GroupingSession[] = [
      {
        id: 'session-1',
        user_id: 'user-1',
        saved_group_id: 'group-1',
        participants: participants,
        groups: [
          ['Alice', 'Bob'],
          ['Charlie', 'David']
        ],
        created_at: new Date().toISOString()
      }
    ]

    // Hard constraint that Alice and Bob must be together
    const constraints = [
      {
        id: 'constraint-1',
        user_id: 'user-1',
        saved_group_id: 'group-1',
        type: 'together' as const,
        strength: 'hard' as const,
        participants: ['Alice', 'Bob'],
        created_at: new Date().toISOString()
      }
    ]

    const result = generator.generateGroups({
      participants,
      groupSizeType: 'fixed',
      groupSize: 2,
      constraints,
      historicalSessions,
      avoidRecentPairings: true
    })

    // Alice and Bob should still be together due to hard constraint
    const aliceGroup = result.groups.find(group => group.members.includes('Alice'))
    expect(aliceGroup?.members).toContain('Bob')
  })
})