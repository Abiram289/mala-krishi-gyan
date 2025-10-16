-- SCRIPT 16: CREATE USER ACTIVITIES VIEW
-- This view simplifies querying activities by linking them directly to a user (owner).

CREATE OR REPLACE VIEW user_activities AS
SELECT
    al.activity_id,
    al.planting_id,
    al.activity_type,
    al.notes,
    al.cost,
    al.status,
    al.scheduled_for,
    al.completed_at,
    al.created_at,
    f.owner_id,
    p.crop_id,
    fp.farm_id,
    fp.plot_id
FROM
    activities_log al
JOIN
    plantings p ON al.planting_id = p.planting_id
JOIN
    farm_plots fp ON p.plot_id = fp.plot_id
JOIN
    farms f ON fp.farm_id = f.farm_id;

-- Grant usage to authenticated users
GRANT SELECT ON user_activities TO authenticated;
