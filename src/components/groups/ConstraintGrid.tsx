import React, { useState } from 'react'
import type { Constraint, ConstraintType } from '../../lib/database'

interface ConstraintGridProps {
  participants: string[]
  constraints: Constraint[]
  onCreateConstraint: (personA: string, personB: string, constraintType: ConstraintType) => void
  onUpdateConstraint: (constraintId: string, constraintType: ConstraintType) => void
  onDeleteConstraint: (constraintId: string) => void
  isUpdating: boolean
}

const CONSTRAINT_TYPES = [
  { value: 'hard_together', label: 'Hard Together', color: 'bg-green-500', description: 'Must be together' },
  { value: 'hard_apart', label: 'Hard Apart', color: 'bg-red-500', description: 'Must be apart' },
  { value: 'soft_together', label: 'Soft Together', color: 'bg-green-300', description: 'Prefer together' },
  { value: 'soft_apart', label: 'Soft Apart', color: 'bg-red-300', description: 'Prefer apart' }
]

export const ConstraintGrid: React.FC<ConstraintGridProps> = ({
  participants,
  constraints,
  onCreateConstraint,
  onUpdateConstraint,
  onDeleteConstraint,
  isUpdating
}) => {
  const [selectedConstraintType, setSelectedConstraintType] = useState('hard_together')
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ personA: string; personB: string } | null>(null)

  // Get existing constraint between two people
  const getConstraintBetween = (personA: string, personB: string): Constraint | null => {
    return constraints.find(c => 
      (c.person_a === personA && c.person_b === personB) ||
      (c.person_a === personB && c.person_b === personA)
    ) || null
  }

  // Handle cell click
  const handleCellClick = (personA: string, personB: string) => {
    if (isUpdating) return

    const existingConstraint = getConstraintBetween(personA, personB)
    
    if (existingConstraint) {
      // If constraint exists, show type selector to change or delete
      setSelectedCell({ personA, personB })
      setShowTypeSelector(true)
    } else {
      // If no constraint exists, create one with selected type
      onCreateConstraint(personA, personB, selectedConstraintType as ConstraintType)
    }
  }

  // Handle constraint type change
  const handleConstraintTypeChange = (constraintType: string) => {
    if (!selectedCell) return

    const existingConstraint = getConstraintBetween(selectedCell.personA, selectedCell.personB)
    
    if (existingConstraint) {
      if (constraintType === 'delete') {
        onDeleteConstraint(existingConstraint.id)
      } else {
        onUpdateConstraint(existingConstraint.id, constraintType as ConstraintType)
      }
    }
    
    setShowTypeSelector(false)
    setSelectedCell(null)
  }

  // Get cell appearance based on constraint
  const getCellAppearance = (personA: string, personB: string) => {
    const constraint = getConstraintBetween(personA, personB)
    
    if (!constraint) {
      return {
        className: 'bg-gray-100 hover:bg-gray-200 cursor-pointer',
        content: '+'
      }
    }

    const constraintType = CONSTRAINT_TYPES.find(t => t.value === constraint.constraint_type)
    return {
      className: `${constraintType?.color} hover:opacity-80 cursor-pointer text-white`,
      content: constraintType?.label.split(' ').map(w => w[0]).join('') || '?'
    }
  }

  if (participants.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Add at least 2 participants to create constraints</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Constraint Type Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">New constraint type:</span>
        {CONSTRAINT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedConstraintType(type.value)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedConstraintType === type.value
                ? `${type.color} text-white`
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${type.color}`}></div>
            {type.label}
          </button>
        ))}
      </div>

      {/* Constraint Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="w-32"></th>
                {participants.map((participant) => (
                  <th
                    key={participant}
                    className="px-2 py-2 text-xs font-medium text-gray-700 text-center min-w-[80px]"
                  >
                    <div className="truncate" title={participant}>
                      {participant}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((personA, indexA) => (
                <tr key={personA}>
                  <td className="px-2 py-2 text-xs font-medium text-gray-700 text-right">
                    <div className="truncate" title={personA}>
                      {personA}
                    </div>
                  </td>
                  {participants.map((personB, indexB) => {
                    if (indexA >= indexB) {
                      // Empty cells for diagonal and lower triangle
                      return (
                        <td key={personB} className="px-1 py-1">
                          <div className="w-12 h-8"></div>
                        </td>
                      )
                    }

                    const cellAppearance = getCellAppearance(personA, personB)
                    
                    return (
                      <td key={personB} className="px-1 py-1">
                        <button
                          onClick={() => handleCellClick(personA, personB)}
                          disabled={isUpdating}
                          className={`w-12 h-8 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cellAppearance.className}`}
                          title={`${personA} & ${personB}`}
                        >
                          {cellAppearance.content}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Click empty cells (+) to add a constraint of the selected type</p>
        <p>• Click existing constraints to modify or remove them</p>
        <p>• Hard constraints are enforced strictly, soft constraints are preferences</p>
      </div>

      {/* Type Selector Modal */}
      {showTypeSelector && selectedCell && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowTypeSelector(false)}
            />

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Constraint for {selectedCell.personA} & {selectedCell.personB}
                    </h3>
                    
                    <div className="space-y-2">
                      {CONSTRAINT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleConstraintTypeChange(type.value)}
                          className="w-full flex items-center px-3 py-2 text-sm text-left rounded-md hover:bg-gray-100"
                        >
                          <div className={`w-3 h-3 rounded-full mr-3 ${type.color}`}></div>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </button>
                      ))}
                      
                      <hr className="my-2" />
                      
                      <button
                        onClick={() => handleConstraintTypeChange('delete')}
                        className="w-full flex items-center px-3 py-2 text-sm text-left rounded-md hover:bg-red-50 text-red-600"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove Constraint
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowTypeSelector(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConstraintGrid