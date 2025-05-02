
-- Create video_analyses table to store AI analysis results
CREATE TABLE IF NOT EXISTS video_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  techniques JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  recommended_drills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_analyses_user_id ON video_analyses(user_id);

-- Add RLS policies
ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own analysis results
CREATE POLICY video_analyses_select_policy
  ON video_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert only their own analysis results
CREATE POLICY video_analyses_insert_policy
  ON video_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own analysis results
CREATE POLICY video_analyses_update_policy
  ON video_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow functions to update any analysis results (for the edge function)
CREATE POLICY video_analyses_service_update_policy
  ON video_analyses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create function to handle timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER video_analyses_updated_at
  BEFORE UPDATE ON video_analyses
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
