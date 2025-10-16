-- SCRIPT 6: INSERT MASTER DATA
-- This script populates the master tables with essential data for the application to function.

INSERT INTO districts (district_name) VALUES
    ('Thiruvananthapuram'), ('Kollam'), ('Pathanamthitta'), ('Alappuzha'),
    ('Kottayam'), ('Idukki'), ('Ernakulam'), ('Thrissur'), ('Palakkad'),
    ('Malappuram'), ('Kozhikode'), ('Wayanad'), ('Kannur'), ('Kasaragod');

INSERT INTO soil_types (soil_name, description) VALUES
    ('Alluvial Soil', 'Rich in nutrients, found in river basins, ideal for rice, sugarcane, and vegetables.'),
    ('Red Loam Soil', 'Well-drained and loamy, suitable for rubber, tea, and spices.'),
    ('Laterite Soil', 'Common in Kerala, good for cashew, coconut, and areca nut.'),
    ('Sandy Soil', 'Found in coastal areas, primarily for coconut cultivation.');

INSERT INTO crops (crop_name, ideal_planting_season, time_to_harvest_days) VALUES
    ('Rice', 'June-August (Virippu), September-December (Mundakan)', 120),
    ('Coconut', 'Year-round', 300),
    ('Rubber', 'June-July', 2555), -- Approx 7 years to maturity
    ('Black Pepper', 'May-June', 270),
    ('Banana', 'Year-round', 300),
    ('Cashew', 'May-July', 1095); -- Approx 3 years to first harvest
