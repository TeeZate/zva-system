-- Team staff
CREATE TABLE IF NOT EXISTS team_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach',
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE team_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read team_staff" ON team_staff FOR SELECT USING (true);

-- Media galleries
CREATE TABLE IF NOT EXISTS media_galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE media_galleries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read media_galleries" ON media_galleries FOR SELECT USING (true);

-- Media items
CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES media_galleries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'photo',
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read media_items" ON media_items FOR SELECT USING (true);

-- Extend news_articles
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_title TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_photo_url TEXT;

-- Storage: create a public bucket named "zva-uploads" in Supabase dashboard
-- Allow all uploads: INSERT policy for anon role on bucket zva-uploads
