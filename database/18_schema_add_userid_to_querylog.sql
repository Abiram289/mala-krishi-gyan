-- Add the user_id column to the query_log table to associate logs with specific users.

ALTER TABLE public.query_log
ADD COLUMN user_id UUID;

-- Optional: Add a foreign key constraint to ensure data integrity.
-- This links the user_id in the log to the actual user in the auth.users table.
-- It also sets the user_id to NULL if the user is deleted, to avoid losing the log entry.
ALTER TABLE public.query_log
ADD CONSTRAINT fk_query_log_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

COMMENT ON COLUMN public.query_log.user_id IS 'The UUID of the user who executed the query, linking to auth.users.';
