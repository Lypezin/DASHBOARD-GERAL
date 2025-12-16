-- SETUP SUPABASE STORAGE FOR PRESENTATION MEDIA
-- Run this in Supabase SQL Editor

-- 1. Create the 'presentation-media' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentation-media', 'presentation-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Authenticated users to upload
CREATE POLICY "Authenticated users can upload presentation media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'presentation-media' );

-- 3. Allow Authenticated users to view
CREATE POLICY "Users can view presentation media"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'presentation-media' );
