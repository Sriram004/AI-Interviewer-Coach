/*
  # Interview Practice Partner Database Schema

  1. New Tables
    - `interview_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, reference to auth.users) - tracks which user did the interview
      - `role_type` (text) - the job role (e.g., 'sales', 'engineer', 'retail_associate')
      - `status` (text) - 'in_progress', 'completed'
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
    
    - `interview_exchanges`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to interview_sessions)
      - `sequence` (integer) - order of the exchange
      - `question` (text) - the interviewer's question
      - `response` (text) - the user's response
      - `created_at` (timestamptz)
    
    - `interview_feedback`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to interview_sessions, unique)
      - `overall_score` (integer) - 1-10 rating
      - `communication_score` (integer) - 1-10 rating
      - `technical_score` (integer) - 1-10 rating
      - `strengths` (text) - what went well
      - `improvements` (text) - areas to improve
      - `detailed_feedback` (text) - comprehensive feedback
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own interview sessions
    - Users can only view exchanges and feedback for their own sessions
*/

CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role_type text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS interview_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  sequence integer NOT NULL,
  question text NOT NULL,
  response text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  overall_score integer NOT NULL,
  communication_score integer NOT NULL,
  technical_score integer NOT NULL,
  strengths text NOT NULL,
  improvements text NOT NULL,
  detailed_feedback text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview sessions"
  ON interview_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions"
  ON interview_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions"
  ON interview_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view exchanges for own sessions"
  ON interview_exchanges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = interview_exchanges.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exchanges for own sessions"
  ON interview_exchanges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = interview_exchanges.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view feedback for own sessions"
  ON interview_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = interview_feedback.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feedback for own sessions"
  ON interview_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = interview_feedback.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_exchanges_session_id ON interview_exchanges(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_session_id ON interview_feedback(session_id);