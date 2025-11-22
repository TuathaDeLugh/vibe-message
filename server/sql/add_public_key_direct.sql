-- Direct SQL to add public_key column
-- Run this manually if the migration script isn't working

-- First, check if column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'apps' 
        AND column_name = 'public_key'
    ) THEN
        -- Add the column
        ALTER TABLE apps ADD COLUMN public_key VARCHAR(100);
        
        -- Generate public keys for existing apps
        UPDATE apps 
        SET public_key = md5(random()::text || clock_timestamp()::text)::varchar(100)
        WHERE public_key IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE apps ALTER COLUMN public_key SET NOT NULL;
        
        RAISE NOTICE 'public_key column added successfully';
    ELSE
        RAISE NOTICE 'public_key column already exists';
    END IF;
END $$;

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'apps' 
ORDER BY ordinal_position;
