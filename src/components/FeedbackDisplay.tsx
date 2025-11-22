import { useEffect, useState } from 'react';
import { Award, TrendingUp, MessageSquare, Target, ArrowLeft } from 'lucide-react';
import { InterviewFeedback, InterviewExchange } from '../types/interview';
import { supabase } from '../lib/supabase';
import { generateFeedback } from '../lib/interviewLogic';

interface FeedbackDisplayProps {
  sessionId: string;
  roleType: string;
  onBack: () => void;
}

export default function FeedbackDisplay({ sessionId, roleType, onBack }: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrGenerateFeedback();
  }, [sessionId]);

  const loadOrGenerateFeedback = async () => {
    try {
      const { data: existingFeedback } = await supabase
        .from('interview_feedback')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingFeedback) {
        setFeedback(existingFeedback);
      } else {
        const { data: exchanges } = await supabase
          .from('interview_exchanges')
          .select('*')
          .eq('session_id', sessionId)
          .order('sequence', { ascending: true });

        if (exchanges && exchanges.length > 0) {
          const generatedFeedback = generateFeedback(roleType as any, exchanges);

          const { data: savedFeedback, error } = await supabase
            .from('interview_feedback')
            .insert({
              session_id: sessionId,
              ...generatedFeedback,
            })
            .select()
            .single();

          if (error) throw error;
          setFeedback(savedFeedback);
        }
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your interview performance...</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No feedback available</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
            <p className="text-gray-600">Here's your performance analysis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`${getScoreBgColor(feedback.overall_score)} rounded-xl p-6 text-center`}>
              <Target className={`w-8 h-8 ${getScoreColor(feedback.overall_score)} mx-auto mb-2`} />
              <p className="text-sm text-gray-600 mb-1">Overall Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(feedback.overall_score)}`}>
                {feedback.overall_score}/10
              </p>
            </div>

            <div className={`${getScoreBgColor(feedback.communication_score)} rounded-xl p-6 text-center`}>
              <MessageSquare className={`w-8 h-8 ${getScoreColor(feedback.communication_score)} mx-auto mb-2`} />
              <p className="text-sm text-gray-600 mb-1">Communication</p>
              <p className={`text-4xl font-bold ${getScoreColor(feedback.communication_score)}`}>
                {feedback.communication_score}/10
              </p>
            </div>

            <div className={`${getScoreBgColor(feedback.technical_score)} rounded-xl p-6 text-center`}>
              <TrendingUp className={`w-8 h-8 ${getScoreColor(feedback.technical_score)} mx-auto mb-2`} />
              <p className="text-sm text-gray-600 mb-1">Content Quality</p>
              <p className={`text-4xl font-bold ${getScoreColor(feedback.technical_score)}`}>
                {feedback.technical_score}/10
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Strengths
              </h3>
              <p className="text-green-800">{feedback.strengths}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Areas for Improvement
              </h3>
              <p className="text-blue-800">{feedback.improvements}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Feedback</h3>
              <div className="text-gray-700 whitespace-pre-line">{feedback.detailed_feedback}</div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onBack}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Practice Another Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
