-- Create notes table for PIN-based note sharing
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin VARCHAR(6) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create index on PIN for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_pin ON notes(pin);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_notes_expires_at ON notes(expires_at);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone with the PIN can read)
CREATE POLICY "Allow public read" ON notes FOR SELECT USING (true);

-- Allow public insert (anyone can create a note)
CREATE POLICY "Allow public insert" ON notes FOR INSERT WITH CHECK (true);

-- Allow public delete for expired notes cleanup
CREATE POLICY "Allow public delete" ON notes FOR DELETE USING (true);
