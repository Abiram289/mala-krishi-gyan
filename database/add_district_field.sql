-- Add district field to user_profiles table
-- Run this in Supabase SQL Editor

-- First, check if the district column already exists
DO $$
BEGIN
    -- Add district column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'district'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN district TEXT;
        RAISE NOTICE 'Added district column to user_profiles table';
    ELSE
        RAISE NOTICE 'District column already exists in user_profiles table';
    END IF;
END $$;

-- Update the district column to use CHECK constraint for Kerala districts
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS valid_kerala_district;

ALTER TABLE user_profiles 
ADD CONSTRAINT valid_kerala_district 
CHECK (district IS NULL OR district IN (
    'Thiruvananthapuram',
    'Kollam', 
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod'
));

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;