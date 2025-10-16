-- SCRIPT 14: ADD MORE FIELDS TO USER PROFILE
-- Adds columns for farm size, location (district), and soil type to the user's main profile.

ALTER TABLE public.user_app_profiles
ADD COLUMN farm_size REAL,
ADD COLUMN district_id INTEGER REFERENCES public.districts(district_id),
ADD COLUMN soil_type_id INTEGER REFERENCES public.soil_types(soil_type_id);

-- Also, let's update the get_ai_context function to include this new profile info.
-- This will give the AI better context about the user's default conditions.

DROP FUNCTION IF EXISTS get_ai_context(uuid, text);

CREATE OR REPLACE FUNCTION get_ai_context(p_user_id UUID, p_user_query TEXT)
RETURNS TEXT AS $$
DECLARE
    profile_info TEXT;
    farm_info TEXT;
    recent_activity TEXT;
    weather_info TEXT;
    historical_data TEXT;
    comprehensive_data TEXT;
BEGIN
    -- 1. Get User Profile
    SELECT
        'User Profile: Full Name: ' || up.full_name ||
        ', Location: ' || d.district_name ||
        ', Default Soil: ' || st.soil_name ||
        ', Total Farm Size: ' || up.farm_size || ' acres.'
    INTO profile_info
    FROM user_app_profiles up
    LEFT JOIN districts d ON up.district_id = d.district_id
    LEFT JOIN soil_types st ON up.soil_type_id = st.soil_type_id
    WHERE up.id = p_user_id;

    -- 2. Get Farm and Plot Details
    SELECT STRING_AGG(
        'Farm: ' || f.farm_name || ' in ' || d.district_name ||
        '. Plots: ' || (
            SELECT STRING_AGG(
                fp.plot_name || ' (' || s.soil_name || ', ' || fp.area_acres || ' acres)',
                ', '
            )
            FROM farm_plots fp
            JOIN soil_types s ON fp.soil_type_id = s.soil_type_id
            WHERE fp.farm_id = f.farm_id
        ),
        '. '
    )
    INTO farm_info
    FROM farms f
    JOIN districts d ON f.district_id = d.district_id
    WHERE f.owner_id = p_user_id;

    -- 3. Get Recent Activity
    SELECT STRING_AGG(
        a.activity_type || ' on ' || c.crop_name || ' on ' || a.activity_date,
        ', '
    )
    INTO recent_activity
    FROM activities a
    JOIN plantings p ON a.planting_id = p.planting_id
    JOIN crops c ON p.crop_id = c.crop_id
    JOIN farm_plots fp ON p.plot_id = fp.plot_id
    JOIN farms f ON fp.farm_id = f.farm_id
    WHERE f.owner_id = p_user_id AND a.activity_date > (NOW() - INTERVAL '30 days');

    -- 4. Get Current Weather (Simplified - this would ideally be a live API call)
    -- For now, we'll just add a placeholder.
    weather_info := 'Current weather is assumed to be typical for the season.';

    -- 5. Get Historical Data relevant to the query
    SELECT STRING_AGG(
        'In ' || hd.year || ', ' || hd.crop || ' production was ' || hd.production_tonnes || ' tonnes in ' || hd.district,
        '; '
    )
    INTO historical_data
    FROM kerala_agriculture_10year_historical_data hd
    WHERE p_user_query ILIKE '%' || hd.crop || '%' OR p_user_query ILIKE '%' || hd.district || '%';

    -- 6. Get Comprehensive Data relevant to the query
    SELECT STRING_AGG(
        'Comprehensive data for ' || cd.crop || ' in ' || cd.district || ' (' || cd.year || '): Area ' || cd.area_hectares || ' ha, Production ' || cd.production_tonnes || ' tonnes, Yield ' || cd.yield_kg_per_ha || ' kg/ha.',
        '; '
    )
    INTO comprehensive_data
    FROM kerala_comprehensive_agriculture_data cd
    WHERE p_user_query ILIKE '%' || cd.crop || '%' OR p_user_query ILIKE '%' || cd.district || '%';


    RETURN COALESCE(profile_info, 'No profile info.') || E'\n' ||
           COALESCE(farm_info, 'No farm info.') || E'\n' ||
           COALESCE(recent_activity, 'No recent activity.') || E'\n' ||
           weather_info || E'\n' ||
           COALESCE(historical_data, 'No relevant historical data.') || E'\n' ||
           COALESCE(comprehensive_data, 'No relevant comprehensive data.');
END;
$$ LANGUAGE plpgsql;
