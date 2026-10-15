
-- 1. USERS TABLE

CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       first_name VARCHAR(100),
                       last_name VARCHAR(100),
                       display_name VARCHAR(150),
                       role VARCHAR(20) NOT NULL DEFAULT 'USER'
                           CHECK (role IN ('USER', 'ADMIN', 'ORG_ADMIN')),
                       is_active BOOLEAN NOT NULL DEFAULT TRUE,
                       timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
                       preferred_unit VARCHAR(20) NOT NULL DEFAULT 'kgCO2e'
                           CHECK (preferred_unit IN ('kgCO2e', 'gCO2e', 'lbCO2e')),
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);


-- 2. ORGANIZATIONS TABLE

CREATE TABLE organizations (
                               id BIGSERIAL PRIMARY KEY,
                               name VARCHAR(200) NOT NULL,
                               organization_type VARCHAR(40) NOT NULL DEFAULT 'COMPANY'
                                   CHECK (organization_type IN ('COMPANY', 'UNIVERSITY', 'NGO', 'GOVERNMENT', 'OTHER')),
                               description TEXT,
                               logo_url TEXT,
                               is_active BOOLEAN NOT NULL DEFAULT TRUE,
                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                               updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_active ON organizations(is_active);


-- 3. ORGANIZATION_MEMBERS TABLE

CREATE TABLE organization_members (
                                      id BIGSERIAL PRIMARY KEY,
                                      organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                                      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                      role VARCHAR(25) NOT NULL DEFAULT 'MEMBER'
                                          CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
                                      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                      UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);


-- 4. USER_PROFILES TABLE

CREATE TABLE user_profiles (
                               id BIGSERIAL PRIMARY KEY,
                               user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                               country VARCHAR(100),
                               city VARCHAR(100),
                               region VARCHAR(100),
                               household_size SMALLINT,
                               electricity_source VARCHAR(50) DEFAULT 'GRID',
                               lifestyle_type VARCHAR(50) DEFAULT 'STANDARD'
                                   CHECK (lifestyle_type IN ('LOW_IMPACT', 'STANDARD', 'HIGH_IMPACT')),
                               monthly_target_kgco2e NUMERIC(10,2),
                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                               updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- 5. ACTIVITY_CATEGORIES TABLE

CREATE TABLE activity_categories (
                                     id SMALLSERIAL PRIMARY KEY,
                                     name VARCHAR(80) NOT NULL UNIQUE,
                                     description TEXT,
                                     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_name ON activity_categories(name);


-- 6. ACTIVITY_TYPES TABLE

CREATE TABLE activity_types (
                                id SMALLSERIAL PRIMARY KEY,
                                category_id SMALLINT NOT NULL REFERENCES activity_categories(id),
                                name VARCHAR(100) NOT NULL,
                                unit_type VARCHAR(40) NOT NULL
                                    CHECK (unit_type IN ('distance', 'kwh', 'kg', 'quantity', 'hours', 'cost', 'items')),
                                description TEXT,
                                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                UNIQUE (category_id, name)
);

CREATE INDEX idx_activity_types_category ON activity_types(category_id);
CREATE INDEX idx_activity_types_active ON activity_types(is_active);


-- 7. EMISSION_FACTORS TABLE

CREATE TABLE emission_factors (
                                  id BIGSERIAL PRIMARY KEY,
                                  activity_type_id SMALLINT NOT NULL REFERENCES activity_types(id),
                                  source_name VARCHAR(100) NOT NULL,
                                  source_version VARCHAR(50),
                                  factor_value NUMERIC(12,6) NOT NULL CHECK (factor_value >= 0),
                                  unit VARCHAR(30) NOT NULL,
                                  region VARCHAR(100),
                                  scope VARCHAR(30) NOT NULL DEFAULT 'DIRECT'
                                      CHECK (scope IN ('DIRECT', 'INDIRECT', 'COMBINED')),
                                  valid_from TIMESTAMPTZ NOT NULL,
                                  valid_to TIMESTAMPTZ,
                                  is_active BOOLEAN NOT NULL DEFAULT TRUE,
                                  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                  created_by BIGINT REFERENCES users(id),
                                  notes TEXT
);

CREATE INDEX idx_emission_factors_activity ON emission_factors(activity_type_id);
CREATE INDEX idx_emission_factors_valid_dates ON emission_factors(valid_from, valid_to);
CREATE INDEX idx_emission_factors_active ON emission_factors(is_active);

-- 8. ACTIVITY_LOGS TABLE

CREATE TABLE activity_logs (
                               id BIGSERIAL PRIMARY KEY,
                               user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               organization_id BIGINT REFERENCES organizations(id),
                               category_id SMALLINT NOT NULL REFERENCES activity_categories(id),
                               activity_type_id SMALLINT NOT NULL REFERENCES activity_types(id),
                               emission_factor_id BIGINT REFERENCES emission_factors(id),
                               log_date DATE NOT NULL,
                               quantity NUMERIC(12,4) NOT NULL CHECK (quantity >= 0),
                               unit VARCHAR(30) NOT NULL,
                               notes TEXT,
                               source VARCHAR(40) NOT NULL DEFAULT 'MANUAL'
                                   CHECK (source IN ('MANUAL', 'CSV_IMPORT', 'API', 'MOBILE', 'BATCH')),
                               raw_metadata JSONB,
                               co2e_kg NUMERIC(12,4) NOT NULL CHECK (co2e_kg >= 0),
                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                               updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, log_date);
CREATE INDEX idx_activity_logs_user_category ON activity_logs(user_id, category_id, log_date);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type_id);
CREATE INDEX idx_activity_logs_org ON activity_logs(organization_id);


-- 9. ACTIVITY_LOG_AUDIT TABLE

CREATE TABLE activity_log_audit (
                                    id BIGSERIAL PRIMARY KEY,
                                    activity_log_id BIGINT NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
                                    changed_by BIGINT REFERENCES users(id),
                                    field_name VARCHAR(100) NOT NULL,
                                    old_value TEXT,
                                    new_value TEXT,
                                    change_reason TEXT,
                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_activity_log ON activity_log_audit(activity_log_id);
CREATE INDEX idx_audit_changed_by ON activity_log_audit(changed_by);


-- 10. GOALS TABLE

CREATE TABLE goals (
                       id BIGSERIAL PRIMARY KEY,
                       user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       organization_id BIGINT REFERENCES organizations(id),
                       category_id SMALLINT REFERENCES activity_categories(id),
                       title VARCHAR(180) NOT NULL,
                       goal_type VARCHAR(40) NOT NULL
                           CHECK (goal_type IN ('REDUCE_CO2E', 'REDUCE_CATEGORY', 'ENERGY_SAVINGS', 'WASTE_REDUCTION', 'STREAK')),
                       target_value NUMERIC(12,2) NOT NULL CHECK (target_value >= 0),
                       target_unit VARCHAR(30) NOT NULL,
                       period_type VARCHAR(20) NOT NULL
                           CHECK (period_type IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
                       start_date DATE NOT NULL,
                       end_date DATE,
                       status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED')),
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_goals_org ON goals(organization_id);

-- 11. GOAL_PROGRESS TABLE

CREATE TABLE goal_progress (
                               id BIGSERIAL PRIMARY KEY,
                               goal_id BIGINT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
                               period_start DATE NOT NULL,
                               period_end DATE NOT NULL,
                               actual_value NUMERIC(12,2) NOT NULL DEFAULT 0,
                               target_value NUMERIC(12,2) NOT NULL,
                               percent_achieved NUMERIC(5,2) NOT NULL DEFAULT 0,
                               updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                               UNIQUE (goal_id, period_start, period_end)
);

CREATE INDEX idx_goal_progress_goal ON goal_progress(goal_id);


-- 12. BADGES TABLE

CREATE TABLE badges (
                        id SMALLSERIAL PRIMARY KEY,
                        code VARCHAR(80) NOT NULL UNIQUE,
                        name VARCHAR(120) NOT NULL,
                        description TEXT,
                        icon_url TEXT,
                        badge_type VARCHAR(40) NOT NULL
                            CHECK (badge_type IN ('CONSISTENCY', 'REDUCTION', 'LEADERBOARD', 'COMMUNITY', 'MONTHLY', 'SPECIAL')),
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_badges_code ON badges(code);


-- 13. USER_BADGES TABLE

CREATE TABLE user_badges (
                             id BIGSERIAL PRIMARY KEY,
                             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             badge_id SMALLINT NOT NULL REFERENCES badges(id),
                             earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                             source_event VARCHAR(120),
                             UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);


-- 14. LEADERBOARD TABLE

CREATE TABLE leaderboard (
                             id BIGSERIAL PRIMARY KEY,
                             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             organization_id BIGINT REFERENCES organizations(id),
                             period_start DATE NOT NULL,
                             period_end DATE NOT NULL,
                             total_co2e_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
                             score NUMERIC(12,2) NOT NULL DEFAULT 0,
                             rank_position INTEGER,
                             created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                             UNIQUE (user_id, organization_id, period_start, period_end)
);

CREATE INDEX idx_leaderboard_period ON leaderboard(organization_id, period_end);
CREATE INDEX idx_leaderboard_user ON leaderboard(user_id);


-- 15. RECOMMENDATIONS TABLE

CREATE TABLE recommendations (
                                 id BIGSERIAL PRIMARY KEY,
                                 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 category_id SMALLINT REFERENCES activity_categories(id),
                                 activity_type_id SMALLINT REFERENCES activity_types(id),
                                 recommendation_type VARCHAR(50) NOT NULL
                                     CHECK (recommendation_type IN ('REDUCE', 'SWAP', 'OPTIMIZE', 'LEARN', 'GOAL_HINT')),
                                 title VARCHAR(200) NOT NULL,
                                 description TEXT NOT NULL,
                                 estimated_co2e_savings_kg NUMERIC(12,2) DEFAULT 0,
                                 priority SMALLINT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
                                 generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                 expires_at TIMESTAMPTZ,
                                 is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_recommendations_user_active ON recommendations(user_id, is_active);


-- 16. USER_SESSIONS TABLE

CREATE TABLE user_sessions (
                               id BIGSERIAL PRIMARY KEY,
                               user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               token_hash VARCHAR(255) NOT NULL,
                               refresh_token_hash VARCHAR(255),
                               ip_address INET,
                               user_agent TEXT,
                               expires_at TIMESTAMPTZ NOT NULL,
                               revoked_at TIMESTAMPTZ,
                               created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- 17. TRIGGER FUNCTIONS

CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users
CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Attach trigger to organizations
CREATE TRIGGER trg_organizations_updated
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Attach trigger to user_profiles
CREATE TRIGGER trg_user_profiles_updated
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Attach trigger to activity_logs
CREATE TRIGGER trg_activity_logs_updated
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Attach trigger to goals
CREATE TRIGGER trg_goals_updated
    BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Attach trigger to goal_progress
CREATE TRIGGER trg_goal_progress_updated
    BEFORE UPDATE ON goal_progress
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
