#!/usr/bin/env python3
"""Level-Up 4 migration: users (ruoli admin/editor) + channel_configs (canali social).
Hash password: pbkdf2$<iter>$<salt_hex>$<hash_hex> (PBKDF2-SHA256, 100k iter — uguale a src/lib/auth.ts)."""
import psycopg2
import sys
import os
import hashlib
import secrets

SUPABASE_USER = "postgres.upykzulrzoazgfojvexs"
SUPABASE_PASS = "Z9eN7Asrfx5jQnZ4"
SUPABASE_DB = "postgres"

ITERATIONS = 100000

ADMIN_EMAIL = "admin@nexusnews.ai"
ADMIN_PASS = "Admin2026!"
EDITOR_EMAIL = "editor@nexusnews.ai"
EDITOR_PASS = "Editor2026!"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, ITERATIONS, dklen=32)
    return f"pbkdf2${ITERATIONS}${salt.hex()}${dk.hex()}"


def try_connect():
    # Tenant hosted on aws-1-eu-central-2 (verified); fallback to other aws-1 regions
    for host in ['aws-1-eu-central-2.pooler.supabase.com', 'aws-1-eu-west-1.pooler.supabase.com',
                 'aws-1-us-east-1.pooler.supabase.com', 'aws-0-eu-central-2.pooler.supabase.com']:
        conn_str = f'postgresql://{SUPABASE_USER}:{SUPABASE_PASS}@{host}:6543/{SUPABASE_DB}'
        try:
            print(f'  Trying {host}...')
            conn = psycopg2.connect(conn_str, connect_timeout=6)
            print(f'  [OK] Connected via {host}')
            return conn
        except Exception as e:
            print(f'    fail: {str(e).splitlines()[0][:110]}')
            continue
    return None


SCHEMA_SQL = """
-- ============================================
-- Users (ruoli: admin / editor)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on users" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Channel configs (canali di pubblicazione social)
-- ============================================
CREATE TABLE IF NOT EXISTS channel_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  channel TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN DEFAULT FALSE,
  config JSONB DEFAULT '{}'::jsonb,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT DEFAULT '',
  last_test_detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER channel_configs_updated_at BEFORE UPDATE ON channel_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on channel_configs" ON channel_configs;
CREATE POLICY "Allow all on channel_configs" ON channel_configs FOR ALL USING (true) WITH CHECK (true);

-- Agente di sistema per eventi redazione (login/logout/pubblicazioni manuali)
INSERT INTO agents (id, name, avatar, category, description, status, personality)
VALUES ('sys-redazione', '📰 Redazione', '📰', 'redazione',
        'Agente di sistema: eventi di redazione (login, pubblicazioni manuali, audit)', 'active', 'sistema')
ON CONFLICT (id) DO NOTHING;
"""


def main():
    admin_hash = hash_password(ADMIN_PASS)
    editor_hash = hash_password(EDITOR_PASS)
    print(f'Admin hash:  {admin_hash[:40]}...')
    print(f'Editor hash: {editor_hash[:40]}...')

    conn = try_connect()
    if not conn:
        print('[ERROR] No connection')
        sys.exit(1)
    conn.autocommit = True
    cur = conn.cursor()

    print('\n=== Schema (users + channel_configs) ===')
    cur.execute(SCHEMA_SQL)
    print('  [OK] schema executed')

    print('\n=== Seed canali ===')
    channels = [
        ('blog', '📰 Blog Nexus', True, '{"note": "Il sito stesso - sempre attivo"}'),
        ('telegram', '✈️ Telegram', False, '{"bot_token": "", "chat_id": ""}'),
        ('webhook', '🔗 Webhook Automation (Make/Zapier/n8n)', False, '{"url": "", "secret": ""}'),
        ('twitter', '𝕏 Twitter/X', False, '{"handle": "", "relay_webhook": ""}'),
        ('linkedin', '💼 LinkedIn', False, '{"handle": "", "relay_webhook": ""}'),
        ('instagram', '📷 Instagram', False, '{"handle": "", "relay_webhook": ""}'),
        ('facebook', '👍 Facebook', False, '{"page_url": "", "relay_webhook": ""}'),
    ]
    for ch, label, enabled, cfg in channels:
        cur.execute("""
            INSERT INTO channel_configs (channel, label, enabled, config)
            VALUES (%s, %s, %s, %s::jsonb)
            ON CONFLICT (channel) DO UPDATE SET label = EXCLUDED.label
        """, (ch, label, enabled, cfg))
        print(f'  [OK] {ch}')

    print('\n=== Seed utenti di prova ===')
    cur.execute("""
        INSERT INTO users (email, password_hash, name, role, active)
        VALUES (%s, %s, %s, 'admin', TRUE)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', active = TRUE
    """, (ADMIN_EMAIL, admin_hash, 'Anton (Admin)'))
    print(f'  [OK] admin: {ADMIN_EMAIL} / {ADMIN_PASS}')

    cur.execute("""
        INSERT INTO users (email, password_hash, name, role, active)
        VALUES (%s, %s, %s, 'editor', TRUE)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'editor', active = TRUE
    """, (EDITOR_EMAIL, editor_hash, 'Editore di Prova'))
    print(f'  [OK] editor: {EDITOR_EMAIL} / {EDITOR_PASS}')

    print('\n=== Verification ===')
    for t in ['users', 'channel_configs']:
        cur.execute(f'SELECT COUNT(*) FROM {t}')
        print(f'  {t}: {cur.fetchone()[0]} rows')
    cur.execute("SELECT email, role, active FROM users ORDER BY role")
    for r in cur.fetchall():
        print(f'  user: {r}')
    cur.execute("SELECT channel, enabled FROM channel_configs ORDER BY channel")
    for r in cur.fetchall():
        print(f'  channel: {r}')

    cur.close()
    conn.close()
    print('\n=== Done! ===')


if __name__ == '__main__':
    main()
