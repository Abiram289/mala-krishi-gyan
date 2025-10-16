-- SCRIPT 7: GRANT PERMISSIONS
-- This script grants the necessary permissions for the application role to interact with the new tables.

GRANT ALL ON districts, soil_types, crops, user_app_profiles, farms, farm_plots, plantings, activities_log TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
