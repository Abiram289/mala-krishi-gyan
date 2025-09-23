-- Add district column to user_profiles table
-- Run this in Supabase SQL Editor

-- Add the district column to the existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN district TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN user_profiles.district IS 'Kerala district for region-specific farming advice';

-- Create an index on district for better performance when filtering by district
CREATE INDEX idx_user_profiles_district ON user_profiles(district);

-- Verify the table structure (optional - just for confirmation)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' 
-- ORDER BY ordinal_position;