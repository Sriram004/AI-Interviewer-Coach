import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { RoleType, InterviewExchange } from '../types/interview';
import { getInitialQuestion, getNextQuestion, roleConfigs } from '../lib/interviewLogic';
import { supabase } from '../lib/supabase';

interface InterviewSessionProps {
  sessionId: string;
  roleType: RoleType;
  onComplete: () => void;
}

export default function InterviewSession({ sessionId, roleType, onComplete }: InterviewSessionProps) {
  const [exchanges, setExchanges] = useState<InterviewExchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialQuestion = getInitialQuestion(roleType);
    setCurrentQuestion(initialQuestion);
    speakQuestion(initialQuestion);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setCurrentResponse(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [roleType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges, currentQuestion]);

  const speakQuestion = (question: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!currentResponse.trim()) return;

    setLoading(true);

    const exchange = {
      session_id: sessionId,
      sequence: exchanges.length,
      question: currentQuestion,
      response: currentResponse.trim(),
    };

    try {
      const { error } = await supabase.from('interview_exchanges').insert(exchange);
      if (error) throw error;

      setExchanges([...exchanges, exchange as InterviewExchange]);

      const allExchanges = [...exchanges, exchange];

      if (allExchanges.length >= 6) {
        await completeInterview();
        return;
      }

      const nextQ = getNextQuestion(roleType, questionIndex + 1, currentResponse);
      setCurrentQuestion(nextQ.question);
      if (!nextQ.isFollowUp) {
        setQuestionIndex(questionIndex + 1);
      }
      setCurrentResponse('');

      speakQuestion(nextQ.question);
    } catch (error) {
      console.error('Error saving response:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeInterview = async () => {
    try {
      await supabase
        .from('interview_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId);

      onComplete();
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{roleConfigs[roleType].title} Interview</h2>
            <p className="text-sm text-gray-600">Question {exchanges.length + 1} of 6</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleSpeaking}
              className={`p-3 rounded-lg transition ${
                isSpeaking
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Audio off'}
            >
              {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {exchanges.map((exchange, index) => (
            <div key={index} className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">AI</span>
                </div>
                <div className="flex-1 bg-blue-50 rounded-2xl rounded-tl-none p-4">
                  <p className="text-gray-900">{exchange.question}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="flex-1 bg-white rounded-2xl rounded-tr-none p-4 shadow-sm max-w-3xl">
                  <p className="text-gray-900">{exchange.response}</p>
                </div>
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">You</span>
                </div>
              </div>
            </div>
          ))}

          {currentQuestion && (
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold">AI</span>
              </div>
              <div className="flex-1 bg-blue-50 rounded-2xl rounded-tl-none p-4">
                <p className="text-gray-900">{currentQuestion}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitResponse();
                }
              }}
              placeholder="Type your response or use voice input..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={3}
              disabled={loading}
            />
            <div className="flex flex-col gap-2">
              {recognitionRef.current && (
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-xl transition ${
                    isListening
                      ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              )}
              <button
                onClick={handleSubmitResponse}
                disabled={loading || !currentResponse.trim()}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Submit response"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to submit, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
