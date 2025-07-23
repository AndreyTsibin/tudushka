-- Create task_attachments table
CREATE TABLE task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    telegram_file_id VARCHAR(200) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    original_name VARCHAR(255),
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_attachments_file_type ON task_attachments(file_type);
CREATE INDEX idx_attachments_telegram_file_id ON task_attachments(telegram_file_id);

-- Add constraint to ensure file_size is positive
ALTER TABLE task_attachments ADD CONSTRAINT check_positive_file_size 
    CHECK (file_size IS NULL OR file_size > 0);

-- Add constraint for valid file types
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

-- ROLLBACK
DROP INDEX IF EXISTS idx_attachments_telegram_file_id;
DROP INDEX IF EXISTS idx_attachments_file_type;
DROP INDEX IF EXISTS idx_attachments_task_id;
DROP TABLE IF EXISTS task_attachments;
-- ROLLBACK END