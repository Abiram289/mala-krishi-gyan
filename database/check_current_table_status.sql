-- Check the current status of user_profiles table
-- Run this in Supabase SQL Editor to see what's already configured

-- 1. Show all columns in user_profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Show all constraints on user_profiles table
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles';

-- 3. Show specific check constraint details
SELECT 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'user_profiles' 
    AND tc.constraint_type = 'CHECK';

-- 4. Count existing user profiles
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 5. Show sample of existing data (first 3 rows with key fields)
SELECT 
    id, 
    user_id, 
    username, 
    district, 
    farm_size, 
    soil_type,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 3;