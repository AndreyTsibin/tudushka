-- Create usage_stats table
CREATE TABLE usage_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_messages_today INTEGER DEFAULT 0 CHECK (ai_messages_today >= 0),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_usage_user_date ON usage_stats(user_id, date);
CREATE INDEX idx_usage_date ON usage_stats(date);
CREATE INDEX idx_usage_user_id ON usage_stats(user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_usage_stats_updated_at
    BEFORE UPDATE ON usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get or create usage stats for today
CREATE OR REPLACE FUNCTION get_or_create_usage_stats(p_user_id INTEGER, p_date DATE DEFAULT CURRENT_DATE)
RETURNS usage_stats AS $$
DECLARE
    stats usage_stats;
BEGIN
    -- Try to get existing stats
    SELECT * INTO stats FROM usage_stats 
    WHERE user_id = p_user_id AND date = p_date;
    
    -- If not found, create new record
    IF NOT FOUND THEN
        INSERT INTO usage_stats (user_id, date, ai_messages_today)
        VALUES (p_user_id, p_date, 0)
        RETURNING * INTO stats;
    END IF;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment AI message count
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

-- Create view for current usage stats
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

-- ROLLBACK
DROP VIEW IF EXISTS current_usage_stats;
DROP FUNCTION IF EXISTS increment_ai_messages(INTEGER);
DROP FUNCTION IF EXISTS get_or_create_usage_stats(INTEGER, DATE);
DROP TRIGGER IF EXISTS update_usage_stats_updated_at ON usage_stats;
DROP INDEX IF EXISTS idx_usage_user_id;
DROP INDEX IF EXISTS idx_usage_date;
DROP INDEX IF EXISTS idx_usage_user_date;
DROP TABLE IF EXISTS usage_stats;
-- ROLLBACK END