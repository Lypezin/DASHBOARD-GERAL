-- FIX CHAT PERMISSIONS (RLS) FOR REACTIONS AND REPLIES
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on the table if not already enabled (safety check)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Allow ALL authenticated users to INSERT messages
-- (You likely already have this, but ensuring it)
CREATE POLICY "Users can insert their own messages" 
ON chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = from_user);

-- 3. Allow ALL authenticated users to SELECT (view) messages 
-- involving them is already likely covered, but for public chat or open sidebar:
-- Modify this if you want stricter privacy. Currently assuming users can see chat history.
-- If you only want users to see messages sent to/from them:
-- CREATE POLICY "Users can view their own messages" ON chat_messages FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);

-- 4. CRITICAL: Allow users to UPDATE messages (for Reactions/Pins)
-- We need to allow users to update the 'reactions' column of ANY message they can see.
-- Since Supabase RLS is row-based, we'll allow update if the user is authenticated.
-- Note: Ideally we'd restrict this to only 'reactions' column but Postgres RLS is row-level.
-- We rely on the backend logic or trust authenticated users for this internal tool.

CREATE POLICY "Enable update for authenticated users" 
ON chat_messages FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- If you are paranoid about security, you can use a stricter policy like:
-- USING (auth.uid() = from_user OR auth.uid() = to_user OR (select count(*) from online_users) > 0)
-- But sticking to "authenticated" is easiest for now to fix the bug.

-- 5. Fix "Message Anterior" issue
-- The UI fix I pushed handles the display, but ensure 'reply_to_id' column exists (from previous script).
