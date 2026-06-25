import os
from supabase import create_client

url = os.environ.get("VITE_SUPABASE_URL", "")
key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

# Try to read from .env if missing
if not url or not key:
    with open(".env") as f:
        for line in f:
            if line.startswith("VITE_SUPABASE_URL"):
                url = line.split("=")[1].strip()
            elif line.startswith("VITE_SUPABASE_ANON_KEY"):
                key = line.split("=")[1].strip()

supabase = create_client(url, key)

print("--- ORGANIZATIONS ---")
orgs = supabase.table("organizations").select("*").execute()
for o in orgs.data:
    print(o)

print("\n--- PROFILES ---")
profiles = supabase.table("profiles").select("*").execute()
for p in profiles.data:
    print(p)

print("\n--- ORGANIZATION MEMBERS ---")
members = supabase.table("organization_members").select("*").execute()
for m in members.data:
    print(m)
