-- Create ai_chats table
CREATE TABLE ai_chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Новый чат',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_chats_user_id ON ai_chats(user_id);
CREATE INDEX idx_ai_chats_created_at ON ai_chats(created_at);
CREATE INDEX idx_ai_chats_user_created ON ai_chats(user_id, created_at);

-- Add constraint to ensure title is not empty
ALTER TABLE ai_chats ADD CONSTRAINT check_title_not_empty 
    CHECK (title IS NOT NULL AND LENGTH(TRIM(title)) > 0);

-- ROLLBACK
DROP INDEX IF EXISTS idx_ai_chats_user_created;
DROP INDEX IF EXISTS idx_ai_chats_created_at;
DROP INDEX IF EXISTS idx_ai_chats_user_id;
DROP TABLE IF EXISTS ai_chats;
-- ROLLBACK END