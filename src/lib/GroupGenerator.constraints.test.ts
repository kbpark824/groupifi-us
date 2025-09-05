import { GroupGenerator } from './GroupGenerator'
import type { Constraint, GroupGenerationOptions, DbConstraint } from '../types'

describe('GroupGenerator - Constraint Processing', () => {
  let generator: GroupGenerator

  beforeEach(() => {
    generator = new GroupGenerator()
  })

  describe('Hard Constraints', () => {
    it('should enforce hard together constraints', () => {
      const participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'together',
          strength: 'hard',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 3,
        constraints
      }

      const result = generator.generateGroups(options)

      // Alice and Bob should be in the same group
      const aliceGroup = result.groups.find(g => g.members.includes('Alice'))
      const bobGroup = result.groups.find(g => g.members.includes('Bob'))
      
      expect(aliceGroup).toBeDefined()
      expect(bobGroup).toBeDefined()
      expect(aliceGroup?.id).toBe(bobGroup?.id)
      expect(result.errors).toBeUndefined()
    })

    it('should enforce hard apart constraints', () => {
      const participants = ['Alice', 'Bob', 'Charlie', 'David']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'apart',
          strength: 'hard',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2,
        constraints
      }

      const result = generator.generateGroups(options)

      // Alice and Bob should be in different groups
      const aliceGroup = result.groups.find(g => g.members.includes('Alice'))
      const bobGroup = result.groups.find(g => g.members.includes('Bob'))
      
      expect(aliceGroup).toBeDefined()
      expect(bobGroup).toBeDefined()
      expect(aliceGroup?.id).not.toBe(bobGroup?.id)
      expect(result.errors).toBeUndefined()
    })

    it('should detect impossible hard constraints', () => {
      const participants = ['Alice', 'Bob', 'Charlie']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'together',
          strength: 'hard',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        },
        {
          id: '2',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'apart',
          strength: 'hard',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2,
        constraints
      }

      const result = generator.generateGroups(options)

      expect(result.warnings).toBeDefined()
      expect(result.warnings?.some(w => w.includes('Conflicting hard constraints'))).toBe(true)
    })
  })

  describe('Soft Constraints', () => {
    it('should attempt to satisfy soft constraints', () => {
      const participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'together',
          strength: 'soft',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 3,
        constraints
      }

      const result = generator.generateGroups(options)

      expect(result.metadata.constraintsApplied).toBeDefined()
      expect(result.metadata.constraintsViolated).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    it('should not fail when soft constraints cannot be satisfied', () => {
      const participants = ['Alice', 'Bob']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'apart',
          strength: 'soft',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2,
        constraints
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].members).toContain('Alice')
      expect(result.groups[0].members).toContain('Bob')
      expect(result.errors).toBeUndefined()
    })
  })

  describe('Constraint Validation', () => {
    it('should detect constraints with missing participants', () => {
      const participants = ['Alice', 'Bob', 'Charlie']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'together',
          strength: 'hard',
          participants: ['Alice', 'David'], // David not in participants
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2,
        constraints
      }

      const result = generator.generateGroups(options)

      expect(result.warnings).toBeDefined()
      expect(result.warnings?.some(w => w.includes('participants not found'))).toBe(true)
    })
  })

  describe('Fallback Behavior', () => {
    it('should provide fallback groups when hard constraints are impossible', () => {
      const participants = ['Alice', 'Bob']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'apart',
          strength: 'hard',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2,
        constraints
      }

      const result = generator.generateGroups(options)

      // Should still generate groups even though constraint can't be satisfied
      expect(result.groups).toHaveLength(1)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(e => e.includes('Unable to create groups'))).toBe(true)
    })
  })

  describe('Database Constraint Format', () => {
    it('should handle database constraint format', () => {
      const participants = ['Alice', 'Bob', 'Charlie', 'David']
      const dbConstraints: DbConstraint[] = [
        {
          id: '1',
          person_a: 'Alice',
          person_b: 'Bob',
          constraint_type: 'hard_together',
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2,
        dbConstraints
      }

      const result = generator.generateGroups(options)

      // Alice and Bob should be in the same group
      const aliceGroup = result.groups.find(g => g.members.includes('Alice'))
      const bobGroup = result.groups.find(g => g.members.includes('Bob'))
      
      expect(aliceGroup).toBeDefined()
      expect(bobGroup).toBeDefined()
      expect(aliceGroup?.id).toBe(bobGroup?.id)
      expect(result.errors).toBeUndefined()
    })

    it('should handle mixed constraint formats', () => {
      const participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']
      const constraints: Constraint[] = [
        {
          id: '1',
          user_id: 'user1',
          saved_group_id: 'group1',
          type: 'together',
          strength: 'hard',
          participants: ['Alice', 'Bob'],
          created_at: '2024-01-01'
        }
      ]
      const dbConstraints: DbConstraint[] = [
        {
          id: '2',
          person_a: 'Charlie',
          person_b: 'David',
          constraint_type: 'hard_apart',
          created_at: '2024-01-01'
        }
      ]

      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2,
        constraints,
        dbConstraints
      }

      const result = generator.generateGroups(options)

      // Alice and Bob should be together
      const aliceGroup = result.groups.find(g => g.members.includes('Alice'))
      const bobGroup = result.groups.find(g => g.members.includes('Bob'))
      expect(aliceGroup?.id).toBe(bobGroup?.id)

      // Charlie and David should be apart
      const charlieGroup = result.groups.find(g => g.members.includes('Charlie'))
      const davidGroup = result.groups.find(g => g.members.includes('David'))
      expect(charlieGroup?.id).not.toBe(davidGroup?.id)

      expect(result.errors).toBeUndefined()
    })
  })
})