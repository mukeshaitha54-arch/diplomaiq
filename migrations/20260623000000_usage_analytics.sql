CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    feature_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own analytics"
    ON usage_analytics FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view their own analytics"
    ON usage_analytics FOR SELECT
    USING (auth.uid() = profile_id);

-- Indexes for Admin Dashboard queries later
CREATE INDEX idx_usage_analytics_action_type ON usage_analytics(action_type);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics(created_at);
