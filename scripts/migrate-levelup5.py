#!/usr/bin/env python3
"""Level Up 5 migration: EN columns on articles + weekly_digests table."""
import psycopg2
import sys

SUPABASE_USER = "postgres.upykzulrzoazgfojvexs"
SUPABASE_PASS = "Z9eN7Asrfx5jQnZ4"
SUPABASE_DB = "postgres"

SQL = """
-- 1) English translation columns on articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS subtitle_en text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS summary_en text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_en text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS translated_at timestamptz;

-- 2) Weekly digests per agent (thread-style)
CREATE TABLE IF NOT EXISTS weekly_digests (
  id text PRIMARY KEY,
  agent_id text NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  article_count integer NOT NULL DEFAULT 0,
  sent_channels text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS weekly_digests_agent_week_idx ON weekly_digests(agent_id, week_start);

ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on weekly_digests" ON weekly_digests;
CREATE POLICY "Allow all on weekly_digests" ON weekly_digests FOR ALL USING (true) WITH CHECK (true);
"""

def main():
    for host in ['aws-1-eu-central-2.pooler.supabase.com', 'aws-1-eu-west-1.pooler.supabase.com',
                 'aws-1-us-east-1.pooler.supabase.com', 'aws-0-eu-central-2.pooler.supabase.com']:
        conn_str = f'postgresql://{SUPABASE_USER}:{SUPABASE_PASS}@{host}:6543/{SUPABASE_DB}'
        try:
            print(f'  Trying {host}...')
            conn = psycopg2.connect(conn_str, connect_timeout=6)
            print(f'  [OK] Connected via {host}')
            break
        except Exception as e:
            print(f'  [fail] {e}')
            conn = None
    if not conn:
        print('[ERROR] no connection')
        sys.exit(1)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(SQL)
    print('[OK] migration executed')

    # Verify
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='articles' AND column_name LIKE '%_en%' ORDER BY column_name")
    print('  articles EN columns:', [r[0] for r in cur.fetchall()])
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='weekly_digests' ORDER BY ordinal_position")
    print('  weekly_digests columns:', [r[0] for r in cur.fetchall()])
    cur.execute("SELECT COUNT(*) FROM weekly_digests")
    print('  weekly_digests rows:', cur.fetchone()[0])
    cur.close()
    conn.close()
    print('=== Done! ===')

if __name__ == '__main__':
    main()
