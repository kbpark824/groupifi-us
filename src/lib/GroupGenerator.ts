import type { GroupGenerationOptions, Group, GroupGenerationResult } from '../types'

export class GroupGenerator {
  /**
   * Validates participant names and group parameters
   */
  private validateInput(options: GroupGenerationOptions): void {
    const { participants, groupSizeType, groupSize } = options

    // Validate participants
    if (!participants || participants.length === 0) {
      throw new Error('At least one participant is required')
    }

    if (participants.length > 100) {
      throw new Error('Maximum of 100 participants allowed')
    }

    // Check for empty or invalid names
    const invalidNames = participants.filter(name => !name || typeof name !== 'string' || name.trim().length === 0)
    if (invalidNames.length > 0) {
      throw new Error('All participant names must be non-empty strings')
    }

    // Check for duplicate names
    const uniqueNames = new Set(participants.map(name => name.trim().toLowerCase()))
    if (uniqueNames.size !== participants.length) {
      throw new Error('Duplicate participant names are not allowed')
    }

    // Validate group size parameters
    if (groupSize <= 0) {
      throw new Error('Group size must be greater than 0')
    }

    if (groupSizeType === 'fixed') {
      if (groupSize > participants.length) {
        throw new Error('Fixed group size cannot be larger than total number of participants')
      }
      if (groupSize > 10) {
        throw new Error('Maximum group size is 10')
      }
    } else if (groupSizeType === 'target') {
      if (groupSize > participants.length) {
        throw new Error('Target number of groups cannot be larger than total number of participants')
      }
    }
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Distributes participants into groups with minimal size variation
   */
  private distributeParticipants(participants: string[], targetGroupCount: number): Group[] {
    const totalParticipants = participants.length
    const baseGroupSize = Math.floor(totalParticipants / targetGroupCount)
    const remainder = totalParticipants % targetGroupCount

    // Shuffle participants for random distribution
    const shuffledParticipants = this.shuffleArray(participants)

    const groups: Group[] = []
    let currentIndex = 0

    for (let i = 0; i < targetGroupCount; i++) {
      // Some groups get one extra member to handle remainder
      const groupSize = baseGroupSize + (i < remainder ? 1 : 0)
      const groupMembers = shuffledParticipants.slice(currentIndex, currentIndex + groupSize)
      
      groups.push({
        id: `group-${i + 1}`,
        members: groupMembers,
        size: groupSize
      })

      currentIndex += groupSize
    }

    return groups
  }

  /**
   * Generates groups based on fixed group size
   */
  private generateByFixedSize(participants: string[], fixedSize: number): Group[] {
    const totalParticipants = participants.length
    const completeGroups = Math.floor(totalParticipants / fixedSize)
    const remainder = totalParticipants % fixedSize

    // Shuffle participants for random distribution
    const shuffledParticipants = this.shuffleArray(participants)

    const groups: Group[] = []
    let currentIndex = 0

    // Create complete groups of fixed size
    for (let i = 0; i < completeGroups; i++) {
      const groupMembers = shuffledParticipants.slice(currentIndex, currentIndex + fixedSize)
      groups.push({
        id: `group-${i + 1}`,
        members: groupMembers,
        size: fixedSize
      })
      currentIndex += fixedSize
    }

    // Handle remainder participants
    if (remainder > 0) {
      const remainingParticipants = shuffledParticipants.slice(currentIndex)
      
      // If remainder is 1 and we have at least one group, add to last group
      // Otherwise create a new group
      if (remainder === 1 && groups.length > 0) {
        const lastGroup = groups[groups.length - 1]
        lastGroup.members.push(remainingParticipants[0])
        lastGroup.size += 1
      } else {
        groups.push({
          id: `group-${groups.length + 1}`,
          members: remainingParticipants,
          size: remainder
        })
      }
    }

    return groups
  }

  /**
   * Generates groups based on target number of groups
   */
  private generateByTargetCount(participants: string[], targetCount: number): Group[] {
    return this.distributeParticipants(participants, targetCount)
  }

  /**
   * Main method to generate groups
   */
  public generateGroups(options: GroupGenerationOptions): GroupGenerationResult {
    // Validate input
    this.validateInput(options)

    const { participants, groupSizeType, groupSize } = options

    let groups: Group[]

    if (groupSizeType === 'fixed') {
      groups = this.generateByFixedSize(participants, groupSize)
    } else {
      groups = this.generateByTargetCount(participants, groupSize)
    }

    // Calculate metadata
    const totalParticipants = participants.length
    const groupCount = groups.length
    const averageGroupSize = totalParticipants / groupCount
    const groupSizes = groups.map(g => g.size)
    const minSize = Math.min(...groupSizes)
    const maxSize = Math.max(...groupSizes)
    const sizeVariation = maxSize - minSize

    return {
      groups,
      metadata: {
        totalParticipants,
        groupCount,
        averageGroupSize: Math.round(averageGroupSize * 100) / 100,
        sizeVariation
      }
    }
  }
}