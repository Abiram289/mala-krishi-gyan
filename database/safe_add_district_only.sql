-- SAFE: Only add district field to existing user_profiles table
-- This will NOT destroy or modify existing data
-- Run this in Supabase SQL Editor

-- Step 1: Check if user_profiles table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'user_profiles';

-- Step 2: Show current table structure (before changes)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Step 3: Add district column ONLY if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'district'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN district TEXT;
        RAISE NOTICE '✅ Successfully added district column';
    ELSE
        RAISE NOTICE '⚠️ District column already exists - no changes made';
    END IF;
END $$;

-- Step 4: Show updated table structure (after changes)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;