-- Migration to enable comprehensive PostgreSQL query logging.
-- This is separated into its own file because ALTER SYSTEM commands cannot be run inside a transaction block,
-- which is the default behavior of the Supabase SQL Editor.

-- Enable logging for all SQL statements (DDL and DML).
-- Use 'mod' for only data-modifying statements, or 'none' to disable.
ALTER SYSTEM SET log_statement = 'all';

-- Enable logging of statement durations.
ALTER SYSTEM SET log_duration = 'on';

-- Set a prefix for each log line to include timestamp, username, and database name.
-- This provides valuable context for debugging and auditing.
-- %t = timestamp without milliseconds
-- %u = user name
-- %d = database name
-- %q = query text (only for log_statement = 'all')
ALTER SYSTEM SET log_line_prefix = '%t [%u@%d] ';

-- Reload the PostgreSQL configuration to apply the changes immediately.
SELECT pg_reload_conf();

-- Optional: Create a table to store query logs for analysis.
-- This is useful for coursework to have a persistent record of queries.
CREATE TABLE IF NOT EXISTS public.query_log (
    log_id BIGSERIAL PRIMARY KEY,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    username TEXT,
    database_name TEXT,
    query TEXT,
    duration_ms REAL
);

-- Grant necessary permissions for the service_role to interact with the log table.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE public.query_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.query_log_log_id_seq TO service_role;

COMMENT ON TABLE public.query_log IS 'A table to persist PostgreSQL query logs for auditing and analysis.';
