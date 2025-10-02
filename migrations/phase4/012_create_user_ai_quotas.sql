-- ===================================================================
-- User AI Quotas (Phase 4D)
-- Per-user AI quota tracking for rate limiting
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_ai_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Quota Counters
  operation_count INTEGER NOT NULL DEFAULT 0,      -- Total operations this period
  token_count INTEGER NOT NULL DEFAULT 0,           -- Total tokens consumed
  total_cost DECIMAL(10,4) NOT NULL DEFAULT 0.00,   -- Total cost in USD

  -- Period Management (24-hour rolling window)
  period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Last Operation Tracking
  last_operation_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one quota row per user
  CONSTRAINT unique_user_quota UNIQUE(user_id)
);

-- ===================================================================
-- Indexes for Fast Queries
-- ===================================================================

-- User lookup for quota checks
CREATE INDEX idx_user_ai_quotas_user
  ON public.user_ai_quotas(user_id);

-- Period expiration queries
CREATE INDEX idx_user_ai_quotas_period_end
  ON public.user_ai_quotas(period_end);

-- ===================================================================
-- Row Level Security (RLS)
-- ===================================================================

ALTER TABLE public.user_ai_quotas ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quota
CREATE POLICY "Users can view own quota"
  ON public.user_ai_quotas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own quota
CREATE POLICY "Users can manage own quota"
  ON public.user_ai_quotas
  FOR ALL
  USING (auth.uid() = user_id);

-- ===================================================================
-- Auto-Update Trigger
-- ===================================================================

CREATE OR REPLACE FUNCTION update_user_quota_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_quota_updated
  BEFORE UPDATE ON public.user_ai_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_user_quota_timestamp();

-- ===================================================================
-- Quota Reset Function
-- ===================================================================

CREATE OR REPLACE FUNCTION public.check_quota_reset(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_ai_quotas
  SET
    operation_count = 0,
    token_count = 0,
    total_cost = 0.00,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '24 hours'
  WHERE user_id = p_user_id
    AND period_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Increment Quota Function (Atomic)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.increment_user_quota(
  p_user_id UUID,
  p_tokens INTEGER,
  p_cost DECIMAL
)
RETURNS void AS $$
BEGIN
  -- Insert or update quota record
  INSERT INTO public.user_ai_quotas (
    user_id,
    operation_count,
    token_count,
    total_cost,
    last_operation_at
  )
  VALUES (
    p_user_id,
    1,
    p_tokens,
    p_cost,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    operation_count = user_ai_quotas.operation_count + 1,
    token_count = user_ai_quotas.token_count + p_tokens,
    total_cost = user_ai_quotas.total_cost + p_cost,
    last_operation_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Comments
-- ===================================================================

COMMENT ON TABLE public.user_ai_quotas IS
  'Phase 4D: Per-user AI quota tracking. 100 operations/day limit. Resets every 24 hours.';

COMMENT ON COLUMN public.user_ai_quotas.operation_count IS
  'Number of AI operations performed in current 24-hour period';

COMMENT ON COLUMN public.user_ai_quotas.period_end IS
  'When the current quota period expires and resets';

COMMENT ON FUNCTION public.check_quota_reset IS
  'Automatically resets quota if period has expired';

COMMENT ON FUNCTION public.increment_user_quota IS
  'Atomically increments quota counters after successful AI operation';
