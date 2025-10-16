CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_farms', COUNT(DISTINCT f.farm_id),
        'total_plots', COUNT(DISTINCT fp.plot_id),
        'total_plantings', COUNT(DISTINCT p.planting_id),
        'total_area_acres', SUM(fp.area_acres),
        'most_planted_crop', (
            SELECT c.crop_name
            FROM plantings p_inner
            JOIN crops c ON p_inner.crop_id = c.crop_id
            JOIN farm_plots fp_inner ON p_inner.plot_id = fp_inner.plot_id
            JOIN farms f_inner ON fp_inner.farm_id = f_inner.farm_id
            WHERE f_inner.owner_id = p_user_id
            GROUP BY c.crop_name
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        'latest_activity', (
            SELECT jsonb_build_object(
                'activity_type', al.activity_type,
                'activity_date', al.activity_date,
                'plot_name', fp_inner.plot_name,
                'farm_name', f_inner.farm_name
            )
            FROM activities_log al
            JOIN plantings p_inner ON al.planting_id = p_inner.planting_id
            JOIN farm_plots fp_inner ON p_inner.plot_id = fp_inner.plot_id
            JOIN farms f_inner ON fp_inner.farm_id = f_inner.farm_id
            WHERE f_inner.owner_id = p_user_id
            ORDER BY al.activity_date DESC
            LIMIT 1
        )
    )
    INTO stats
    FROM farms f
    LEFT JOIN farm_plots fp ON f.farm_id = fp.farm_id
    LEFT JOIN plantings p ON fp.plot_id = p.plot_id
    WHERE f.owner_id = p_user_id;

    RETURN stats;
END;
$$ LANGUAGE plpgsql;