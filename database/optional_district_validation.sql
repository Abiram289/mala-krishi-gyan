-- OPTIONAL: Add validation constraint for Kerala districts
-- Only run this AFTER confirming the district column was added successfully
-- This ensures only valid Kerala district names can be entered

-- Add Kerala district validation (optional)
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

-- Verify the constraint was added
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' AND constraint_name = 'valid_kerala_district';