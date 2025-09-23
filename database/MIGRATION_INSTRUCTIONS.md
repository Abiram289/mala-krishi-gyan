# Database Migration: Add District Column

## Summary
This migration adds a `district` column to the `user_profiles` table to support Kerala district-specific farming recommendations.

## Changes Made
- Added `district TEXT` column to `user_profiles` table
- Added index on `district` column for better performance
- Updated frontend to include district selector with all 14 Kerala districts
- Updated backend to handle district field in profile CRUD operations
- Added district-specific agricultural advice to AI context

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `add_district_column.sql`
4. Click "Run" to execute the migration

### Option 2: Supabase CLI
```bash
supabase db push
```

## Verification
After running the migration, you can verify it worked by running:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
```

You should see the `district` column listed.

## Rollback (if needed)
If you need to rollback this change:
```sql
-- Remove the index first
DROP INDEX idx_user_profiles_district;

-- Remove the column
ALTER TABLE user_profiles DROP COLUMN district;
```

## Kerala Districts Supported
The frontend now includes a dropdown with all 14 Kerala districts:
- Thiruvananthapuram, Kollam, Pathanamthitta, Alappuzha
- Kottayam, Idukki, Ernakulam, Thrissur
- Palakkad, Malappuram, Kozhikode, Wayanad
- Kannur, Kasaragod

Each district now provides specific agricultural advice based on local conditions and major crops.