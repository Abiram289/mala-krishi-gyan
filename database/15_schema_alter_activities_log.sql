-- SCRIPT 15: ALTER ACTIVITIES LOG FOR TASK SCHEDULING
-- Adds status and timestamp fields to support scheduling and completion tracking.

-- Add a 'status' column to distinguish between scheduled and completed tasks.
ALTER TABLE activities_log
ADD COLUMN status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done'));

-- Rename the old 'activity_date' to 'scheduled_for' and change its type to allow time.
ALTER TABLE activities_log
RENAME COLUMN activity_date TO scheduled_for;
ALTER TABLE activities_log
ALTER COLUMN scheduled_for TYPE TIMESTAMP WITH TIME ZONE;

-- Add a 'completed_at' timestamp to record when a task was marked as done.
ALTER TABLE activities_log
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add an index on the new status column for efficient filtering.
CREATE INDEX idx_activities_log_status ON activities_log(status);
