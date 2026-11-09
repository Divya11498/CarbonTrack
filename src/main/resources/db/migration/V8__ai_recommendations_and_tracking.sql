-- ==============================================================================
-- Flyway Migration V8: AI Recommendations and Tracking System
-- Enhances recommendations table with category, problem analysis, difficulty,
-- priority, lifecycle status (ACTIVE, IN_PROGRESS, COMPLETED, DISMISSED),
-- and actual vs estimated carbon savings tracking.
-- ==============================================================================

-- 1. Relax or drop existing recommendation_type check if present
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_recommendation_type_check;

-- 2. Add AI recommendation columns if they don't already exist
ALTER TABLE recommendations
    ADD COLUMN IF NOT EXISTS category_name VARCHAR(50) DEFAULT 'Carbon Reduction',
    ADD COLUMN IF NOT EXISTS problem_identified TEXT,
    ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS timeframe VARCHAR(50) DEFAULT '1-2 weeks',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS actual_co2e_savings_kg NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100) DEFAULT 'CarbonTrack Analytics Engine';

-- 3. Add constraint for status lifecycle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_recommendations_status'
    ) THEN
        ALTER TABLE recommendations
            ADD CONSTRAINT chk_recommendations_status
            CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED'));
    END IF;
END $$;

-- 4. Create indexes for performant retrieval and user tracking
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status
    ON recommendations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_generated
    ON recommendations(user_id, generated_at DESC);
