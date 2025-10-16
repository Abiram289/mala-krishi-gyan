-- SCRIPT 3: CREATE ENTITY TABLES
-- These tables represent the core entities of the application, like users and farms.

CREATE TABLE user_app_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE farms (
    farm_id SERIAL PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES user_app_profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    district_id INT NOT NULL REFERENCES districts(district_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE farm_plots (
    plot_id SERIAL PRIMARY KEY,
    farm_id INT NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
    plot_name TEXT,
    area_acres DECIMAL(10, 2),
    soil_type_id INT NOT NULL REFERENCES soil_types(soil_type_id)
);
