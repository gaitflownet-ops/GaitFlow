import os
from supabase import create_client

url = os.environ.get("VITE_SUPABASE_URL", "http://127.0.0.1:54321")
key = os.environ.get("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4b3Jnd2prYXFmZnd1aGttbWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY5MjU0ODcsImV4cCI6MjA0MjQ5MzQ4N30.K5Y4qK8")
# Usaremos el service_role_key si queremos hacer bypass a RLS
key = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY", key)

supabase = create_client(url, key)

try:
    res = supabase.table("permissions").select("*").limit(5).execute()
    print("Permissions table rows:", res.data)
except Exception as e:
    print("Error querying permissions table:", e)
