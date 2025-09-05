import type { GroupGenerationOptions, Group, GroupGenerationResult, Constraint, DbConstraint, GroupingSession } from '../types'

export class GroupGenerator {
  /**
   * Analyzes historical grouping sessions to identify recent pairings
   */
  private analyzeHistoricalPairings(sessions: GroupingSession[]): Set<string> {
    const recentPairings = new Set<string>()
    
    // Only consider the most recent session to avoid immediate repetition
    if (sessions.length === 0) {
      return recentPairings
    }
    
    const mostRecentSession = sessions[0] // Sessions should be ordered by date desc
    
    // Extract all pairings from the most recent session
    for (const group of mostRecentSession.groups) {
      // Generate all possible pairs within each group
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const pair = [group[i], group[j]].sort().join('|')
          recentPairings.add(pair)
        }
      }
    }
    
    return recentPairings
  }

  /**
   * Calculates a penalty score for group arrangements based on recent pairings
   */
  private calculateHistoryPenalty(groups: Group[], recentPairings: Set<string>): number {
    let penalty = 0
    
    for (const group of groups) {
      // Check all pairs within this group
      for (let i = 0; i < group.members.length; i++) {
        for (let j = i + 1; j < group.members.length; j++) {
          const pair = [group.members[i], group.members[j]].sort().join('|')
          if (recentPairings.has(pair)) {
            penalty += 1
          }
        }
      }
    }
    
    return penalty
  }

  /**
   * Converts database constraint format to internal constraint format
   */
  private convertDbConstraints(dbConstraints: DbConstraint[]): Constraint[] {
    return dbConstraints.map(dbConstraint => ({
      id: dbConstraint.id,
      user_id: dbConstraint.user_id || '',
      saved_group_id: dbConstraint.saved_group_id || dbConstraint.group_id || '',
      type: dbConstraint.constraint_type.includes('together') ? 'together' as const : 'apart' as const,
      strength: dbConstraint.constraint_type.includes('hard') ? 'hard' as const : 'soft' as const,
      participants: [dbConstraint.person_a, dbConstraint.person_b],
      created_at: dbConstraint.created_at
    }))
  }
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
   * Validates constraints for conflicts and impossibilities
   */
  private validateConstraints(constraints: Constraint[], participants: string[]): { 
    validConstraints: Constraint[], 
    impossibleConstraints: string[] 
  } {
    const validConstraints: Constraint[] = []
    const impossibleConstraints: string[] = []
    const participantSet = new Set(participants)

    for (const constraint of constraints) {
      // Check if all constraint participants exist in the participant list
      const missingParticipants = constraint.participants.filter(p => !participantSet.has(p))
      if (missingParticipants.length > 0) {
        impossibleConstraints.push(
          `Constraint involving ${constraint.participants.join(' and ')} cannot be applied - participants not found: ${missingParticipants.join(', ')}`
        )
        continue
      }

      // Check for conflicting hard constraints
      const conflictingConstraint = validConstraints.find(existing => {
        const sameParticipants = existing.participants.length === constraint.participants.length &&
          existing.participants.every(p => constraint.participants.includes(p))
        
        return sameParticipants && 
               existing.strength === 'hard' && 
               constraint.strength === 'hard' &&
               existing.type !== constraint.type
      })

      if (conflictingConstraint) {
        impossibleConstraints.push(
          `Conflicting hard constraints for ${constraint.participants.join(' and ')}: cannot be both together and apart`
        )
        continue
      }

      validConstraints.push(constraint)
    }

    return { validConstraints, impossibleConstraints }
  }

  /**
   * Checks if a group satisfies hard constraints
   */
  private satisfiesHardConstraints(group: string[], hardConstraints: Constraint[]): boolean {
    for (const constraint of hardConstraints) {
      const constraintParticipants = constraint.participants
      const participantsInGroup = constraintParticipants.filter(p => group.includes(p))

      if (constraint.type === 'together') {
        // All constraint participants must be in the same group
        if (participantsInGroup.length > 0 && participantsInGroup.length !== constraintParticipants.length) {
          return false
        }
      } else if (constraint.type === 'apart') {
        // No more than one constraint participant can be in the group
        if (participantsInGroup.length > 1) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Calculates soft constraint satisfaction score for a group arrangement
   */
  private calculateSoftConstraintScore(groups: Group[], softConstraints: Constraint[]): number {
    let satisfiedConstraints = 0

    for (const constraint of softConstraints) {
      const constraintParticipants = constraint.participants
      
      if (constraint.type === 'together') {
        // Check if all participants are in the same group
        const groupWithParticipants = groups.find(group => 
          constraintParticipants.every(p => group.members.includes(p))
        )
        if (groupWithParticipants) {
          satisfiedConstraints++
        }
      } else if (constraint.type === 'apart') {
        // Check if participants are in different groups
        const participantGroups = constraintParticipants.map(p => 
          groups.findIndex(group => group.members.includes(p))
        )
        const uniqueGroups = new Set(participantGroups)
        if (uniqueGroups.size === constraintParticipants.length) {
          satisfiedConstraints++
        }
      }
    }

    return satisfiedConstraints
  }

  /**
   * Attempts to generate groups that satisfy hard constraints and avoid recent pairings
   */
  private generateWithHardConstraints(
    participants: string[], 
    groupSizeType: 'fixed' | 'target',
    groupSize: number,
    hardConstraints: Constraint[],
    recentPairings?: Set<string>
  ): Group[] | null {
    const maxAttempts = recentPairings ? 100 : 50 // More attempts when avoiding history
    let bestGroups: Group[] | null = null
    let bestHistoryPenalty = Infinity
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let groups: Group[]
      
      if (groupSizeType === 'fixed') {
        groups = this.generateByFixedSize(participants, groupSize)
      } else {
        groups = this.generateByTargetCount(participants, groupSize)
      }

      // Check if all groups satisfy hard constraints
      const allGroupsSatisfyConstraints = groups.every(group => 
        this.satisfiesHardConstraints(group.members, hardConstraints)
      )

      if (allGroupsSatisfyConstraints) {
        if (!recentPairings) {
          return groups // No history to consider, return first valid arrangement
        }
        
        // Calculate history penalty for this arrangement
        const historyPenalty = this.calculateHistoryPenalty(groups, recentPairings)
        
        if (historyPenalty === 0) {
          return groups // Perfect - no recent pairings repeated
        }
        
        if (historyPenalty < bestHistoryPenalty) {
          bestGroups = groups
          bestHistoryPenalty = historyPenalty
        }
      }
    }

    return bestGroups // Return best arrangement found, or null if no valid arrangement
  }

  /**
   * Optimizes group arrangement for soft constraints and history avoidance
   */
  private optimizeForSoftConstraints(
    groups: Group[], 
    softConstraints: Constraint[],
    hardConstraints: Constraint[],
    recentPairings?: Set<string>
  ): Group[] {
    if (softConstraints.length === 0 && !recentPairings) {
      return groups
    }

    let bestGroups = groups
    let bestScore = this.calculateSoftConstraintScore(groups, softConstraints)
    let bestHistoryPenalty = recentPairings ? this.calculateHistoryPenalty(groups, recentPairings) : 0
    const maxOptimizationAttempts = 20

    for (let attempt = 0; attempt < maxOptimizationAttempts; attempt++) {
      // Try swapping random participants between groups
      const testGroups = groups.map(group => ({
        ...group,
        members: [...group.members]
      }))

      // Pick two random groups and swap random participants
      if (testGroups.length >= 2) {
        const group1Index = Math.floor(Math.random() * testGroups.length)
        let group2Index = Math.floor(Math.random() * testGroups.length)
        while (group2Index === group1Index) {
          group2Index = Math.floor(Math.random() * testGroups.length)
        }

        const group1 = testGroups[group1Index]
        const group2 = testGroups[group2Index]

        if (group1.members.length > 0 && group2.members.length > 0) {
          const member1Index = Math.floor(Math.random() * group1.members.length)
          const member2Index = Math.floor(Math.random() * group2.members.length)

          // Swap members
          const temp = group1.members[member1Index]
          group1.members[member1Index] = group2.members[member2Index]
          group2.members[member2Index] = temp
        }
      }

      // Check if this arrangement still satisfies hard constraints
      const satisfiesHardConstraints = testGroups.every(group => 
        this.satisfiesHardConstraints(group.members, hardConstraints)
      )

      if (satisfiesHardConstraints) {
        const constraintScore = this.calculateSoftConstraintScore(testGroups, softConstraints)
        const historyPenalty = recentPairings ? this.calculateHistoryPenalty(testGroups, recentPairings) : 0
        
        // Prefer arrangements with better constraint satisfaction and less history repetition
        const isBetter = constraintScore > bestScore || 
                         (constraintScore === bestScore && historyPenalty < bestHistoryPenalty)
        
        if (isBetter) {
          bestGroups = testGroups
          bestScore = constraintScore
          bestHistoryPenalty = historyPenalty
        }
      }
    }

    return bestGroups
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

    const { 
      participants, 
      groupSizeType, 
      groupSize, 
      constraints = [], 
      dbConstraints = [],
      historicalSessions = [],
      avoidRecentPairings = false
    } = options
    
    // Convert database constraints to internal format and combine with direct constraints
    const convertedConstraints = this.convertDbConstraints(dbConstraints)
    const allConstraints = [...constraints, ...convertedConstraints]
    const warnings: string[] = []
    const errors: string[] = []

    // Analyze historical pairings if history avoidance is enabled
    let recentPairings: Set<string> | undefined
    let historyConflictsAvoided = 0
    
    if (avoidRecentPairings && historicalSessions && historicalSessions.length > 0) {
      recentPairings = this.analyzeHistoricalPairings(historicalSessions)
    }

    // Validate and separate constraints
    const { validConstraints, impossibleConstraints } = this.validateConstraints(allConstraints, participants)
    
    if (impossibleConstraints.length > 0) {
      warnings.push(...impossibleConstraints)
    }

    // Separate hard and soft constraints
    const hardConstraints = validConstraints.filter(c => c.strength === 'hard')
    const softConstraints = validConstraints.filter(c => c.strength === 'soft')

    let groups: Group[]

    // Try to generate groups that satisfy hard constraints and avoid recent pairings
    if (hardConstraints.length > 0 || recentPairings) {
      const constrainedGroups = this.generateWithHardConstraints(
        participants, 
        groupSizeType, 
        groupSize, 
        hardConstraints,
        recentPairings
      )

      if (constrainedGroups === null) {
        // Hard constraints cannot be satisfied
        errors.push(
          'Unable to create groups that satisfy all hard constraints. ' +
          'Please review your constraints or consider making some of them soft constraints.'
        )
        
        // Fall back to generating groups without constraints
        if (groupSizeType === 'fixed') {
          groups = this.generateByFixedSize(participants, groupSize)
        } else {
          groups = this.generateByTargetCount(participants, groupSize)
        }
      } else {
        groups = constrainedGroups
      }
    } else {
      // No hard constraints, generate normally
      if (groupSizeType === 'fixed') {
        groups = this.generateByFixedSize(participants, groupSize)
      } else {
        groups = this.generateByTargetCount(participants, groupSize)
      }
    }

    // Calculate history conflicts avoided
    if (recentPairings && recentPairings.size > 0 && groups) {
      const finalPenalty = this.calculateHistoryPenalty(groups, recentPairings)
      historyConflictsAvoided = Math.max(0, recentPairings.size - finalPenalty)
    }

    // Optimize for soft constraints and history avoidance if we have valid groups
    if ((softConstraints.length > 0 || recentPairings) && errors.length === 0) {
      groups = this.optimizeForSoftConstraints(groups, softConstraints, hardConstraints, recentPairings)
      
      // Recalculate history conflicts avoided after optimization
      if (recentPairings && recentPairings.size > 0) {
        const finalPenalty = this.calculateHistoryPenalty(groups, recentPairings)
        historyConflictsAvoided = Math.max(0, recentPairings.size - finalPenalty)
      }
    }

    // Calculate metadata
    const totalParticipants = participants.length
    const groupCount = groups.length
    const averageGroupSize = totalParticipants / groupCount
    const groupSizes = groups.map(g => g.size)
    const minSize = Math.min(...groupSizes)
    const maxSize = Math.max(...groupSizes)
    const sizeVariation = maxSize - minSize

    // Calculate constraint satisfaction
    const constraintsApplied = this.calculateSoftConstraintScore(groups, validConstraints)
    const constraintsViolated = validConstraints.length - constraintsApplied

    const result: GroupGenerationResult = {
      groups,
      metadata: {
        totalParticipants,
        groupCount,
        averageGroupSize: Math.round(averageGroupSize * 100) / 100,
        sizeVariation,
        constraintsApplied,
        constraintsViolated,
        impossibleConstraints,
        ...(historyConflictsAvoided > 0 && { historyConflictsAvoided })
      }
    }

    if (warnings.length > 0) {
      result.warnings = warnings
    }

    if (errors.length > 0) {
      result.errors = errors
    }

    return result
  }
}