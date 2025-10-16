CREATE OR REPLACE FUNCTION get_crop_calendar(p_month INT)
RETURNS JSONB AS $$
DECLARE
    calendar_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'season', 'Current Season', -- Placeholder
        'rainfall_period', 'Expected rainfall period', -- Placeholder
        'month', to_char(to_date(p_month::text, 'MM'), 'Month'),
        'predictions', (
            SELECT jsonb_agg(t)
            FROM (
                SELECT
                    'pred_' || comprehensive_data_id as id,
                    crop_name as crop,
                    'Flowering' as stage, -- Placeholder
                    'Apply fertilizer' as action, -- Placeholder
                    'This week' as timing, -- Placeholder
                    'medium' as priority, -- Placeholder
                    'Fertilizer application is crucial for this stage.' as description, -- Placeholder
                    'sprout' as icon -- Placeholder
                FROM comprehensive_agriculture_data
                WHERE lower(planting_period) LIKE '%' || lower(to_char(to_date(p_month::text, 'MM'), 'Month')) || '%'
                LIMIT 3
            ) t
        ),
        'weather_guidance', (
            SELECT jsonb_agg(t)
            FROM (
                SELECT
                    to_char(NOW() + (n || ' day')::interval, 'YYYY-MM-DD') as date,
                    'Sunny' as condition, -- Placeholder
                    'Good for planting' as impact, -- Placeholder
                    'sun' as icon -- Placeholder
                FROM generate_series(1, 3) as n
            ) t
        ),
        'monthly_schedule', jsonb_build_object(
            'weeks', jsonb_build_array(
                jsonb_build_object(
                    'title', 'Week 1',
                    'activities', jsonb_build_array(
                        jsonb_build_object('text', 'Prepare land', 'icon', 'sprout'),
                        jsonb_build_object('text', 'Sow seeds', 'icon', 'droplets')
                    )
                ),
                jsonb_build_object(
                    'title', 'Week 2',
                    'activities', jsonb_build_array(
                        jsonb_build_object('text', 'First watering', 'icon', 'droplets')
                    )
                ),
                jsonb_build_object(
                    'title', 'Week 3',
                    'activities', jsonb_build_array(
                        jsonb_build_object('text', 'Pest control', 'icon', 'bug')
                    )
                ),
                jsonb_build_object(
                    'title', 'Week 4',
                    'activities', jsonb_build_array(
                        jsonb_build_object('text', 'Harvesting', 'icon', 'scissors')
                    )
                )
            )
        ),
        'district_note', 'This is a general calendar. Please consult local authorities for district-specific advice.' -- Placeholder
    )
    INTO calendar_data;

    RETURN calendar_data;
END;
$$ LANGUAGE plpgsql;