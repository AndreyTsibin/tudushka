-- Update field sizes to match documentation

-- Update users table field sizes
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(100);
ALTER TABLE users ALTER COLUMN first_name TYPE VARCHAR(100);
ALTER TABLE users ALTER COLUMN last_name TYPE VARCHAR(100);

-- Add missing index from documentation that wasn't in original migrations
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ai_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(date);

-- Update the file type constraint in task_attachments to match documentation
ALTER TABLE task_attachments DROP CONSTRAINT IF EXISTS check_valid_file_type;
ALTER TABLE task_attachments ADD CONSTRAINT check_valid_file_type
    CHECK (file_type IN ('photo', 'document', 'video', 'audio'));

-- Add comment to clarify file storage method
COMMENT ON TABLE task_attachments IS 'Files stored in Telegram Bot API, referenced by telegram_file_id';
COMMENT ON COLUMN task_attachments.telegram_file_id IS 'Telegram Bot API file identifier for retrieving uploaded files';
COMMENT ON COLUMN task_attachments.file_type IS 'Telegram file type: photo, document, video, audio';

-- Add comments to other key tables
COMMENT ON TABLE users IS 'User profiles with Telegram authentication and subscription data';
COMMENT ON TABLE tasks IS 'Todo items with AI integration and repeat functionality';
COMMENT ON TABLE ai_chats IS 'AI chat sessions with Perplexity API integration';
COMMENT ON TABLE ai_messages IS 'Individual messages in AI chat conversations';
COMMENT ON TABLE usage_stats IS 'Daily usage tracking for subscription limits';
COMMENT ON TABLE user_sessions IS 'Session storage for rate limiting and authentication';

-- ROLLBACK
ALTER TABLE task_attachments DROP CONSTRAINT IF EXISTS check_valid_file_type;
ALTER TABLE task_attachments ADD CONSTRAINT check_valid_file_type
    CHECK (file_type IN (
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'video/mp4', 'video/webm', 'video/ogg',
        'application/zip', 'application/x-rar-compressed'
    ));

DROP INDEX IF EXISTS idx_usage_stats_date;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_tasks_created_at;

ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(255);
ALTER TABLE users ALTER COLUMN first_name TYPE VARCHAR(255);
ALTER TABLE users ALTER COLUMN last_name TYPE VARCHAR(255);
-- ROLLBACK END