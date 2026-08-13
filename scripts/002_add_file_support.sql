-- Add file support columns to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS burn_after_reading BOOLEAN DEFAULT FALSE;

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('notepin-files', 'notepin-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the storage bucket
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'notepin-files');

CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'notepin-files');

CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'notepin-files');
