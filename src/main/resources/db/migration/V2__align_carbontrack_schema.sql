CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    admin_user_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    activity_type_id UUID REFERENCES activity_types(id),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    potential_reduction_kg NUMERIC(12,4),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Additive fields used by the selected ERD. Review type compatibility before applying.
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) NOT NULL DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_unit VARCHAR(20) NOT NULL DEFAULT 'kgCO2e';

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,4);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS emission_factor_id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS source VARCHAR(40) NOT NULL DEFAULT 'MANUAL';

ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS source_version VARCHAR(50);
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS region VARCHAR(50) NOT NULL DEFAULT 'GLOBAL';

ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS target_reduction_pct NUMERIC(5,2);
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS period_days INTEGER;
ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';


