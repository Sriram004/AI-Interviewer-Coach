import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { RoleType } from './types/interview';
import Auth from './components/Auth';
import RoleSelection from './components/RoleSelection';
import InterviewSession from './components/InterviewSession';
import FeedbackDisplay from './components/FeedbackDisplay';
import InterviewHistory from './components/InterviewHistory';
import { LogOut } from 'lucide-react';

type AppState = 'role_selection' | 'interview' | 'feedback';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('role_selection');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<RoleType | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((async () => {
      (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      })();
    }) as any);

    return () => subscription.unsubscribe();
  }, []);

  const handleStartInterview = async (roleType: RoleType) => {
    if (!user) return;

    try {
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          role_type: roleType,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(session.id);
      setCurrentRole(roleType);
      setAppState('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const handleInterviewComplete = () => {
    setAppState('feedback');
  };

  const handleBackToHome = () => {
    setAppState('role_selection');
    setCurrentSessionId(null);
    setCurrentRole(null);
  };

  const handleViewFeedback = (sessionId: string, roleType: string) => {
    setCurrentSessionId(sessionId);
    setCurrentRole(roleType as RoleType);
    setAppState('feedback');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppState('role_selection');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => setLoading(false)} />;
  }

  if (appState === 'interview' && currentSessionId && currentRole) {
    return (
      <InterviewSession
        sessionId={currentSessionId}
        roleType={currentRole}
        onComplete={handleInterviewComplete}
      />
    );
  }

  if (appState === 'feedback' && currentSessionId && currentRole) {
    return (
      <FeedbackDisplay
        sessionId={currentSessionId}
        roleType={currentRole}
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview Practice Partner</h1>
            <p className="text-gray-600">Master your interview skills with AI-powered practice sessions</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition text-gray-700 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RoleSelection onSelectRole={handleStartInterview} />
          </div>
          <div className="lg:col-span-1">
            <InterviewHistory onViewFeedback={handleViewFeedback} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
