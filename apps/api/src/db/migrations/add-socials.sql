-- Add socials column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS socials jsonb;

-- Add comment for documentation
COMMENT ON COLUMN users.socials IS 'JSON object containing social media links: twitter, github, website, linkedin, youtube, discord';
