-- Create ai_messages table
CREATE TABLE ai_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_messages_chat_id ON ai_messages(chat_id);
CREATE INDEX idx_messages_role ON ai_messages(role);
CREATE INDEX idx_messages_created_at ON ai_messages(created_at);
CREATE INDEX idx_messages_chat_created ON ai_messages(chat_id, created_at);

-- Add constraint to ensure content is not empty
ALTER TABLE ai_messages ADD CONSTRAINT check_content_not_empty 
    CHECK (content IS NOT NULL AND LENGTH(TRIM(content)) > 0);

-- ROLLBACK
DROP INDEX IF EXISTS idx_messages_chat_created;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_role;
DROP INDEX IF EXISTS idx_messages_chat_id;
DROP TABLE IF EXISTS ai_messages;
-- ROLLBACK END