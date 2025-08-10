import { describe, it, expect, beforeEach } from 'vitest'
import { GroupGenerator } from './GroupGenerator'
import type { GroupGenerationOptions } from '../types'

describe('GroupGenerator', () => {
  let generator: GroupGenerator

  beforeEach(() => {
    generator = new GroupGenerator()
  })

  describe('Input Validation', () => {
    it('should throw error for empty participants array', () => {
      const options: GroupGenerationOptions = {
        participants: [],
        groupSizeType: 'fixed',
        groupSize: 3
      }

      expect(() => generator.generateGroups(options)).toThrow('At least one participant is required')
    })

    it('should throw error for too many participants', () => {
      const participants = Array.from({ length: 101 }, (_, i) => `Person ${i + 1}`)
      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 3
      }

      expect(() => generator.generateGroups(options)).toThrow('Maximum of 100 participants allowed')
    })

    it('should throw error for empty participant names', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', '', 'Bob'],
        groupSizeType: 'fixed',
        groupSize: 2
      }

      expect(() => generator.generateGroups(options)).toThrow('All participant names must be non-empty strings')
    })

    it('should throw error for duplicate participant names', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Alice'],
        groupSizeType: 'fixed',
        groupSize: 2
      }

      expect(() => generator.generateGroups(options)).toThrow('Duplicate participant names are not allowed')
    })

    it('should throw error for duplicate names with different casing', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'alice'],
        groupSizeType: 'fixed',
        groupSize: 2
      }

      expect(() => generator.generateGroups(options)).toThrow('Duplicate participant names are not allowed')
    })

    it('should throw error for zero or negative group size', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie'],
        groupSizeType: 'fixed',
        groupSize: 0
      }

      expect(() => generator.generateGroups(options)).toThrow('Group size must be greater than 0')
    })

    it('should throw error when fixed group size is larger than participant count', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob'],
        groupSizeType: 'fixed',
        groupSize: 5
      }

      expect(() => generator.generateGroups(options)).toThrow('Fixed group size cannot be larger than total number of participants')
    })

    it('should throw error when fixed group size exceeds maximum', () => {
      const participants = Array.from({ length: 20 }, (_, i) => `Person ${i + 1}`)
      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 11
      }

      expect(() => generator.generateGroups(options)).toThrow('Maximum group size is 10')
    })

    it('should throw error when target group count is larger than participant count', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob'],
        groupSizeType: 'target',
        groupSize: 5
      }

      expect(() => generator.generateGroups(options)).toThrow('Target number of groups cannot be larger than total number of participants')
    })
  })

  describe('Fixed Group Size Generation', () => {
    it('should create groups of exact fixed size when participants divide evenly', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'],
        groupSizeType: 'fixed',
        groupSize: 3
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(2)
      expect(result.groups[0].size).toBe(3)
      expect(result.groups[1].size).toBe(3)
      expect(result.metadata.totalParticipants).toBe(6)
      expect(result.metadata.groupCount).toBe(2)
      expect(result.metadata.sizeVariation).toBe(0)
    })

    it('should handle remainder by adding to last group when remainder is 1', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace'],
        groupSizeType: 'fixed',
        groupSize: 3
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(2)
      expect(result.groups[0].size).toBe(3)
      expect(result.groups[1].size).toBe(4) // Last group gets the extra person
      expect(result.metadata.totalParticipants).toBe(7)
      expect(result.metadata.sizeVariation).toBe(1)
    })

    it('should create new group for remainder when remainder is greater than 1', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry'],
        groupSizeType: 'fixed',
        groupSize: 3
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(3)
      expect(result.groups[0].size).toBe(3)
      expect(result.groups[1].size).toBe(3)
      expect(result.groups[2].size).toBe(2) // Remainder group
      expect(result.metadata.totalParticipants).toBe(8)
      expect(result.metadata.sizeVariation).toBe(1)
    })

    it('should handle single participant', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice'],
        groupSizeType: 'fixed',
        groupSize: 1
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].size).toBe(1)
      expect(result.groups[0].members).toEqual(['Alice'])
    })

    it('should handle case where fixed group size equals participant count', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie'],
        groupSizeType: 'fixed',
        groupSize: 3
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].size).toBe(3)
      expect(result.groups[0].members).toHaveLength(3)
    })
  })

  describe('Target Group Count Generation', () => {
    it('should create exact number of groups when participants divide evenly', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'],
        groupSizeType: 'target',
        groupSize: 2
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(2)
      expect(result.groups[0].size).toBe(3)
      expect(result.groups[1].size).toBe(3)
      expect(result.metadata.totalParticipants).toBe(6)
      expect(result.metadata.groupCount).toBe(2)
      expect(result.metadata.sizeVariation).toBe(0)
    })

    it('should distribute remainder across groups with minimal size variation', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace'],
        groupSizeType: 'target',
        groupSize: 3
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(3)
      
      // Should have one group of size 3 and two groups of size 2 (or similar distribution)
      const groupSizes = result.groups.map(g => g.size).sort()
      expect(Math.max(...groupSizes) - Math.min(...groupSizes)).toBeLessThanOrEqual(1)
      expect(result.metadata.sizeVariation).toBeLessThanOrEqual(1)
    })

    it('should handle single group target', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David'],
        groupSizeType: 'target',
        groupSize: 1
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(1)
      expect(result.groups[0].size).toBe(4)
      expect(result.groups[0].members).toHaveLength(4)
    })

    it('should handle target equal to participant count', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie'],
        groupSizeType: 'target',
        groupSize: 3
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(3)
      result.groups.forEach(group => {
        expect(group.size).toBe(1)
        expect(group.members).toHaveLength(1)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle large participant lists efficiently', () => {
      const participants = Array.from({ length: 100 }, (_, i) => `Person ${i + 1}`)
      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 5
      }

      const startTime = Date.now()
      const result = generator.generateGroups(options)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
      expect(result.groups).toHaveLength(20)
      expect(result.metadata.totalParticipants).toBe(100)
    })

    it('should ensure all participants are included in groups', () => {
      const participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve']
      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2
      }

      const result = generator.generateGroups(options)

      const allMembers = result.groups.flatMap(group => group.members)
      expect(allMembers).toHaveLength(5)
      expect(new Set(allMembers)).toEqual(new Set(participants))
    })

    it('should generate different group compositions on multiple runs', () => {
      const participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']
      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 3
      }

      const result1 = generator.generateGroups(options)
      const result2 = generator.generateGroups(options)

      // Due to randomization, results should potentially be different
      // We'll just verify they both have valid structure
      expect(result1.groups).toHaveLength(2)
      expect(result2.groups).toHaveLength(2)
      expect(result1.metadata.totalParticipants).toBe(6)
      expect(result2.metadata.totalParticipants).toBe(6)
    })

    it('should handle participants with special characters and spaces', () => {
      const participants = ['Alice O\'Connor', 'Bob-Smith', 'Charlie Jr.', 'María García']
      const options: GroupGenerationOptions = {
        participants,
        groupSizeType: 'fixed',
        groupSize: 2
      }

      const result = generator.generateGroups(options)

      expect(result.groups).toHaveLength(2)
      const allMembers = result.groups.flatMap(group => group.members)
      expect(allMembers).toHaveLength(4)
      expect(new Set(allMembers)).toEqual(new Set(participants))
    })
  })

  describe('Metadata Calculation', () => {
    it('should calculate correct metadata for fixed size groups', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
        groupSizeType: 'fixed',
        groupSize: 2
      }

      const result = generator.generateGroups(options)

      expect(result.metadata.totalParticipants).toBe(5)
      expect(result.metadata.groupCount).toBe(2)
      expect(result.metadata.averageGroupSize).toBe(2.5)
      expect(result.metadata.sizeVariation).toBe(1) // One group of 2, one group of 3
    })

    it('should calculate correct metadata for target count groups', () => {
      const options: GroupGenerationOptions = {
        participants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'],
        groupSizeType: 'target',
        groupSize: 2
      }

      const result = generator.generateGroups(options)

      expect(result.metadata.totalParticipants).toBe(6)
      expect(result.metadata.groupCount).toBe(2)
      expect(result.metadata.averageGroupSize).toBe(3)
      expect(result.metadata.sizeVariation).toBe(0) // Both groups should be size 3
    })
  })
})