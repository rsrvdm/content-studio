-- Already created in your "content-studio" D1 database. Kept here for reference.
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  caption TEXT NOT NULL,
  image TEXT,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_when ON posts(scheduled_at);

-- Added for brands/clients (also already applied):
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'client',
  website TEXT DEFAULT '', area TEXT DEFAULT '', audience TEXT DEFAULT '', services TEXT DEFAULT '',
  voice TEXT DEFAULT '', avoid TEXT DEFAULT '', colours TEXT DEFAULT '', hashtags TEXT DEFAULT '',
  notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE posts ADD COLUMN brand_id INTEGER;

-- Added for video generation (Veo):
ALTER TABLE posts ADD COLUMN video TEXT;
