-- SCRIPT 10: CREATE COMPREHENSIVE AGRICULTURE DATA TABLE

CREATE TABLE comprehensive_agriculture_data (
    comprehensive_data_id SERIAL PRIMARY KEY,
    district_name TEXT NOT NULL,
    category TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    season TEXT,
    planting_period TEXT,
    harvest_period TEXT,
    is_major_district BOOLEAN,
    cultivation_type TEXT
);

CREATE INDEX idx_comprehensive_data_district_crop ON comprehensive_agriculture_data(district_name, crop_name);
