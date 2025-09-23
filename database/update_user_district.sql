-- Update your user profile with a Kerala district
-- Run this in Supabase SQL Editor

-- First, let's see your current profile
SELECT 
    id,
    user_id,
    full_name,
    location,
    farm_size,
    soil_type,
    district,
    created_at
FROM user_profiles 
WHERE full_name = 'Abi ram H';

-- Update your profile to set a Kerala district
-- Since your location shows "Chenga, Tamil Nadu" which is near Kerala border,
-- I'll suggest Thiruvananthapuram (closest Kerala district)

UPDATE user_profiles 
SET 
    district = 'Thiruvananthapuram',
    updated_at = NOW()
WHERE full_name = 'Abi ram H';

-- Verify the update
SELECT 
    id,
    user_id,
    full_name,
    location,
    farm_size,
    soil_type,
    district,
    updated_at
FROM user_profiles 
WHERE full_name = 'Abi ram H';