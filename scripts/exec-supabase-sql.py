#!/usr/bin/env python3
"""Execute Supabase schema + seed SQL files via direct PostgreSQL connection."""
import psycopg2
import sys
import os

SUPABASE_HOST = "db.upykzulrzoazgfojvexs.supabase.co"
SUPABASE_PORT = 5432
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres.upykzulrzoazgfojvexs"
SUPABASE_PASS = "Z9eN7Asrfx5jQnZ4"

SCHEMA_FILE = "/home/z/my-project/download/supabase-schema.sql"
SEED_FILE = "/home/z/my-project/download/supabase-seed.sql"

def run_sql_file(cur, filepath, label):
    print(f"\n=== Running {label}: {os.path.basename(filepath)} ===")
    with open(filepath, 'r') as f:
        sql = f.read()
    try:
        cur.execute(sql)
        print(f"  [OK] {label} executed successfully")
    except Exception as e:
        print(f"  [ERROR] {label} failed: {e}")
        raise

# Try pooler regions (direct host is IPv6-only, unreachable from here)
POOLER_REGIONS = ['eu-west-1', 'eu-central-1', 'us-east-1', 'us-west-1', 'ap-southeast-1']

def try_connect():
    """Try connecting via different pooler regions."""
    for region in POOLER_REGIONS:
        host = f'aws-0-{region}.pooler.supabase.com'
        conn_str = f'postgresql://{SUPABASE_USER}:{SUPABASE_PASS}@{host}:6543/{SUPABASE_DB}'
        try:
            print(f'  Trying {host}...')
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print(f'  [OK] Connected via {host}')
            return conn
        except Exception:
            continue
    return None


def main():
    print('Connecting to Supabase (trying pooler regions)...')
    conn = try_connect()
    if not conn:
        print('  [ERROR] Could not connect via any pooler region')
        sys.exit(1)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Schema
    run_sql_file(cur, SCHEMA_FILE, "Schema")

    # 2. Seed
    run_sql_file(cur, SEED_FILE, "Seed")

    # 3. Verify
    print("\n=== Verification ===")
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
    tables = [r[0] for r in cur.fetchall()]
    print(f"  Tables: {tables}")

    for table in ['agents', 'articles', 'settings', 'publish_logs', 'approval_logs', 'activity_logs']:
        cur.execute(f'SELECT COUNT(*) FROM {table}')
        count = cur.fetchone()[0]
        print(f"  {table}: {count} rows")

    cur.close()
    conn.close()
    print("\n=== Done! ===")

if __name__ == "__main__":
    main()
