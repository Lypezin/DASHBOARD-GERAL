-- Add columns for Advanced Chat Features
-- Run this in the Supabase SQL Editor

-- 1. Add 'reply_to_id' column for replies
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id);

-- 2. Add 'reactions' column for emojis (JSONB to store map of userId -> emoji)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- 3. Add 'attachments' column for files (JSONB array)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 4. Add 'is_pinned' column
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 5. Add 'type' column to support different message kinds
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';

-- 6. Ensure Realtime is enabled for these columns (should be automatic if table is in pub, but good to verify)
-- If you haven't run this before:
-- alter publication supabase_realtime add table chat_messages;
