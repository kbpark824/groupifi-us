import React, { useState } from 'react'
import ConstraintManager from './ConstraintManager'
import { type Constraint } from '../../lib/database'

// Demo component to test ConstraintManager functionality
export const ConstraintManagerDemo: React.FC = () => {
  const [constraints, setConstraints] = useState<Constraint[]>([])
  
  // Sample data for testing
  const sampleGroupId = 'demo-group-123'
  const sampleParticipants = [
    'Alice Johnson',
    'Bob Smith', 
    'Carol Davis',
    'David Wilson',
    'Emma Brown',
    'Frank Miller'
  ]

  const handleConstraintsUpdated = (updatedConstraints: Constraint[]) => {
    setConstraints(updatedConstraints)
    console.log('Constraints updated:', updatedConstraints)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Constraint Manager Demo
        </h1>
        <p className="text-gray-600 mb-6">
          This demo shows the constraint management interface with sample participants.
          In a real application, this would be integrated with saved groups.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Sample Participants:</h3>
          <div className="flex flex-wrap gap-2">
            {sampleParticipants.map((participant, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {participant}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ConstraintManager
        groupId={sampleGroupId}
        participants={sampleParticipants}
        onConstraintsUpdated={handleConstraintsUpdated}
      />

      {/* Debug info */}
      {constraints.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Current Constraints (Debug)
          </h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(constraints, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default ConstraintManagerDemo