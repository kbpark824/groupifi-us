import React, { useEffect } from 'react';

export type GroupSizeMode = 'fixed-size' | 'target-groups';

interface GroupSizeSelectorProps {
  mode: GroupSizeMode;
  fixedSize: number;
  targetGroups: number;
  totalParticipants: number;
  onModeChange: (mode: GroupSizeMode) => void;
  onFixedSizeChange: (size: number) => void;
  onTargetGroupsChange: (groups: number) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const GroupSizeSelector: React.FC<GroupSizeSelectorProps> = ({
  mode,
  fixedSize,
  targetGroups,
  totalParticipants,
  onModeChange,
  onFixedSizeChange,
  onTargetGroupsChange,
  onValidationChange,
}) => {
  const calculatePreview = () => {
    if (totalParticipants < 2) return null;

    if (mode === 'fixed-size') {
      if (fixedSize > totalParticipants) {
        return `⚠️ Group size cannot be larger than total participants (${totalParticipants})`;
      }
      
      const numGroups = Math.ceil(totalParticipants / fixedSize);
      const remainder = totalParticipants % fixedSize;
      const fullGroups = Math.floor(totalParticipants / fixedSize);
      
      if (remainder === 0) {
        return `${numGroups} groups of ${fixedSize} people each`;
      } else {
        return `${fullGroups} groups of ${fixedSize} people, 1 group of ${remainder} people`;
      }
    } else {
      if (targetGroups > totalParticipants) {
        return `⚠️ Cannot create more groups than participants (${totalParticipants})`;
      }
      
      const baseSize = Math.floor(totalParticipants / targetGroups);
      const remainder = totalParticipants % targetGroups;
      
      if (baseSize === 0) {
        return `⚠️ Too many groups requested - would result in empty groups`;
      }
      
      if (remainder === 0) {
        return `${targetGroups} groups of ${baseSize} people each`;
      } else {
        return `${remainder} groups of ${baseSize + 1} people, ${targetGroups - remainder} groups of ${baseSize} people`;
      }
    }
  };

  const hasValidConfiguration = () => {
    if (totalParticipants < 2) return false;
    
    if (mode === 'fixed-size') {
      return fixedSize <= totalParticipants && fixedSize >= 1;
    } else {
      return targetGroups <= totalParticipants && targetGroups >= 1 && Math.floor(totalParticipants / targetGroups) > 0;
    }
  };

  const preview = calculatePreview();
  const isValid = hasValidConfiguration();

  // Notify parent component of validation changes
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Group Size Options</h3>
        
        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="groupMode"
              value="fixed-size"
              checked={mode === 'fixed-size'}
              onChange={() => onModeChange('fixed-size')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Fixed Group Size</div>
              <div className="text-sm text-gray-600">
                Create groups with a specific number of people (some groups may be smaller)
              </div>
              {mode === 'fixed-size' && (
                <div className="mt-2">
                  <label htmlFor="fixedSize" className="block text-sm font-medium text-gray-700">
                    People per group
                  </label>
                  <input
                    type="number"
                    id="fixedSize"
                    min="2"
                    max="10"
                    value={fixedSize}
                    onChange={(e) => onFixedSizeChange(parseInt(e.target.value) || 2)}
                    className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </label>

          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="groupMode"
              value="target-groups"
              checked={mode === 'target-groups'}
              onChange={() => onModeChange('target-groups')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Target Number of Groups</div>
              <div className="text-sm text-gray-600">
                Create a specific number of groups with balanced sizes
              </div>
              {mode === 'target-groups' && (
                <div className="mt-2">
                  <label htmlFor="targetGroups" className="block text-sm font-medium text-gray-700">
                    Number of groups
                  </label>
                  <input
                    type="number"
                    id="targetGroups"
                    min="2"
                    max={Math.floor(totalParticipants / 2)}
                    value={targetGroups}
                    onChange={(e) => onTargetGroupsChange(parseInt(e.target.value) || 2)}
                    className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Preview */}
      {preview && totalParticipants >= 2 && (
        <div className={`border rounded-md p-3 ${
          hasValidConfiguration() 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {hasValidConfiguration() ? (
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                hasValidConfiguration() ? 'text-blue-800' : 'text-yellow-800'
              }`}>
                {hasValidConfiguration() ? 'Preview' : 'Configuration Issue'}
              </h4>
              <p className={`text-sm mt-1 ${
                hasValidConfiguration() ? 'text-blue-700' : 'text-yellow-700'
              }`}>
                {hasValidConfiguration() 
                  ? `With ${totalParticipants} participants: ${preview}`
                  : preview
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSizeSelector;