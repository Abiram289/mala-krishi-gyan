-- SCRIPT 5: CREATE INDEXES
-- These indexes are crucial for query performance, especially on foreign keys.

CREATE INDEX idx_farms_owner_id ON farms(owner_id);
CREATE INDEX idx_farms_district_id ON farms(district_id);
CREATE INDEX idx_farm_plots_farm_id ON farm_plots(farm_id);
CREATE INDEX idx_plantings_plot_id ON plantings(plot_id);
CREATE INDEX idx_plantings_crop_id ON plantings(crop_id);
CREATE INDEX idx_activities_log_planting_id ON activities_log(planting_id);
