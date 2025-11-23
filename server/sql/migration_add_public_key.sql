-- Migration script to add public_key column to existing apps table
-- Run this on existing databases to add the new security feature

-- Add public_key column
ALTER TABLE apps ADD COLUMN IF NOT EXISTS public_key VARCHAR(100);

-- Generate public keys for existing apps (using a random value similar to secret_key)
-- Note: In production, you may want to use a proper key generation function
UPDATE apps 
SET public_key = md5(random()::text || clock_timestamp()::text)::varchar(100)
WHERE public_key IS NULL;

-- Make public_key NOT NULL after populating existing rows
ALTER TABLE apps ALTER COLUMN public_key SET NOT NULL;

-- Verify the migration
SELECT COUNT(*) as total_apps, 
       COUNT(public_key) as apps_with_public_key 
FROM apps;
