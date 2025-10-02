-- Phase 4A Migration: AI Operations Tracking
-- Purpose: Track AI usage for cost monitoring and quota enforcement
-- DO NOT APPLY THIS MIGRATION DIRECTLY - Wait for user approval

-- AI operations tracking table
CREATE TABLE IF NOT EXISTS public.ai_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'generate', 'enhance', 'match')),
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost DECIMAL(10,4),
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_operations_user_id ON public.ai_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_operations_created_at ON public.ai_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_operations_type ON public.ai_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_operations_user_date ON public.ai_operations(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI operations"
  ON public.ai_operations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI operations"
  ON public.ai_operations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies - records are immutable for audit trail

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.ai_operations TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.ai_operations IS 'Tracks AI API usage for cost monitoring and quota enforcement';
COMMENT ON COLUMN public.ai_operations.operation_type IS 'Type of AI operation: import, generate, enhance, match';
COMMENT ON COLUMN public.ai_operations.input_tokens IS 'Number of input tokens used';
COMMENT ON COLUMN public.ai_operations.output_tokens IS 'Number of output tokens generated';
COMMENT ON COLUMN public.ai_operations.cost IS 'Cost in USD (calculated from token usage)';
COMMENT ON COLUMN public.ai_operations.duration_ms IS 'Operation duration in milliseconds';
COMMENT ON COLUMN public.ai_operations.success IS 'Whether the operation completed successfully';
COMMENT ON COLUMN public.ai_operations.error_message IS 'Error message if operation failed';
