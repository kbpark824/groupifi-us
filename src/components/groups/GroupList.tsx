import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { savedGroupsDb, constraintsDb, groupingSessionsDb, type SavedGroup } from '../../lib/database'
import { useAuth } from '../../hooks/useAuth'
import { GroupGenerator } from '../../lib/GroupGenerator'
import Toast from '../ui/Toast'
import Modal from '../ui/Modal'
import GroupResults from './GroupResults'
import GroupHistory from './GroupHistory'
import GroupSizeSelector, { type GroupSizeMode } from './GroupSizeSelector'
import type { Group, GroupGenerationResult } from '../../types'

interface GroupListProps {
  onEditGroup?: (group: SavedGroup) => void
  onDeleteGroup?: (groupId: string) => void
  refreshTrigger?: number
}

interface GenerateGroupsModalState {
  isOpen: boolean
  group: SavedGroup | null
  groupMode: GroupSizeMode
  fixedSize: number
  targetGroups: number
  generatedGroups: Group[]
  isGenerating: boolean
  result: GroupGenerationResult | null
}

export const GroupList: React.FC<GroupListProps> = ({ 
  onEditGroup, 
  onDeleteGroup,
  refreshTrigger = 0 
}) => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<SavedGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Generate Groups Modal State
  const [generateModal, setGenerateModal] = useState<GenerateGroupsModalState>({
    isOpen: false,
    group: null,
    groupMode: 'fixed-size',
    fixedSize: 3,
    targetGroups: 2,
    generatedGroups: [],
    isGenerating: false,
    result: null
  })
  
  // History Modal State
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean
    groupId: string | null
  }>({
    isOpen: false,
    groupId: null
  })

  const loadGroups = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const data = await savedGroupsDb.getAll()
      setGroups(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load groups'
      setError(errorMessage)
      console.error('Error loading groups:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [user, refreshTrigger])

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingGroupId(groupId)
      await savedGroupsDb.delete(groupId)
      setGroups(groups.filter(g => g.id !== groupId))
      onDeleteGroup?.(groupId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group'
      setError(errorMessage)
      console.error('Error deleting group:', err)
    } finally {
      setDeletingGroupId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleGenerateGroups = (group: SavedGroup) => {
    setGenerateModal({
      isOpen: true,
      group,
      groupMode: 'fixed-size',
      fixedSize: 3,
      targetGroups: 2,
      generatedGroups: [],
      isGenerating: false,
      result: null
    })
  }

  const handleViewHistory = (groupId: string) => {
    setHistoryModal({
      isOpen: true,
      groupId
    })
  }

  const executeGroupGeneration = async () => {
    if (!generateModal.group) return

    try {
      setGenerateModal(prev => ({ ...prev, isGenerating: true }))
      setError(null)

      const group = generateModal.group
      
      // Load constraints for this group
      const constraints = await constraintsDb.getByGroupId(group.id)
      
      // Load historical sessions for this group
      const dbSessions = await groupingSessionsDb.getByGroupId(group.id, 5)
      
      // Convert database constraints to the format expected by GroupGenerator
      const dbConstraints = constraints.map(constraint => ({
        id: constraint.id,
        group_id: constraint.group_id,
        person_a: constraint.person_a,
        person_b: constraint.person_b,
        constraint_type: constraint.constraint_type,
        created_at: constraint.created || new Date().toISOString()
      }))
      
      // Convert database sessions to the format expected by GroupGenerator
      const historicalSessions = dbSessions.map(session => ({
        id: session.id,
        user_id: '', // Not needed for group generation
        saved_group_id: session.group_id,
        participants: group.participants, // Use current participants
        groups: Array.isArray(session.groups_data) ? 
          session.groups_data.map((group: any) => 
            Array.isArray(group) ? group : group.members || []
          ) : [],
        created_at: session.session_date
      }))
      
      const generator = new GroupGenerator()
      const options = {
        participants: group.participants,
        groupSizeType: generateModal.groupMode === 'fixed-size' ? 'fixed' as const : 'target' as const,
        groupSize: generateModal.groupMode === 'fixed-size' ? generateModal.fixedSize : generateModal.targetGroups,
        dbConstraints,
        historicalSessions,
        avoidRecentPairings: true
      }
      
      const result = generator.generateGroups(options)
      
      // Convert to the format expected by GroupResults
      const formattedGroups: Group[] = result.groups.map((group, index) => ({
        id: group.id,
        name: `Group ${index + 1}`,
        members: group.members,
        size: group.size
      }))
      
      // Save the session to history
      await groupingSessionsDb.saveGenerationResult(group.id, result)
      
      setGenerateModal(prev => ({
        ...prev,
        generatedGroups: formattedGroups,
        result,
        isGenerating: false
      }))
      
      let message = `Successfully created ${formattedGroups.length} groups!`
      if (result.metadata.historyConflictsAvoided && result.metadata.historyConflictsAvoided > 0) {
        message += ` Avoided ${result.metadata.historyConflictsAvoided} recent pairings.`
      }
      setSuccessMessage(message)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate groups'
      setError(errorMessage)
      console.error('Error generating groups:', err)
      setGenerateModal(prev => ({ ...prev, isGenerating: false }))
    }
  }

  const handleCopySuccess = () => {
    setSuccessMessage('Groups copied to clipboard!')
  }

  const closeGenerateModal = () => {
    setGenerateModal({
      isOpen: false,
      group: null,
      groupMode: 'fixed-size',
      fixedSize: 3,
      targetGroups: 2,
      generatedGroups: [],
      isGenerating: false,
      result: null
    })
  }

  const closeHistoryModal = () => {
    setHistoryModal({
      isOpen: false,
      groupId: null
    })
  }

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  if (!user) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to view your saved groups.</p>
          <Link 
            to="/auth" 
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Loading your groups...</span>
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No saved groups yet</h3>
          <p className="mt-1 text-gray-500">
            Create your first group to get started with saved participants and constraints.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Saved Groups</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your participant lists and grouping preferences
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {groups.map((group) => (
            <div key={group.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {group.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {group.participants.length} participants
                        </span>
                        <span className="text-sm text-gray-500">
                          Updated {formatDate(group.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Participant preview */}
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {group.participants.slice(0, 5).map((participant, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {participant}
                        </span>
                      ))}
                      {group.participants.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
                          +{group.participants.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleGenerateGroups(group)}
                    className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Generate
                  </button>

                  <button
                    onClick={() => handleViewHistory(group.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-purple-300 shadow-sm text-xs font-medium rounded text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>
                  
                  <button
                    onClick={() => onEditGroup?.(group)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    disabled={deletingGroupId === group.id}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingGroupId === group.id ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Groups Modal */}
      <Modal isOpen={generateModal.isOpen} onClose={closeGenerateModal}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Generate Groups: {generateModal.group?.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {generateModal.group?.participants.length} participants • Historical avoidance enabled
            </p>
          </div>

          <div className="p-6 space-y-6">
            {generateModal.generatedGroups.length === 0 ? (
              <>
                <GroupSizeSelector
                  mode={generateModal.groupMode}
                  fixedSize={generateModal.fixedSize}
                  targetGroups={generateModal.targetGroups}
                  totalParticipants={generateModal.group?.participants.length || 0}
                  onModeChange={(mode) => setGenerateModal(prev => ({ ...prev, groupMode: mode }))}
                  onFixedSizeChange={(size) => setGenerateModal(prev => ({ ...prev, fixedSize: size }))}
                  onTargetGroupsChange={(count) => setGenerateModal(prev => ({ ...prev, targetGroups: count }))}
                  onValidationChange={() => {}} // Always valid for saved groups
                />

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeGenerateModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeGroupGeneration}
                    disabled={generateModal.isGenerating}
                    className={`px-6 py-2 rounded-md text-white font-medium text-sm transition-colors ${
                      generateModal.isGenerating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {generateModal.isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Groups'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <GroupResults 
                  groups={generateModal.generatedGroups} 
                  onCopy={handleCopySuccess} 
                />
                
                {generateModal.result && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Generation Summary
                        </h3>
                        <div className="mt-1 text-sm text-blue-700">
                          <ul className="list-disc list-inside space-y-1">
                            <li>{generateModal.result.metadata.totalParticipants} participants in {generateModal.result.metadata.groupCount} groups</li>
                            {generateModal.result.metadata.constraintsApplied !== undefined && (
                              <li>{generateModal.result.metadata.constraintsApplied} constraints satisfied</li>
                            )}
                            {generateModal.result.metadata.historyConflictsAvoided !== undefined && generateModal.result.metadata.historyConflictsAvoided > 0 && (
                              <li>{generateModal.result.metadata.historyConflictsAvoided} recent pairings avoided</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setGenerateModal(prev => ({ 
                      ...prev, 
                      generatedGroups: [], 
                      result: null 
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Generate Again
                  </button>
                  <button
                    onClick={closeGenerateModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyModal.isOpen} onClose={closeHistoryModal}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {historyModal.groupId && (
            <GroupHistory 
              groupId={historyModal.groupId} 
              onClose={closeHistoryModal}
            />
          )}
        </div>
      </Modal>

      {/* Toast notifications */}
      {error && (
        <Toast
          type="error"
          message={error}
          onClose={clearMessages}
        />
      )}
      {successMessage && (
        <Toast
          type="success"
          message={successMessage}
          onClose={clearMessages}
        />
      )}
    </>
  )
}

export default GroupList