-- ============================================
-- Nexus News AI - Supabase Schema
-- Esegui questo nello SQL Editor di Supabase
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Agents
-- ============================================
CREATE TABLE agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  category TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  personality TEXT DEFAULT 'professionale ed oggettivo',
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Articles
-- ============================================
CREATE TABLE articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  summary TEXT DEFAULT '',
  category TEXT NOT NULL,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_name TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'published', 'rejected')),
  quality_score FLOAT DEFAULT 0,
  read_time INT DEFAULT 3,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_agent_id ON articles(agent_id);

CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Publish Logs
-- ============================================
CREATE TABLE publish_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('blog', 'twitter', 'facebook', 'linkedin', 'instagram')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
  post_id TEXT DEFAULT '',
  post_url TEXT DEFAULT '',
  error TEXT DEFAULT '',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publish_logs_article_id ON publish_logs(article_id);

-- ============================================
-- Approval Logs
-- ============================================
CREATE TABLE approval_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  article_id TEXT UNIQUE NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  reviewer_action TEXT DEFAULT '' CHECK (reviewer_action IN ('approved', 'rejected', '')),
  reviewer_note TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Activity Logs
-- ============================================
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  status TEXT DEFAULT 'info' CHECK (status IN ('info', 'success', 'warning', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_agent_id ON activity_logs(agent_id);

-- ============================================
-- Settings
-- ============================================
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mode TEXT DEFAULT 'semi_autonomous' CHECK (mode IN ('semi_autonomous', 'fully_autonomous')),
  auto_collect BOOLEAN DEFAULT TRUE,
  auto_evaluate BOOLEAN DEFAULT TRUE,
  auto_rewrite BOOLEAN DEFAULT TRUE,
  auto_publish BOOLEAN DEFAULT FALSE,
  collect_interval INT DEFAULT 60,
  max_articles_per_day INT DEFAULT 10,
  social_platforms TEXT DEFAULT 'blog,twitter,facebook,linkedin,instagram',
  site_name TEXT DEFAULT 'Nexus News AI',
  site_tagline TEXT DEFAULT 'Il giornale di nuova generazione',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations (this is a demo app with public access)
CREATE POLICY "Allow all on agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on articles" ON articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on publish_logs" ON publish_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on approval_logs" ON approval_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
