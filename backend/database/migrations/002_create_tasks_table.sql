-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_by_ai BOOLEAN DEFAULT false,
    ai_context TEXT,
    repeat_interval VARCHAR(20) CHECK (repeat_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
    repeat_until DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_by_ai ON tasks(created_by_ai);
CREATE INDEX idx_tasks_repeat_interval ON tasks(repeat_interval);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set completed_at when task is marked as completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND OLD.completed = false THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = false AND OLD.completed = true THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_tasks_completed_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_at();

-- ROLLBACK
DROP TRIGGER IF EXISTS set_tasks_completed_at ON tasks;
DROP FUNCTION IF EXISTS set_completed_at();
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP INDEX IF EXISTS idx_tasks_user_due_date;
DROP INDEX IF EXISTS idx_tasks_user_completed;
DROP INDEX IF EXISTS idx_tasks_repeat_interval;
DROP INDEX IF EXISTS idx_tasks_created_by_ai;
DROP INDEX IF EXISTS idx_tasks_completed;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP TABLE IF EXISTS tasks;
-- ROLLBACK END