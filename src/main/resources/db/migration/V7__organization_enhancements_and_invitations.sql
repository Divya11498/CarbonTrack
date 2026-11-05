-- ==============================================================================
-- Flyway Migration V7: Organization enhancements, fields and invitation system
-- ==============================================================================

-- 1. Add website and contact_email to organizations
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- 2. Add department to organization_members
ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Engineering';

-- 3. Create organization_invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(25) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
    department VARCHAR(100) DEFAULT 'Engineering',
    invitation_token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
    invited_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(invitation_token);
