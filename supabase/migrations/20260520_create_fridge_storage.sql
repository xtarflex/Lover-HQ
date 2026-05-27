-- Create a public bucket for fridge media
INSERT INTO storage.buckets (id, name, public)
VALUES ('fridge-media', 'fridge-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
-- Allow authenticated users to upload media files to the fridge-media bucket
DROP POLICY IF EXISTS "Authenticated users can upload fridge media" ON storage.objects;
CREATE POLICY "Authenticated users can upload fridge media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fridge-media');

-- Allow authenticated users to view/download media files in the fridge-media bucket
DROP POLICY IF EXISTS "Users can view fridge media" ON storage.objects;
CREATE POLICY "Users can view fridge media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'fridge-media');

-- Allow authenticated users to delete their own media files in the fridge-media bucket
DROP POLICY IF EXISTS "Users can delete own fridge media" ON storage.objects;
CREATE POLICY "Users can delete own fridge media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fridge-media' AND owner = auth.uid());
