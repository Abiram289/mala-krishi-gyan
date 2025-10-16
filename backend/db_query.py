
import datetime
from supabase import Client
from typing import Optional

def log_query(
    supabase_client: Client,
    user_id: str,
    username: Optional[str],
    query: str,
    database_name: str = "postgres",
):
    """
    Logs a query to the 'query_log' table in the database.

    Args:
        supabase_client: The Supabase client instance.
        user_id: The ID of the user executing the query.
        username: The name of the user.
        query: A string representation of the query being executed.
        database_name: The name of the database being queried.
    """
    try:
        log_entry = {
            "user_id": user_id,
            "username": username or "N/A",
            "query": query,
            "database_name": database_name,
            "executed_at": datetime.datetime.now().isoformat(),
            "duration_ms": None, # Add duration to match schema
        }
        
        # We execute this in the background so it doesn't slow down the main request
        # Note: Supabase-py doesn't have a native async insert without `await`,
        # so this will still block, but it's a very fast operation.
        # For a true non-blocking call, this would need to be sent to a background worker.
        supabase_client.table("query_log").insert(log_entry).execute()

    except Exception as e:
        # We print the error but don't re-raise it.
        # The primary function (e.g., getting farm data) should not fail if logging fails.
        print(f"CRITICAL: Failed to log query. Error: {e}")

