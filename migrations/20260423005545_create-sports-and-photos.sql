-- Sports categories
CREATE TABLE sports (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed sports
INSERT INTO sports (name, slug) VALUES
  ('Fútbol',     'futbol'),
  ('Tenis',      'tenis'),
  ('Boxeo',      'boxeo'),
  ('Atletismo',  'atletismo'),
  ('Ciclismo',   'ciclismo'),
  ('Natación',   'natacion'),
  ('Esquí',      'esqui'),
  ('Basquetbol', 'basquetbol'),
  ('Voleibol',   'voleibol'),
  ('Otro',       'otro');

-- Historical photos
CREATE TABLE photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  story         text NOT NULL,
  sport_id      uuid REFERENCES sports(id) ON DELETE SET NULL,
  year          integer CHECK (year BETWEEN 1900 AND 2100),
  athlete_name  text,
  photographer  text,
  location      text,
  image_url     text NOT NULL,
  image_key     text NOT NULL,
  featured      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Public read for both tables
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_sports"
  ON sports FOR SELECT USING (true);

CREATE POLICY "public_read_photos"
  ON photos FOR SELECT USING (true);

-- Only authenticated users (admin) can insert / update / delete
CREATE POLICY "admin_insert_sports"
  ON sports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_sports"
  ON sports FOR UPDATE TO authenticated USING (true);

CREATE POLICY "admin_delete_sports"
  ON sports FOR DELETE TO authenticated USING (true);

CREATE POLICY "admin_insert_photos"
  ON photos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_photos"
  ON photos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "admin_delete_photos"
  ON photos FOR DELETE TO authenticated USING (true);

-- Indexes for common filters
CREATE INDEX idx_photos_sport_id ON photos(sport_id);
CREATE INDEX idx_photos_year     ON photos(year);
CREATE INDEX idx_photos_featured ON photos(featured);
CREATE INDEX idx_photos_athlete  ON photos(athlete_name);
