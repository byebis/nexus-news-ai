#!/usr/bin/env python3
"""Level 12 migration: wire_runs + agent_comments tables + settings.wire_enabled toggle."""
import psycopg2
import sys

SUPABASE_HOST = "db.upykzulrzoazgfojvexs.supabase.co"
SUPABASE_PORT = 5432
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres.upykzulrzoazgfojvexs"
SUPABASE_PASS = "Z9eN7Asrfx5jQnZ4"

SQL = """
-- Level 12: Nexus Wire (Redazione Collettiva)
CREATE TABLE IF NOT EXISTS wire_runs (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  sources JSONB DEFAULT '[]'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  agents_involved JSONB DEFAULT '[]'::jsonb,
  article_id TEXT,
  review_score INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE wire_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on wire_runs" ON wire_runs;
CREATE POLICY "Allow all on wire_runs" ON wire_runs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS agent_comments (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  article_id TEXT,
  agent_id TEXT,
  agent_name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  kind TEXT NOT NULL,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agent_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on agent_comments" ON agent_comments;
CREATE POLICY "Allow all on agent_comments" ON agent_comments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE settings ADD COLUMN IF NOT EXISTS wire_enabled BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_wire_runs_created ON wire_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_comments_run ON agent_comments (run_id);
CREATE INDEX IF NOT EXISTS idx_agent_comments_created ON agent_comments (created_at DESC);
"""

POOLER_REGIONS = ['eu-west-1', 'eu-central-1', 'us-east-1', 'us-west-1', 'ap-southeast-1']

def try_connect():
    for region in POOLER_REGIONS:
        host = f'aws-0-{region}.pooler.supabase.com'
        conn_str = f'postgresql://{SUPABASE_USER}:{SUPABASE_PASS}@{host}:6543/{SUPABASE_DB}'
        try:
            print(f'  Trying {host}...')
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print(f'  [OK] Connected via {host}')
            return conn
        except Exception as e:
            print(f'  [skip] {e}')
    return None

def main():
    print('Connecting to Supabase (pooler regions)...')
    conn = try_connect()
    if not conn:
        print('  [ERROR] Could not connect')
        sys.exit(1)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(SQL)
    print('  [OK] Migration executed')

    # Verify
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('wire_runs','agent_comments')")
    print('  Tables:', [r[0] for r in cur.fetchall()])
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name='wire_enabled'")
    print('  settings.wire_enabled:', cur.fetchall())
    cur.execute('SELECT COUNT(*) FROM wire_runs')
    print('  wire_runs rows:', cur.fetchone()[0])
    cur.execute('SELECT COUNT(*) FROM agent_comments')
    print('  agent_comments rows:', cur.fetchone()[0])
    cur.close()
    conn.close()
    print('=== Migration Level 12 done! ===')

if __name__ == '__main__':
    main()
