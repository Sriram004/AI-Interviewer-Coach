export interface InterviewSession {
  id: string;
  user_id: string;
  role_type: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface InterviewExchange {
  id: string;
  session_id: string;
  sequence: number;
  question: string;
  response: string;
  created_at: string;
}

export interface InterviewFeedback {
  id: string;
  session_id: string;
  overall_score: number;
  communication_score: number;
  technical_score: number;
  strengths: string;
  improvements: string;
  detailed_feedback: string;
  created_at: string;
}

export type RoleType = 'sales' | 'engineer' | 'retail_associate' | 'marketing' | 'customer_service';
