-- Check what columns actually exist in user_profiles table
-- Run this in Supabase SQL Editor

-- 1. Show all columns that exist in user_profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Count total rows in user_profiles
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 3. Show sample data from user_profiles (using SELECT * to see all available columns)
SELECT * FROM user_profiles LIMIT 3;