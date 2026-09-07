#!/usr/bin/env python3
"""Level-Up 6 cleanup: reset logo/icon images saved before the logo filter existed.
They will be re-resolved by the backfill (og:image -> archives -> AI)."""
import psycopg2, sys

SUPABASE_USER = "postgres.upykzulrzoazgfojvexs"
SUPABASE_PASS = "Z9eN7Asrfx5jQnZ4"
SUPABASE_DB = "postgres"
POOLER_REGIONS = ['aws-1-eu-central-2', 'eu-central-1', 'eu-west-1', 'us-east-1']

def try_connect():
    for region in POOLER_REGIONS:
        host = f'{region}.pooler.supabase.com' if region.startswith('aws-1') else f'aws-0-{region}.pooler.supabase.com'
        conn_str = f'postgresql://{SUPABASE_USER}:{SUPABASE_PASS}@{host}:6543/{SUPABASE_DB}'
        try:
            print(f'  Trying {host}...')
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print(f'  [OK] Connected via {host}')
            return conn
        except Exception as e:
            print(f'    fail: {str(e)[:80]}')
    return None

def main():
    conn = try_connect()
    if not conn:
        print("[ERROR] no connection")
        sys.exit(1)
    conn.autocommit = True
    cur = conn.cursor()

    # 0) Ensure credit columns exist
    cur.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit text DEFAULT '' NOT NULL")
    cur.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit_url text DEFAULT '' NOT NULL")

    # 1) Show columns
    cur.execute("""SELECT column_name FROM information_schema.columns
                   WHERE table_name='articles' AND column_name LIKE 'image%' ORDER BY 1;""")
    print("Image columns:", [r[0] for r in cur.fetchall()])

    # 2) Current coverage
    cur.execute("""SELECT COUNT(*), COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url <> '')
                   FROM articles WHERE status IN ('published','approved');""")
    total, withimg = cur.fetchone()
    print(f"Coverage now: {withimg}/{total}")

    # 3) Reset logo-looking images (they'll be re-resolved by backfill)
    cur.execute("""
        UPDATE articles
        SET image_url = '', image_credit = '', image_credit_url = ''
        WHERE image_url ~* '(logo|icon|avatar|sprite|placeholder|precomposed|favicon|/ico/|/img/ico/|\\.svg(\\?|$)|\\.ico(\\?|$))'
          AND status IN ('published','approved');
    """)
    print(f"Reset logo-images: {cur.rowcount}")

    # 4) Final state
    cur.execute("""SELECT COUNT(*) FROM articles
                   WHERE status IN ('published','approved') AND (image_url IS NULL OR image_url='');""")
    print("Articles missing image after cleanup:", cur.fetchone()[0])

    cur.close()
    conn.close()
    print("CLEANUP OK")

if __name__ == '__main__':
    main()
