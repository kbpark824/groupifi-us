import React, { useState, useCallback, useEffect } from 'react';

interface ParticipantInputProps {
  participants: string[];
  onParticipantsChange: (participants: string[]) => void;
}

const ParticipantInput: React.FC<ParticipantInputProps> = ({
  participants,
  onParticipantsChange,
}) => {

  const [errors, setErrors] = useState<string[]>([]);

  const validateParticipants = useCallback((participantList: string[]) => {
    const newErrors: string[] = [];
    
    // Check for empty names
    const emptyNames = participantList.filter(name => !name.trim());
    if (emptyNames.length > 0) {
      newErrors.push('All participant names must be non-empty');
    }

    // Check for duplicates (case-insensitive)
    const trimmedNames = participantList.map(name => name.trim());
    const uniqueNames = new Set(trimmedNames.map(name => name.toLowerCase()));
    if (uniqueNames.size !== trimmedNames.length) {
      newErrors.push('Duplicate names are not allowed');
    }

    // Check minimum participants
    if (participantList.length < 2) {
      newErrors.push('At least 2 participants are required');
    }

    // Check maximum participants
    if (participantList.length > 100) {
      newErrors.push('Maximum of 100 participants allowed');
    }

    // Check for very long names
    const longNames = participantList.filter(name => name.trim().length > 50);
    if (longNames.length > 0) {
      newErrors.push('Participant names must be 50 characters or less');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, []);

  const [textareaValue, setTextareaValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextareaValue(value);
    
    // Parse participants from textarea (one per line)
    const participantList = value
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    validateParticipants(participantList);
    onParticipantsChange(participantList);
  };



  const handleRemoveParticipant = (index: number) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    const newTextareaValue = newParticipants.join('\n');
    setTextareaValue(newTextareaValue);
    validateParticipants(newParticipants);
    onParticipantsChange(newParticipants);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-2">
          Participants
        </label>
        <textarea
          id="participants"
          value={textareaValue}
          onChange={handleInputChange}
          placeholder="Enter participant names (one per line)&#10;John Smith&#10;Jane Doe&#10;Mike Johnson"
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.length > 0 ? 'border-red-300' : 'border-gray-300'
          }`}
          rows={8}
        />
      </div>

      {/* Display current participants as tags */}
      {participants.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Current Participants ({participants.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {participant}
                <button
                  onClick={() => handleRemoveParticipant(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                  aria-label={`Remove ${participant}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Display validation errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following issues:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantInput;