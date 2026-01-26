-- Add isVerified column to users table for creator verification badges
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN users.is_verified IS 'Whether the creator has a verified badge (blue checkmark)';
