-- SETUP SUPABASE STORAGE FOR CHAT
-- Run this in Supabase SQL Editor

-- 1. Create the 'chat-attachments' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Authenticated writes (Uploads)
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-attachments' );

-- 3. Allow Authenticated reads (View Images)
CREATE POLICY "Users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'chat-attachments' );
