-- SCRIPT 4: CREATE TRANSACTION & LINKING TABLES
-- These tables link entities together and log events.

CREATE TABLE plantings (
    planting_id SERIAL PRIMARY KEY,
    plot_id INT NOT NULL REFERENCES farm_plots(plot_id) ON DELETE CASCADE,
    crop_id INT NOT NULL REFERENCES crops(crop_id),
    planting_date DATE NOT NULL,
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2),
    harvest_date DATE
);

CREATE TABLE activities_log (
    activity_id BIGSERIAL PRIMARY KEY,
    planting_id INT NOT NULL REFERENCES plantings(planting_id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('land_preparation', 'planting', 'watering', 'fertilizing', 'pest_control', 'harvesting', 'post_harvest')),
    activity_date DATE NOT NULL,
    notes TEXT,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
