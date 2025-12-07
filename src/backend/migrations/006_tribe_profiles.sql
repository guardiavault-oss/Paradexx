-- Tribe Profiles Migration
-- Stores user tribe assignments and assessment history

-- Create tribe profiles table
CREATE TABLE IF NOT EXISTS user_tribe_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Current tribe assignment
    tribe VARCHAR(10) NOT NULL CHECK (tribe IN ('degen', 'regen')),
    degen_percent INTEGER NOT NULL DEFAULT 50 CHECK (degen_percent >= 0 AND degen_percent <= 100),
    regen_percent INTEGER GENERATED ALWAYS AS (100 - degen_percent) STORED,
    
    -- Assessment tracking
    assessment_history JSONB DEFAULT '[]'::jsonb,
    behavioral_metrics JSONB DEFAULT '{}'::jsonb,
    
    -- Reassessment scheduling
    next_reassessment_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    last_assessment_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessment_count INTEGER DEFAULT 1,
    
    -- Badge info
    badge_confirmed BOOLEAN DEFAULT FALSE,
    badge_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for reassessment queries
CREATE INDEX IF NOT EXISTS idx_tribe_reassessment 
ON user_tribe_profiles (next_reassessment_at) 
WHERE next_reassessment_at <= NOW();

-- Create index for tribe filtering
CREATE INDEX IF NOT EXISTS idx_tribe_type ON user_tribe_profiles (tribe);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tribe_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_tribe_profile_updated_at ON user_tribe_profiles;
CREATE TRIGGER trigger_tribe_profile_updated_at
    BEFORE UPDATE ON user_tribe_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_tribe_profile_updated_at();

-- Create tribe_assessment_logs table for analytics
CREATE TABLE IF NOT EXISTS tribe_assessment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assessment details
    assessment_type VARCHAR(30) NOT NULL CHECK (assessment_type IN ('initial_assessment', 'behavioral_reassessment', 'manual_override')),
    tribe_before VARCHAR(10),
    tribe_after VARCHAR(10) NOT NULL,
    degen_percent_before INTEGER,
    degen_percent_after INTEGER NOT NULL,
    confidence INTEGER NOT NULL DEFAULT 50,
    
    -- For behavioral assessments
    behavioral_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user assessment history
CREATE INDEX IF NOT EXISTS idx_assessment_logs_user 
ON tribe_assessment_logs (user_id, created_at DESC);

-- Insert sample data for testing (optional)
-- INSERT INTO user_tribe_profiles (user_id, tribe, degen_percent) 
-- VALUES ('test-user-id', 'degen', 65);

COMMENT ON TABLE user_tribe_profiles IS 'Stores user tribe assignments (degen/regen) and assessment history';
COMMENT ON TABLE tribe_assessment_logs IS 'Logs all tribe assessments for analytics and debugging';
