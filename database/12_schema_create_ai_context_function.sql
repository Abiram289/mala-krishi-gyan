CREATE OR REPLACE FUNCTION get_ai_context(p_user_id UUID, p_user_query TEXT)
RETURNS TEXT AS $$
DECLARE
    context TEXT := '';
    user_farm RECORD;
BEGIN
    -- Use a CTE to get the user's farm for better readability
    WITH user_farm_cte AS (
        SELECT f.farm_id, d.district_name
        FROM farms f
        JOIN districts d ON f.district_id = d.district_id
        WHERE f.owner_id = p_user_id
        LIMIT 1
    )
    SELECT * INTO user_farm FROM user_farm_cte;

    IF user_farm IS NOT NULL THEN
        context := context || 'User is in ' || user_farm.district_name || '. ';

        -- Use string_to_array and unnest to find mentioned crops, which is more efficient than LIKE
        WITH mentioned_crops AS (
            SELECT DISTINCT crop_name
            FROM crops
            WHERE lower(crop_name) = ANY(string_to_array(lower(p_user_query), ' '))
        )
        -- Now, let's get the context in a single query using CTEs and JSON aggregation
        SELECT INTO context
            context || jsonb_build_object(
                'recommendations', (
                    SELECT jsonb_agg(t)
                    FROM (
                        SELECT crop_name, season, planting_period
                        FROM comprehensive_agriculture_data
                        WHERE district_name = user_farm.district_name
                        LIMIT 3
                    ) t
                ),
                'historical_data', (
                    SELECT jsonb_agg(t)
                    FROM (
                        SELECT h.crop_name, h.year, h.productivity_tonnes_per_hectare
                        FROM historical_agriculture_data h
                        JOIN mentioned_crops mc ON h.crop_name = mc.crop_name
                        WHERE h.district_name = user_farm.district_name
                        ORDER BY h.year DESC
                        LIMIT 5
                    ) t
                )
            )::TEXT;
    END IF;

    RETURN context;
END;
$$ LANGUAGE plpgsql;