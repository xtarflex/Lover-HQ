-- Create a public bucket for music media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music-media',
  'music-media',
  true,
  10485760, -- 10MB limit in bytes
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Security Policies on storage.objects

-- Allow authenticated users to upload media files to the music-media bucket
DROP POLICY IF EXISTS "Authenticated users can upload music media" ON storage.objects;
CREATE POLICY "Authenticated users can upload music media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-media' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND partner_id IS NOT NULL
  )
);

-- Allow authenticated users to view/download media files in the music-media bucket
DROP POLICY IF EXISTS "Users can view music media" ON storage.objects;
CREATE POLICY "Users can view music media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'music-media' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND partner_id IS NOT NULL
  )
);

-- Allow authenticated users to delete their own media files in the music-media bucket
DROP POLICY IF EXISTS "Users can delete own music media" ON storage.objects;
CREATE POLICY "Users can delete own music media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-media' AND
  owner = auth.uid()
);
