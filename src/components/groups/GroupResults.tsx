import React, { useState } from 'react';

interface Group {
  id: string;
  name: string;
  members: string[];
  size: number;
}

interface GroupResultsProps {
  groups: Group[];
  onCopy?: () => void;
}

const GroupResults: React.FC<GroupResultsProps> = ({ groups, onCopy }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      // Format groups as text for copying
      const groupsText = groups
        .map((group, index) => {
          const groupName = `Group ${index + 1}`;
          const members = group.members.join(', ');
          return `${groupName}: ${members}`;
        })
        .join('\n');

      await navigator.clipboard.writeText(groupsText);
      setCopySuccess(true);
      onCopy?.();
      
      // Reset success message after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (groups.length === 0) {
    return null;
  }

  const totalParticipants = groups.reduce((sum, group) => sum + group.members.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Generated Groups</h3>
          <p className="text-sm text-gray-600">
            {groups.length} groups • {totalParticipants} participants
          </p>
        </div>
        <button
          onClick={handleCopyToClipboard}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
            copySuccess
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {copySuccess ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Results
            </>
          )}
        </button>
      </div>

      {/* Table Display */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups.map((group, index) => (
              <tr key={group.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Group {index + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {group.members.map((member, memberIndex) => (
                      <span
                        key={memberIndex}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {group.members.length} {group.members.length === 1 ? 'person' : 'people'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alternative Card View for Mobile */}
      <div className="sm:hidden space-y-3">
        {groups.map((group, index) => (
          <div key={group.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-medium text-gray-900">Group {index + 1}</h4>
              <span className="text-sm text-gray-500">
                {group.members.length} {group.members.length === 1 ? 'person' : 'people'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {group.members.map((member, memberIndex) => (
                <span
                  key={memberIndex}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {member}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupResults;