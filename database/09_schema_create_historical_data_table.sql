-- SCRIPT 9: CREATE HISTORICAL AGRICULTURE DATA TABLE

CREATE TABLE historical_agriculture_data (
    historical_data_id SERIAL PRIMARY KEY,
    crop_name TEXT NOT NULL,
    district_name TEXT NOT NULL,
    year INT NOT NULL,
    season TEXT,
    area_hectares DECIMAL(10, 2),
    production_tonnes DECIMAL(10, 2),
    productivity_tonnes_per_hectare DECIMAL(10, 2),
    weather_impact_factor DECIMAL(5, 2),
    sowing_period TEXT,
    harvest_period TEXT
);

CREATE INDEX idx_historical_data_crop_district_year ON historical_agriculture_data(crop_name, district_name, year);
