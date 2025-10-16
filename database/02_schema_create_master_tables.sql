-- SCRIPT 2: CREATE MASTER TABLES
-- These tables hold reference data (the 'lookup' tables).

CREATE TABLE districts (
    district_id SERIAL PRIMARY KEY,
    district_name TEXT NOT NULL UNIQUE
);

CREATE TABLE soil_types (
    soil_type_id SERIAL PRIMARY KEY,
    soil_name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE crops (
    crop_id SERIAL PRIMARY KEY,
    crop_name TEXT NOT NULL UNIQUE,
    ideal_planting_season TEXT,
    time_to_harvest_days INT
);
