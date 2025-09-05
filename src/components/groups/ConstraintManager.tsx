import React, { useState, useEffect } from 'react'
import { constraintsDb, type Constraint } from '../../lib/database'
import { useAuth } from '../../hooks/useAuth'
import ConstraintGrid from './ConstraintGrid'
import Toast from '../ui/Toast'

interface ConstraintManagerProps {
  groupId: string
  participants: string[]
  onConstraintsUpdated?: (constraints: Constraint[]) => void
}

export const ConstraintManager: React.FC<ConstraintManagerProps> = ({
  groupId,
  participants,
  onConstraintsUpdated
}) => {
  const { user } = useAuth()
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load existing constraints
  const loadConstraints = async () => {
    if (!user || !groupId) return

    try {
      setLoading(true)
      setError(null)
      const data = await constraintsDb.getByGroupId(groupId)
      setConstraints(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load constraints'
      setError(errorMessage)
      console.error('Error loading constraints:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConstraints()
  }, [user, groupId])

  // Handle constraint creation
  const handleCreateConstraint = async (
    personA: string,
    personB: string,
    constraintType: 'hard_together' | 'hard_apart' | 'soft_together' | 'soft_apart'
  ) => {
    if (!user || !groupId) return

    try {
      setIsUpdating(true)
      setError(null)

      const newConstraint = await constraintsDb.create({
        group_id: groupId,
        person_a: personA,
        person_b: personB,
        constraint_type: constraintType
      })

      const updatedConstraints = [...constraints, newConstraint]
      setConstraints(updatedConstraints)
      onConstraintsUpdated?.(updatedConstraints)
      setSuccess('Constraint added successfully!')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create constraint'
      setError(errorMessage)
      console.error('Error creating constraint:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle constraint deletion
  const handleDeleteConstraint = async (constraintId: string) => {
    if (!user) return

    try {
      setIsUpdating(true)
      setError(null)

      await constraintsDb.delete(constraintId)

      const updatedConstraints = constraints.filter(c => c.id !== constraintId)
      setConstraints(updatedConstraints)
      onConstraintsUpdated?.(updatedConstraints)
      setSuccess('Constraint removed successfully!')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete constraint'
      setError(errorMessage)
      console.error('Error deleting constraint:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle constraint update
  const handleUpdateConstraint = async (
    constraintId: string,
    constraintType: 'hard_together' | 'hard_apart' | 'soft_together' | 'soft_apart'
  ) => {
    if (!user) return

    try {
      setIsUpdating(true)
      setError(null)

      const updatedConstraint = await constraintsDb.update(constraintId, {
        constraint_type: constraintType
      })

      const updatedConstraints = constraints.map(c => 
        c.id === constraintId ? updatedConstraint : c
      )
      setConstraints(updatedConstraints)
      onConstraintsUpdated?.(updatedConstraints)
      setSuccess('Constraint updated successfully!')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update constraint'
      setError(errorMessage)
      console.error('Error updating constraint:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500">Please sign in to manage constraints.</p>
        </div>
      </div>
    )
  }

  if (participants.length < 2) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Not Enough Participants</h2>
          <p className="text-gray-500">Add at least 2 participants to create constraints.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Grouping Constraints</h2>
              <p className="mt-1 text-sm text-gray-500">
                Define rules for who should be grouped together or kept apart
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {constraints.length} constraint{constraints.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading constraints...</span>
            </div>
          ) : (
            <>
              {/* Constraint Type Legend */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Constraint Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span><strong>Hard Together:</strong> Must be in same group</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span><strong>Hard Apart:</strong> Must be in different groups</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                    <span><strong>Soft Together:</strong> Prefer same group</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-300 rounded-full"></div>
                    <span><strong>Soft Apart:</strong> Prefer different groups</span>
                  </div>
                </div>
              </div>

              {/* Constraint Grid */}
              <ConstraintGrid
                participants={participants}
                constraints={constraints}
                onCreateConstraint={handleCreateConstraint}
                onUpdateConstraint={handleUpdateConstraint}
                onDeleteConstraint={handleDeleteConstraint}
                isUpdating={isUpdating}
              />

              {/* Existing Constraints List */}
              {constraints.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Active Constraints</h3>
                  <div className="space-y-2">
                    {constraints.map((constraint) => (
                      <div
                        key={constraint.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            constraint.constraint_type === 'hard_together' ? 'bg-green-500' :
                            constraint.constraint_type === 'hard_apart' ? 'bg-red-500' :
                            constraint.constraint_type === 'soft_together' ? 'bg-green-300' :
                            'bg-red-300'
                          }`}></div>
                          <span className="text-sm text-gray-900">
                            <strong>{constraint.person_a}</strong> and <strong>{constraint.person_b}</strong>
                          </span>
                          <span className="text-xs text-gray-500">
                            ({constraint.constraint_type.replace('_', ' ')})
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteConstraint(constraint.id)}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {error && (
        <Toast
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <Toast
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}
    </>
  )
}

export default ConstraintManager