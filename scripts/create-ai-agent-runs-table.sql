-- Create ai_agent_runs table with proper foreign key relationship to ai_agents
CREATE TABLE IF NOT EXISTS ai_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_agent_id ON ai_agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_user_id ON ai_agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_status ON ai_agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_created_at ON ai_agent_runs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_agent_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own agent runs"
  ON ai_agent_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent runs"
  ON ai_agent_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent runs"
  ON ai_agent_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent runs"
  ON ai_agent_runs FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_agent_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_agent_runs_updated_at
  BEFORE UPDATE ON ai_agent_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_agent_runs_updated_at();
