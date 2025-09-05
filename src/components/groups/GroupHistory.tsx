import React, { useState, useEffect } from 'react';
import { groupingSessionsDb } from '../../lib/database';
import type { GroupingSession } from '../../lib/database';

interface GroupHistoryProps {
  groupId: string;
  onClose?: () => void;
}

const GroupHistory: React.FC<GroupHistoryProps> = ({ groupId, onClose }) => {
  const [sessions, setSessions] = useState<GroupingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await groupingSessionsDb.getByGroupId(groupId, 10);
        setSessions(data);
      } catch (err) {
        console.error('Failed to load grouping history:', err);
        setError('Failed to load grouping history');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      loadSessions();
    }
  }, [groupId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Grouping History</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Grouping History</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Grouping History</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">No grouping history yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Generate groups to start building history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Grouping History</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((session, sessionIndex) => (
          <div
            key={session.id}
            className={`border rounded-lg p-4 ${
              sessionIndex === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">
                  Session {sessions.length - sessionIndex}
                </h4>
                {sessionIndex === 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Most Recent
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(session.created_at)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {session.groups_data.map((group: any, groupIndex: number) => (
                <div
                  key={groupIndex}
                  className="bg-white border border-gray-200 rounded-md p-3"
                >
                  <div className="font-medium text-sm text-gray-900 mb-2">
                    Group {groupIndex + 1}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.map((member: string, memberIndex: number) => (
                      <span
                        key={memberIndex}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              {session.groups_data.length} groups • {session.groups_data.reduce((sum: number, group: any) => sum + group.length, 0)} participants
            </div>
          </div>
        ))}
      </div>

      {sessions.length >= 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing the 10 most recent sessions
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupHistory;