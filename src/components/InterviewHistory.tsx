import { useEffect, useState } from 'react';
import { Clock, Award, ChevronRight } from 'lucide-react';
import { InterviewSession, InterviewFeedback } from '../types/interview';
import { supabase } from '../lib/supabase';
import { roleConfigs } from '../lib/interviewLogic';

interface InterviewHistoryProps {
  onViewFeedback: (sessionId: string, roleType: string) => void;
}

export default function InterviewHistory({ onViewFeedback }: InterviewHistoryProps) {
  const [sessions, setSessions] = useState<(InterviewSession & { feedback?: InterviewFeedback })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: sessionsData } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (sessionsData) {
        const sessionsWithFeedback = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: feedback } = await supabase
              .from('interview_feedback')
              .select('*')
              .eq('session_id', session.id)
              .maybeSingle();

            return { ...session, feedback: feedback || undefined };
          })
        );

        setSessions(sessionsWithFeedback);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No interview history yet</p>
        <p className="text-sm text-gray-500 mt-1">Complete an interview to see your progress here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <Clock className="w-6 h-6" />
        Recent Interviews
      </h3>

      <div className="space-y-3">
        {sessions.map((session) => {
          const config = roleConfigs[session.role_type as keyof typeof roleConfigs];
          const date = new Date(session.completed_at!);

          return (
            <button
              key={session.id}
              onClick={() => onViewFeedback(session.id, session.role_type)}
              className="w-full bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-500 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{config?.title || session.role_type}</h4>
                  <p className="text-sm text-gray-600">
                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {session.feedback && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Score: {session.feedback.overall_score}/10
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
