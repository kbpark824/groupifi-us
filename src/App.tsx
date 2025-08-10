import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ParticipantInput from './components/groups/ParticipantInput';
import GroupSizeSelector, { type GroupSizeMode } from './components/groups/GroupSizeSelector';
import GroupResults from './components/groups/GroupResults';
import Toast from './components/ui/Toast';
import { GroupGenerator } from './lib/GroupGenerator';
import { AuthPage } from './pages/AuthPage';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

interface Group {
  id: string;
  name: string;
  members: string[];
  size: number;
}

// Home page component
const HomePage: React.FC = () => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [groupMode, setGroupMode] = useState<GroupSizeMode>('fixed-size');
  const [fixedSize, setFixedSize] = useState(3);
  const [targetGroups, setTargetGroups] = useState(2);
  const [generatedGroups, setGeneratedGroups] = useState<Group[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isValidConfiguration, setIsValidConfiguration] = useState(true);

  const handleGenerateGroups = async () => {
    if (participants.length < 2) return;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Use a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const generator = new GroupGenerator();
      const options = {
        participants,
        groupSizeType: groupMode === 'fixed-size' ? 'fixed' as const : 'target' as const,
        groupSize: groupMode === 'fixed-size' ? fixedSize : targetGroups
      };
      
      const result = generator.generateGroups(options);
      
      // Convert to the format expected by GroupResults
      const formattedGroups: Group[] = result.groups.map((group, index) => ({
        id: group.id,
        name: `Group ${index + 1}`,
        members: group.members,
        size: group.size
      }));
      
      setGeneratedGroups(formattedGroups);
      setSuccessMessage(`Successfully created ${formattedGroups.length} groups!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating groups';
      setError(errorMessage);
      console.error('Error generating groups:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySuccess = () => {
    setSuccessMessage('Groups copied to clipboard!');
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const canGenerate = participants.length >= 2 && isValidConfiguration;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create Groups Instantly
          </h1>
          <p className="text-lg text-gray-600">
            Organize people into balanced groups quickly and easily
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <ParticipantInput
            participants={participants}
            onParticipantsChange={setParticipants}
          />

          <GroupSizeSelector
            mode={groupMode}
            fixedSize={fixedSize}
            targetGroups={targetGroups}
            totalParticipants={participants.length}
            onModeChange={setGroupMode}
            onFixedSizeChange={setFixedSize}
            onTargetGroupsChange={setTargetGroups}
            onValidationChange={setIsValidConfiguration}
          />

          <div className="flex justify-center">
            <button
              onClick={handleGenerateGroups}
              disabled={!canGenerate || isGenerating}
              className={`px-8 py-3 rounded-md text-white font-medium text-lg transition-colors ${
                canGenerate && !isGenerating
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        </div>

        {generatedGroups.length > 0 && (
          <GroupResults groups={generatedGroups} onCopy={handleCopySuccess} />
        )}
      </div>

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
  );
};

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Layout>
  );
}

export default App;
