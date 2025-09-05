import React, { useState } from 'react'
import { savedGroupsDb } from '../../lib/database'
import { useAuth } from '../../hooks/useAuth'
import ParticipantInput from './ParticipantInput'
import Toast from '../ui/Toast'

interface GroupCreatorProps {
  onGroupCreated?: (groupId: string) => void
  onCancel?: () => void
  isModal?: boolean
}

export const GroupCreator: React.FC<GroupCreatorProps> = ({ 
  onGroupCreated, 
  onCancel,
  isModal = false 
}) => {
  const { user } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be signed in to create a group')
      return
    }

    if (!groupName.trim()) {
      setError('Please enter a group name')
      return
    }

    if (participants.length < 2) {
      setError('Please add at least 2 participants')
      return
    }

    try {
      setIsCreating(true)
      setError(null)
      
      const newGroup = await savedGroupsDb.create({
        name: groupName.trim(),
        participants: participants
      })

      setSuccess(`Group "${groupName}" created successfully!`)
      
      // Reset form
      setGroupName('')
      setParticipants([])
      
      // Notify parent component
      onGroupCreated?.(newGroup.id)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group'
      setError(errorMessage)
      console.error('Error creating group:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setGroupName('')
    setParticipants([])
    setError(null)
    setSuccess(null)
    onCancel?.()
  }

  const canSubmit = groupName.trim() && participants.length >= 2 && !isCreating

  const containerClasses = isModal 
    ? "bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
    : "bg-white shadow rounded-lg"

  return (
    <>
      <div className={containerClasses}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Create New Group</h2>
          <p className="mt-1 text-sm text-gray-500">
            Save a list of participants for easy group generation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name Input */}
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Team Building Workshop, Study Group, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">
              Choose a descriptive name for your group
            </p>
          </div>

          {/* Participants Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participants
            </label>
            <ParticipantInput
              participants={participants}
              onParticipantsChange={setParticipants}
            />
            <p className="mt-1 text-xs text-gray-500">
              Add at least 2 participants to create a group
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
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

export default GroupCreator