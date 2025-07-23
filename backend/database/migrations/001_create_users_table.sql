-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    birth_date DATE,
    language VARCHAR(2) DEFAULT 'ru',
    subscription_plan VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX idx_users_subscription_expires ON users(subscription_expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ROLLBACK
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS idx_users_subscription_expires;
DROP INDEX IF EXISTS idx_users_subscription_plan;
DROP INDEX IF EXISTS idx_users_telegram_id;
DROP TABLE IF EXISTS users;
-- ROLLBACK END