#!/usr/bin/env python3
"""Level-Up 6 migration: image_credit + image_credit_url columns on articles."""
import psycopg2

SUPABASE_USER = "postgres.upykzulrzoazgfojvexs"
SUPABASE_PASS = "Z9eN7Asrfx5jQnZ4"
SUPABASE_DB = "postgres"
POOLER_REGIONS = ['eu-central-1', 'eu-west-1', 'us-east-1', 'aws-1-eu-central-2']

def try_connect():
    for region in POOLER_REGIONS:
        host = f'aws-0-{region}.pooler.supabase.com' if not region.startswith('aws-1') else f'{region}.pooler.supabase.com'
        conn_str = f'postgresql://{SUPABASE_USER}:{SUPABASE_PASS}@{host}:6543/{SUPABASE_DB}'
        try:
            print(f'  Trying {host}...')
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print(f'  [OK] Connected via {host}')
            return conn
        except Exception as e:
            print(f'    fail: {str(e)[:80]}')
    return None

SQL = [
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit text DEFAULT '' NOT NULL",
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit_url text DEFAULT '' NOT NULL",
]

def main():
    conn = try_connect()
    if not conn:
        print("[ERROR] no connection")
        sys.exit(1)
    conn.autocommit = True
    cur = conn.cursor()
    for stmt in SQL:
        print(f"  -> {stmt[:80]}")
        cur.execute(stmt)
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='articles' AND column_name IN ('image_url','image_credit','image_credit_url')
        ORDER BY column_name;
    """)
    cols = [r[0] for r in cur.fetchall()]
    print("Columns present:", cols)
    cur.execute("SELECT COUNT(*) FROM articles WHERE image_url IS NULL OR image_url='';")
    print("Articles missing image:", cur.fetchone()[0])
    cur.close()
    conn.close()
    print("MIGRATION OK")

if __name__ == '__main__':
    main()
