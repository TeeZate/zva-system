-- =====================================================
-- ZIMBABWE VOLLEYBALL ASSOCIATION DATABASE SCHEMA
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom types
CREATE TYPE division AS ENUM ('premier', 'division_one', 'division_two', 'junior', 'women');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed', 'cancelled');
CREATE TYPE tournament_status AS ENUM ('upcoming', 'ongoing', 'completed');
CREATE TYPE player_position AS ENUM ('setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist');
CREATE TYPE news_category AS ENUM ('match_report', 'announcement', 'transfer', 'national_team', 'general');
CREATE TYPE event_type AS ENUM ('point_home', 'point_away', 'set_home', 'set_away', 'timeout_home', 'timeout_away', 'substitution', 'challenge');
CREATE TYPE official_role AS ENUM ('head_referee', 'line_judge', 'scorer');

-- =====================================================
-- VENUES
-- =====================================================
CREATE TABLE venues (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  province    TEXT NOT NULL,
  address     TEXT,
  capacity    INTEGER,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TEAMS
-- =====================================================
CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  short_name      TEXT NOT NULL,
  logo_url        TEXT,
  city            TEXT NOT NULL,
  province        TEXT NOT NULL,
  division        division NOT NULL DEFAULT 'premier',
  coach           TEXT,
  founded_year    INTEGER,
  home_venue_id   UUID REFERENCES venues(id),
  colors          TEXT,
  wins            INTEGER NOT NULL DEFAULT 0,
  losses          INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_teams_division ON teams(division);
CREATE INDEX idx_teams_name_trgm ON teams USING gin(name gin_trgm_ops);

-- =====================================================
-- PLAYERS
-- =====================================================
CREATE TABLE players (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id           UUID REFERENCES teams(id) ON DELETE SET NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  number            INTEGER,
  position          player_position,
  nationality       TEXT NOT NULL DEFAULT 'Zimbabwean',
  date_of_birth     DATE,
  height_cm         INTEGER,
  photo_url         TEXT,
  is_national_team  BOOLEAN NOT NULL DEFAULT false,
  career_points     INTEGER NOT NULL DEFAULT 0,
  career_aces       INTEGER NOT NULL DEFAULT 0,
  career_blocks     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_national ON players(is_national_team) WHERE is_national_team = true;
CREATE INDEX idx_players_name_trgm ON players USING gin((first_name || ' ' || last_name) gin_trgm_ops);

-- =====================================================
-- OFFICIALS
-- =====================================================
CREATE TABLE officials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  role            official_role NOT NULL DEFAULT 'head_referee',
  license_number  TEXT,
  province        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TOURNAMENTS
-- =====================================================
CREATE TABLE tournaments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  season      TEXT NOT NULL,
  division    division NOT NULL DEFAULT 'premier',
  start_date  DATE NOT NULL,
  end_date    DATE,
  status      tournament_status NOT NULL DEFAULT 'upcoming',
  description TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_season ON tournaments(season);

-- =====================================================
-- MATCHES
-- =====================================================
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id   UUID REFERENCES tournaments(id),
  home_team_id    UUID NOT NULL REFERENCES teams(id),
  away_team_id    UUID NOT NULL REFERENCES teams(id),
  venue_id        UUID REFERENCES venues(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          match_status NOT NULL DEFAULT 'scheduled',
  current_set     INTEGER NOT NULL DEFAULT 1,
  home_sets       INTEGER NOT NULL DEFAULT 0,
  away_sets       INTEGER NOT NULL DEFAULT 0,
  home_score      INTEGER NOT NULL DEFAULT 0,
  away_score      INTEGER NOT NULL DEFAULT 0,
  referee         TEXT,
  attendance      INTEGER,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_teams CHECK (home_team_id <> away_team_id)
);

CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);

-- =====================================================
-- SET SCORES
-- =====================================================
CREATE TABLE set_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number      INTEGER NOT NULL,
  home_points     INTEGER NOT NULL DEFAULT 0,
  away_points     INTEGER NOT NULL DEFAULT 0,
  is_final        BOOLEAN NOT NULL DEFAULT false,
  duration_minutes INTEGER,
  UNIQUE(match_id, set_number)
);

CREATE INDEX idx_set_scores_match ON set_scores(match_id);

-- =====================================================
-- MATCH EVENTS (real-time feed)
-- =====================================================
CREATE TABLE match_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  type        event_type NOT NULL,
  team_id     UUID REFERENCES teams(id),
  player_id   UUID REFERENCES players(id),
  set_number  INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_created ON match_events(created_at DESC);

-- =====================================================
-- STANDINGS
-- =====================================================
CREATE TABLE standings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  played          INTEGER NOT NULL DEFAULT 0,
  won             INTEGER NOT NULL DEFAULT 0,
  lost            INTEGER NOT NULL DEFAULT 0,
  sets_won        INTEGER NOT NULL DEFAULT 0,
  sets_lost       INTEGER NOT NULL DEFAULT 0,
  points_won      INTEGER NOT NULL DEFAULT 0,
  points_lost     INTEGER NOT NULL DEFAULT 0,
  league_points   INTEGER NOT NULL DEFAULT 0,
  position        INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tournament_id, team_id)
);

CREATE INDEX idx_standings_tournament ON standings(tournament_id, position);

-- =====================================================
-- NEWS ARTICLES
-- =====================================================
CREATE TABLE news_articles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  excerpt       TEXT,
  content       TEXT NOT NULL,
  thumbnail_url TEXT,
  author        TEXT NOT NULL DEFAULT 'ZVA Media',
  category      news_category NOT NULL DEFAULT 'general',
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_featured ON news_articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_news_slug ON news_articles(slug);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE venues          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles   ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read venues"       ON venues         FOR SELECT USING (true);
CREATE POLICY "Public read teams"        ON teams          FOR SELECT USING (true);
CREATE POLICY "Public read players"      ON players        FOR SELECT USING (true);
CREATE POLICY "Public read officials"    ON officials      FOR SELECT USING (true);
CREATE POLICY "Public read tournaments"  ON tournaments    FOR SELECT USING (true);
CREATE POLICY "Public read matches"      ON matches        FOR SELECT USING (true);
CREATE POLICY "Public read set_scores"   ON set_scores     FOR SELECT USING (true);
CREATE POLICY "Public read match_events" ON match_events   FOR SELECT USING (true);
CREATE POLICY "Public read standings"    ON standings      FOR SELECT USING (true);
CREATE POLICY "Public read news"         ON news_articles  FOR SELECT USING (true);

-- Admin write access (service role bypasses RLS)

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE set_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE standings;

-- =====================================================
-- SEED DATA
-- =====================================================
INSERT INTO venues (name, city, province, capacity) VALUES
  ('Harare Sports Club', 'Harare', 'Harare', 3000),
  ('Bulawayo Athletic Club', 'Bulawayo', 'Matabeleland North', 2500),
  ('Gweru Aquatic Complex', 'Gweru', 'Midlands', 1500),
  ('Mutare Sports Arena', 'Mutare', 'Manicaland', 1200),
  ('ZVA National Gymnasium', 'Harare', 'Harare', 5000);

INSERT INTO teams (name, short_name, city, province, division, coach, founded_year, colors) VALUES
  ('Harare Eagles Volleyball Club', 'HRE Eagles', 'Harare', 'Harare', 'premier', 'Tendai Moyo', 2005, '#006400,#FFD200'),
  ('Bulawayo Giants VC', 'BYO Giants', 'Bulawayo', 'Matabeleland North', 'premier', 'Sipho Ndlovu', 1998, '#1a1a2e,#16213e'),
  ('Dynamos VC', 'Dynamos', 'Harare', 'Harare', 'premier', 'Prosper Chisakara', 2010, '#0000CD,#FFD200'),
  ('Chapungu Volleyball Club', 'Chapungu', 'Gweru', 'Midlands', 'premier', 'Godwin Mhere', 2003, '#8B0000,#FFFFFF'),
  ('ZPC Kariba VC', 'ZPC Kariba', 'Kariba', 'Mashonaland West', 'premier', 'Blessing Munyaka', 2007, '#006994,#FFFFFF'),
  ('Flame Lilies VC', 'Flame Lilies', 'Harare', 'Harare', 'women', 'Rutendo Chiduku', 2012, '#FF4500,#FFD200'),
  ('Mazowe Thunderbirds', 'Mazowe TB', 'Mazowe', 'Mashonaland Central', 'premier', 'Emmanuel Mupinda', 2001, '#8B4513,#FFD200'),
  ('Highlanders VC', 'Highlanders', 'Bulawayo', 'Matabeleland North', 'premier', 'Dumisani Moyo', 1995, '#000000,#FFFFFF');

INSERT INTO tournaments (name, short_name, season, division, start_date, end_date, status) VALUES
  ('ZVA Premier League 2025', 'Premier League', '2025', 'premier', '2025-03-01', '2025-11-30', 'ongoing'),
  ('ZVA Women''s League 2025', 'Women''s League', '2025', 'women', '2025-04-01', '2025-10-31', 'ongoing'),
  ('ZVA Cup 2025', 'ZVA Cup', '2025', 'premier', '2025-06-01', '2025-07-31', 'upcoming'),
  ('Junior Championship 2025', 'Junior Champs', '2025', 'junior', '2025-08-01', '2025-08-31', 'upcoming');
