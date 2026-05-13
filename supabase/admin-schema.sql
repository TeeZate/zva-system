-- =====================================================
-- ZVA ADMIN EXTENSIONS SCHEMA
-- Run this in Supabase SQL Editor after schema.sql
-- =====================================================

-- =====================================================
-- ADMIN USERS (links Supabase auth users to roles)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('super_admin', 'team_admin', 'statistician')),
  team_id     UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read their own row (proxy role check)
CREATE POLICY "Users can read own admin record"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can write (super admin ops go through service role)
CREATE POLICY "Service role full access to admin_users"
  ON admin_users FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_admin_users_team ON admin_users(team_id);

-- =====================================================
-- TEAM O2 UPLOADS (FIVB player registration forms)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_o2_uploads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season          TEXT NOT NULL,                  -- e.g. '2025/2026'
  file_url        TEXT NOT NULL,                  -- Supabase Storage URL
  file_name       TEXT NOT NULL,                  -- original filename
  file_size_bytes BIGINT,
  player_count    INTEGER,                        -- how many players on this O2
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes  TEXT,
  uploaded_by     UUID REFERENCES auth.users(id),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE team_o2_uploads ENABLE ROW LEVEL SECURITY;

-- Team admins can insert for their own team
CREATE POLICY "Team admins can upload O2s"
  ON team_o2_uploads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND team_id = team_o2_uploads.team_id
        AND is_active = true
    )
  );

-- Team admins can view their own team's uploads
CREATE POLICY "Team admins can view own uploads"
  ON team_o2_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND team_id = team_o2_uploads.team_id
    )
    OR auth.role() = 'service_role'
  );

-- Service role can update (approve/reject)
CREATE POLICY "Service role can update O2 status"
  ON team_o2_uploads FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE INDEX idx_o2_uploads_team ON team_o2_uploads(team_id);
CREATE INDEX idx_o2_uploads_status ON team_o2_uploads(status);
CREATE INDEX idx_o2_uploads_season ON team_o2_uploads(season);

-- =====================================================
-- SYSTEM EVENTS (error & health log)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL,          -- 'upload_error', 'auth_failure', 'db_error', 'api_error', 'storage_error'
  severity    TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  source      TEXT NOT NULL,          -- 'o2_upload', 'login', 'match_score', 'realtime', etc.
  message     TEXT NOT NULL,
  details     JSONB,                  -- stack trace, request data, etc.
  user_email  TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- Only service role reads/writes system events
CREATE POLICY "Service role full access to system_events"
  ON system_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_system_events_type ON system_events(type);
CREATE INDEX idx_system_events_severity ON system_events(severity);
CREATE INDEX idx_system_events_created ON system_events(created_at DESC);

-- =====================================================
-- ADD STATISTICIAN ROLE (run this if admin_users already exists)
-- ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;
-- ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
--   CHECK (role IN ('super_admin', 'team_admin', 'statistician'));

-- =====================================================
-- SCOUT STAT EVENTS (granular per-action stats from COURT app)
-- =====================================================
CREATE TABLE IF NOT EXISTS scout_stat_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id    UUID REFERENCES players(id) ON DELETE SET NULL,
  team         TEXT NOT NULL CHECK (team IN ('home', 'away')),
  player_num   TEXT,
  player_name  TEXT,
  player_pos   TEXT,
  action       TEXT NOT NULL,   -- 'attack', 'serve', 'block', 'dig', 'receive', 'set', 'ace', 'kill'
  outcome      TEXT NOT NULL CHECK (outcome IN ('good', 'ok', 'bad')),
  detail       TEXT,            -- attack type or serve type
  set_number   INTEGER,
  score_home   INTEGER,
  score_away   INTEGER,
  recorded_by  UUID REFERENCES auth.users(id),
  recorded_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scout_stat_events ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to scout_stat_events"
  ON scout_stat_events FOR ALL
  USING (auth.role() = 'service_role');

-- Admins/statisticians can read
CREATE POLICY "Admin users can read scout events"
  ON scout_stat_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE INDEX idx_scout_events_match  ON scout_stat_events(match_id);
CREATE INDEX idx_scout_events_player ON scout_stat_events(player_id);
CREATE INDEX idx_scout_events_action ON scout_stat_events(action);

-- =====================================================
-- STORAGE BUCKET for O2 forms
-- Run separately in Supabase Dashboard > Storage > New Bucket
-- Name: o2-forms, Private: true
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('o2-forms', 'o2-forms', false)
-- ON CONFLICT DO NOTHING;
