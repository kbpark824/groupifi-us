import React, { useState, useEffect } from 'react'
import { savedGroupsDb, type SavedGroup } from '../../lib/database'
import { useAuth } from '../../hooks/useAuth'
import ParticipantInput from './ParticipantInput'
import Toast from '../ui/Toast'

interface GroupEditorProps {
  group: SavedGroup | null
  onGroupUpdated?: (group: SavedGroup) => void
  onCancel?: () => void
  isModal?: boolean
}

export const GroupEditor: React.FC<GroupEditorProps> = ({ 
  group, 
  onGroupUpdated, 
  onCancel,
  isModal = false 
}) => {
  const { user } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Initialize form with group data
  useEffect(() => {
    if (group) {
      setGroupName(group.name)
      setParticipants([...group.participants])
    }
  }, [group])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !group) {
      setError('You must be signed in and have a valid group to edit')
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
      setIsUpdating(true)
      setError(null)
      
      const updatedGroup = await savedGroupsDb.update(group.id, {
        name: groupName.trim(),
        participants: participants
      })

      setSuccess(`Group "${groupName}" updated successfully!`)
      
      // Notify parent component
      onGroupUpdated?.(updatedGroup)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group'
      setError(errorMessage)
      console.error('Error updating group:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    if (group) {
      setGroupName(group.name)
      setParticipants([...group.participants])
    }
    setError(null)
    setSuccess(null)
    onCancel?.()
  }

  const hasChanges = group && (
    groupName.trim() !== group.name || 
    JSON.stringify(participants.sort()) !== JSON.stringify([...group.participants].sort())
  )

  const canSubmit = groupName.trim() && participants.length >= 2 && hasChanges && !isUpdating

  if (!group) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Group Selected</h2>
          <p className="text-gray-500">Please select a group to edit.</p>
        </div>
      </div>
    )
  }

  const containerClasses = isModal 
    ? "bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
    : "bg-white shadow rounded-lg"

  return (
    <>
      <div className={containerClasses}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Edit Group</h2>
          <p className="mt-1 text-sm text-gray-500">
            Modify the name and participants for "{group.name}"
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
              Current count: {participants.length} participants
            </p>
          </div>

          {/* Change Summary */}
          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Changes detected
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      {groupName.trim() !== group.name && (
                        <li>Name changed from "{group.name}" to "{groupName.trim()}"</li>
                      )}
                      {JSON.stringify(participants.sort()) !== JSON.stringify([...group.participants].sort()) && (
                        <li>
                          Participants changed ({group.participants.length} → {participants.length})
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Save Changes'
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

export default GroupEditor