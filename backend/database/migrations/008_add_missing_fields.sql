-- Add missing fields to existing tables

-- Add mime_type field to task_attachments table
ALTER TABLE task_attachments 
ADD COLUMN mime_type VARCHAR(100);

-- Add index for mime_type
CREATE INDEX idx_attachments_mime_type ON task_attachments(mime_type);

-- Add tokens_used field to ai_messages table
ALTER TABLE ai_messages 
ADD COLUMN tokens_used INTEGER DEFAULT 0;

-- Add constraint to ensure tokens_used is non-negative
ALTER TABLE ai_messages 
ADD CONSTRAINT check_tokens_non_negative 
CHECK (tokens_used >= 0);

-- Add index for tokens_used for analytics
CREATE INDEX idx_messages_tokens_used ON ai_messages(tokens_used);

-- Add files_uploaded_today field to usage_stats table
ALTER TABLE usage_stats 
ADD COLUMN files_uploaded_today INTEGER DEFAULT 0;

-- Add constraint to ensure files_uploaded_today is non-negative
ALTER TABLE usage_stats 
ADD CONSTRAINT check_files_non_negative 
CHECK (files_uploaded_today >= 0);

-- Update the increment_ai_messages function to handle the new field
CREATE OR REPLACE FUNCTION increment_ai_messages(p_user_id INTEGER, p_tokens INTEGER DEFAULT 0)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    INSERT INTO usage_stats (user_id, date, ai_messages_today)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        ai_messages_today = usage_stats.ai_messages_today + 1,
        updated_at = NOW()
    RETURNING ai_messages_today INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment file uploads
CREATE OR REPLACE FUNCTION increment_file_uploads(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    INSERT INTO usage_stats (user_id, date, files_uploaded_today)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        files_uploaded_today = usage_stats.files_uploaded_today + 1,
        updated_at = NOW()
    RETURNING files_uploaded_today INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Update the current_usage_stats view to include file upload limits
DROP VIEW IF EXISTS current_usage_stats;
CREATE VIEW current_usage_stats AS
SELECT 
    u.id as user_id,
    u.telegram_id,
    u.subscription_plan,
    COALESCE(us.ai_messages_today, 0) as ai_messages_today,
    COALESCE(us.files_uploaded_today, 0) as files_uploaded_today,
    CASE 
        WHEN u.subscription_plan = 'free' THEN 3
        WHEN u.subscription_plan = 'plus' THEN 30
        WHEN u.subscription_plan = 'pro' THEN -1  -- unlimited
        ELSE 3
    END as ai_messages_limit,
    CASE 
        WHEN u.subscription_plan = 'free' THEN 3
        WHEN u.subscription_plan = 'plus' THEN 10
        WHEN u.subscription_plan = 'pro' THEN 20
        ELSE 3
    END as files_per_task_limit,
    CASE 
        WHEN u.subscription_plan = 'free' THEN 10485760   -- 10MB
        WHEN u.subscription_plan = 'plus' THEN 20971520  -- 20MB  
        WHEN u.subscription_plan = 'pro' THEN 52428800   -- 50MB
        ELSE 10485760
    END as max_file_size
FROM users u
LEFT JOIN usage_stats us ON u.id = us.user_id AND us.date = CURRENT_DATE;

-- ROLLBACK
DROP VIEW IF EXISTS current_usage_stats;
CREATE VIEW current_usage_stats AS
SELECT 
    u.id as user_id,
    u.telegram_id,
    u.subscription_plan,
    COALESCE(us.ai_messages_today, 0) as ai_messages_today,
    CASE 
        WHEN u.subscription_plan = 'free' THEN 3
        WHEN u.subscription_plan = 'plus' THEN 30
        WHEN u.subscription_plan = 'pro' THEN -1  -- unlimited
        ELSE 3
    END as ai_messages_limit
FROM users u
LEFT JOIN usage_stats us ON u.id = us.user_id AND us.date = CURRENT_DATE;

DROP FUNCTION IF EXISTS increment_file_uploads(INTEGER);
CREATE OR REPLACE FUNCTION increment_ai_messages(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    INSERT INTO usage_stats (user_id, date, ai_messages_today)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        ai_messages_today = usage_stats.ai_messages_today + 1,
        updated_at = NOW()
    RETURNING ai_messages_today INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

DROP INDEX IF EXISTS idx_messages_tokens_used;
ALTER TABLE ai_messages DROP CONSTRAINT IF EXISTS check_tokens_non_negative;
ALTER TABLE ai_messages DROP COLUMN IF EXISTS tokens_used;

ALTER TABLE usage_stats DROP CONSTRAINT IF EXISTS check_files_non_negative;
ALTER TABLE usage_stats DROP COLUMN IF EXISTS files_uploaded_today;

DROP INDEX IF EXISTS idx_attachments_mime_type;
ALTER TABLE task_attachments DROP COLUMN IF EXISTS mime_type;
-- ROLLBACK END