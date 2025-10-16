-- SCRIPT 1: DELETION OF OLD AND DEFAULT TABLES
-- Warning: This action is irreversible and will delete all data in these tables.

DROP TABLE IF EXISTS activities_log;
DROP TABLE IF EXISTS plantings;
DROP TABLE IF EXISTS farm_plots;
DROP TABLE IF EXISTS farms;
DROP TABLE IF EXISTS user_app_profiles;
DROP TABLE IF EXISTS crops;
DROP TABLE IF EXISTS soil_types;
DROP TABLE IF EXISTS districts;

-- Legacy tables from previous versions
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS profiles;
