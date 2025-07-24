const db = require('../config/database');

class Attachment {
    static async findByTaskId(taskId) {
        try {
            if (!taskId) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const query = `
                SELECT 
                    id, task_id, original_name, file_type, file_size,
                    telegram_file_id, telegram_file_url, true,
                    created_at, updated_at
                FROM task_attachments 
                WHERE task_id = $1                 ORDER BY created_at DESC
            `;
            
            const result = await db.query(query, [taskId]);

            return { success: true, data: result.rows, error: null };
        } catch (error) {
            console.error('Error in Attachment.findByTaskId:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async findById(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Attachment ID is required' };
            }

            const query = `
                SELECT 
                    id, task_id, original_name, file_type, file_size,
                    telegram_file_id, telegram_file_url, true,
                    created_at, updated_at
                FROM task_attachments 
                WHERE id = $1             `;
            
            const result = await db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Attachment not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Attachment.findById:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async create(taskId, fileData) {
        try {
            if (!taskId) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const { original_name, file_type, file_size, telegram_file_id } = fileData;

            if (!original_name || !telegram_file_id) {
                return { success: false, data: null, error: 'File name and Telegram file ID are required' };
            }

            // Validate file size (max 50MB for Pro plan)
            const maxFileSize = 50 * 1024 * 1024; // 50MB in bytes
            if (file_size && file_size > maxFileSize) {
                return { success: false, data: null, error: 'File size exceeds maximum limit (50MB)' };
            }

            // Validate file name length
            if (original_name.length > 255) {
                return { success: false, data: null, error: 'File name is too long (max 255 characters)' };
            }

            const query = `
                INSERT INTO task_attachments (
                    task_id, original_name, file_type, file_size,
                    telegram_file_id,
                    created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, NOW()
                )
                RETURNING 
                    id, task_id, original_name, file_type, file_size,
                    telegram_file_id,
                    created_at
            `;

            const result = await db.query(query, [
                taskId,
                original_name.trim(),
                file_type || null,
                file_size || null,
                telegram_file_id
            ]);

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Attachment.create:', error);
            
            if (error.code === '23503') { // foreign_key_violation
                return { success: false, data: null, error: 'Task not found' };
            }
            
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async delete(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Attachment ID is required' };
            }

            const query = `
                DELETE FROM task_attachments 
                WHERE id = $1 
                RETURNING id, telegram_file_id
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Attachment not found or already deleted' };
            }

            return { 
                success: true, 
                data: { 
                    id: result.rows[0].id,
                    telegram_file_id: result.rows[0].telegram_file_id
                }, 
                error: null 
            };
        } catch (error) {
            console.error('Error in Attachment.delete:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async getTaskAttachmentCount(taskId) {
        try {
            if (!taskId) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const query = `
                SELECT COUNT(*) as count
                FROM task_attachments 
                WHERE task_id = $1             `;

            const result = await db.query(query, [taskId]);

            return { 
                success: true, 
                data: { count: parseInt(result.rows[0].count) }, 
                error: null 
            };
        } catch (error) {
            console.error('Error in Attachment.getTaskAttachmentCount:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async getTotalFileSizeByTask(taskId) {
        try {
            if (!taskId) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const query = `
                SELECT COALESCE(SUM(file_size), 0) as total_size
                FROM task_attachments 
                WHERE task_id = $1             `;

            const result = await db.query(query, [taskId]);

            return { 
                success: true, 
                data: { total_size: parseInt(result.rows[0].total_size) }, 
                error: null 
            };
        } catch (error) {
            console.error('Error in Attachment.getTotalFileSizeByTask:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async findByUserTasks(userId, limit = 50, offset = 0) {
        try {
            if (!userId) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                SELECT 
                    ta.id, ta.task_id, ta.original_name, ta.file_type, ta.file_size,
                    ta.telegram_file_id, ta.telegram_file_url, ta.true,
                    ta.created_at, ta.updated_at,
                    t.title as task_title
                FROM task_attachments ta
                INNER JOIN tasks t ON ta.task_id = t.id
                WHERE t.user_id = $1                 ORDER BY ta.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(query, [userId, limit, offset]);

            return { success: true, data: result.rows, error: null };
        } catch (error) {
            console.error('Error in Attachment.findByUserTasks:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async getUserFilesStats(userId) {
        try {
            if (!userId) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                SELECT 
                    COUNT(*) as total_files,
                    COALESCE(SUM(ta.file_size), 0) as total_size,
                    COUNT(DISTINCT ta.task_id) as tasks_with_files
                FROM task_attachments ta
                INNER JOIN tasks t ON ta.task_id = t.id
                WHERE t.user_id = $1             `;

            const result = await db.query(query, [userId]);

            const stats = {
                total_files: parseInt(result.rows[0].total_files),
                total_size: parseInt(result.rows[0].total_size),
                tasks_with_files: parseInt(result.rows[0].tasks_with_files)
            };

            return { success: true, data: stats, error: null };
        } catch (error) {
            console.error('Error in Attachment.getUserFilesStats:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async cleanup(taskId) {
        try {
            if (!taskId) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const query = `
                DELETE FROM task_attachments 
                WHERE task_id = $1
            `;

            const result = await db.query(query, [taskId]);

            return { 
                success: true, 
                data: { deleted_count: result.rowCount }, 
                error: null 
            };
        } catch (error) {
            console.error('Error in Attachment.cleanup:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }
}

module.exports = Attachment;