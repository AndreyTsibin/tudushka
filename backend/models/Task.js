const db = require('../config/database');

class Task {
    static async findByUserId(userId, filters = {}) {
        try {
            if (!userId) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            let query = `
                SELECT 
                    id, user_id, title, description, due_date, completed,
                    repeat_interval, repeat_until,
                    created_at, updated_at, completed_at
                FROM tasks 
                WHERE user_id = $1             `;
            
            const params = [userId];
            let paramCount = 2;

            // Apply filters
            if (filters.completed !== undefined) {
                query += ` AND completed = $${paramCount}`;
                params.push(filters.completed);
                paramCount++;
            }

            if (filters.startDate) {
                query += ` AND due_date >= $${paramCount}`;
                params.push(filters.startDate);
                paramCount++;
            }

            if (filters.endDate) {
                query += ` AND due_date <= $${paramCount}`;
                params.push(filters.endDate);
                paramCount++;
            }

            if (filters.priority) {
                query += ` AND priority = $${paramCount}`;
                params.push(filters.priority);
                paramCount++;
            }

            // Pagination
            const limit = filters.limit || 50;
            const offset = filters.offset || 0;
            
            query += ` ORDER BY 
                CASE WHEN completed THEN 1 ELSE 0 END,
                due_date ASC NULLS LAST,
                priority DESC,
                created_at DESC
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            
            params.push(limit, offset);

            const result = await db.query(query, params);

            return { success: true, data: result.rows, error: null };
        } catch (error) {
            console.error('Error in Task.findByUserId:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async findById(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const query = `
                SELECT 
                    id, user_id, title, description, due_date, completed,
                    repeat_interval, repeat_until,
                    created_at, updated_at, completed_at
                FROM tasks 
                WHERE id = $1             `;
            
            const result = await db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Task not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Task.findById:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async create(userId, taskData) {
        try {
            if (!userId) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const { title, description, due_date, priority, repeat_interval, repeat_until } = taskData;

            if (!title || title.trim().length === 0) {
                return { success: false, data: null, error: 'Task title is required' };
            }

            if (title.length > 500) {
                return { success: false, data: null, error: 'Task title is too long (max 500 characters)' };
            }

            const validPriorities = ['low', 'medium', 'high'];
            if (priority && !validPriorities.includes(priority)) {
                return { success: false, data: null, error: 'Invalid priority value' };
            }

            const query = `
                INSERT INTO tasks (
                    user_id, title, description, due_date,
                    repeat_interval, repeat_until, completed,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, false, NOW(), NOW()
                )
                RETURNING 
                    id, user_id, title, description, due_date, completed,
                    repeat_interval, repeat_until,
                    created_at, updated_at, completed_at
            `;

            const result = await db.query(query, [
                userId,
                title.trim(),
                description || null,
                due_date || null,
                repeat_interval || null,
                repeat_until || null
            ]);

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Task.create:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async update(id, taskData) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const allowedFields = ['title', 'description', 'due_date', 'repeat_interval', 'repeat_until'];
            const updates = [];
            const values = [];
            let paramCount = 1;

            Object.keys(taskData).forEach(key => {
                if (allowedFields.includes(key) && taskData[key] !== undefined) {
                    if (key === 'title') {
                        if (!taskData[key] || taskData[key].trim().length === 0) {
                            throw new Error('Task title cannot be empty');
                        }
                        if (taskData[key].length > 500) {
                            throw new Error('Task title is too long (max 500 characters)');
                        }
                        updates.push(`${key} = $${paramCount}`);
                        values.push(taskData[key].trim());
                    } else {
                        updates.push(`${key} = $${paramCount}`);
                        values.push(taskData[key]);
                    }
                    paramCount++;
                }
            });

            if (updates.length === 0) {
                return { success: false, data: null, error: 'No valid fields to update' };
            }

            updates.push(`updated_at = NOW()`);
            values.push(id);

            const query = `
                UPDATE tasks 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}                 RETURNING 
                    id, user_id, title, description, due_date, completed,
                    repeat_interval, repeat_until,
                    created_at, updated_at, completed_at
            `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Task not found or inactive' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Task.update:', error);
            
            if (error.message.includes('title')) {
                return { success: false, data: null, error: error.message };
            }
            
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async delete(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const query = `
                DELETE FROM tasks 
                WHERE id = $1 
                RETURNING id
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Task not found or already deleted' };
            }

            return { success: true, data: { id: result.rows[0].id }, error: null };
        } catch (error) {
            console.error('Error in Task.delete:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async markCompleted(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Task ID is required' };
            }

            const query = `
                UPDATE tasks 
                SET 
                    completed = true,
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE id = $1                 RETURNING 
                    id, user_id, title, description, due_date, completed,
                    repeat_interval, repeat_until,
                    created_at, updated_at, completed_at
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Task not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Task.markCompleted:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async findByDateRange(userId, startDate, endDate) {
        try {
            if (!userId || !startDate || !endDate) {
                return { success: false, data: null, error: 'User ID, start date, and end date are required' };
            }

            const query = `
                SELECT 
                    id, user_id, title, description, due_date, completed,
                    repeat_interval, repeat_until,
                    created_at, updated_at, completed_at
                FROM tasks 
                WHERE user_id = $1 
                                        AND due_date >= $2 
                    AND due_date <= $3
                ORDER BY due_date ASC, priority DESC
            `;

            const result = await db.query(query, [userId, startDate, endDate]);

            return { success: true, data: result.rows, error: null };
        } catch (error) {
            console.error('Error in Task.findByDateRange:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async findRepeatingTasks() {
        try {
            const query = `
                SELECT 
                    id, user_id, title, description, due_date, completed,
                    repeat_interval, repeat_until,
                    created_at, updated_at, completed_at
                FROM tasks 
                WHERE true = true 
                    AND repeat_interval IS NOT NULL
                    AND (repeat_until IS NULL OR repeat_until > NOW())
                    AND due_date < NOW()
                ORDER BY due_date ASC
            `;

            const result = await db.query(query);

            return { success: true, data: result.rows, error: null };
        } catch (error) {
            console.error('Error in Task.findRepeatingTasks:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async createRepeatingInstance(taskId, newDate) {
        try {
            if (!taskId || !newDate) {
                return { success: false, data: null, error: 'Task ID and new date are required' };
            }

            return await db.transaction(async (client) => {
                // Get original task
                const originalQuery = `
                    SELECT 
                        user_id, title, description, priority, 
                        repeat_interval, repeat_until
                    FROM tasks 
                    WHERE id = $1                 `;
                
                const originalResult = await client.query(originalQuery, [taskId]);
                
                if (originalResult.rows.length === 0) {
                    throw new Error('Original task not found');
                }

                const originalTask = originalResult.rows[0];

                // Create new instance
                const createQuery = `
                    INSERT INTO tasks (
                        user_id, title, description, due_date, priority,
                        repeat_interval, repeat_until, completed, true,
                        created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, false, NOW(), NOW()
                    )
                    RETURNING 
                        id, user_id, title, description, due_date, completed,
                        repeat_interval, repeat_until,
                        created_at, updated_at, completed_at
                `;

                const createResult = await client.query(createQuery, [
                    originalTask.user_id,
                    originalTask.title,
                    originalTask.description,
                    newDate,
                    originalTask.priority,
                    originalTask.repeat_interval,
                    originalTask.repeat_until
                ]);

                return { success: true, data: createResult.rows[0], error: null };
            });
        } catch (error) {
            console.error('Error in Task.createRepeatingInstance:', error);
            return { success: false, data: null, error: error.message || 'Database error occurred' };
        }
    }
}

module.exports = Task;