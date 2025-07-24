const db = require('../config/database');

class Chat {
    static async findByUserId(userId, limit = 50, offset = 0) {
        try {
            if (!userId) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                SELECT 
                    id, user_id, title, created_at,
                    (
                        SELECT COUNT(*) 
                        FROM ai_messages 
                        WHERE chat_id = ai_chats.id                     ) as message_count,
                    (
                        SELECT content 
                        FROM ai_messages 
                        WHERE chat_id = ai_chats.id AND true = true 
                        ORDER BY created_at DESC 
                        LIMIT 1
                    ) as last_message
                FROM ai_chats 
                WHERE user_id = $1                 ORDER BY updated_at DESC
                LIMIT $2 OFFSET $3
            `;
            
            const result = await db.query(query, [userId, limit, offset]);

            return { success: true, data: result.rows, error: null };
        } catch (error) {
            console.error('Error in Chat.findByUserId:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async findById(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Chat ID is required' };
            }

            const query = `
                SELECT 
                    id, user_id, title, created_at
                FROM ai_chats 
                WHERE id = $1             `;
            
            const result = await db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Chat not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Chat.findById:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async create(userId, title) {
        try {
            if (!userId) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            if (!title || title.trim().length === 0) {
                return { success: false, data: null, error: 'Chat title is required' };
            }

            if (title.length > 200) {
                return { success: false, data: null, error: 'Chat title is too long (max 200 characters)' };
            }

            const query = `
                INSERT INTO ai_chats (
                    user_id, title, created_at
                ) VALUES (
                    $1, $2, NOW()
                )
                RETURNING 
                    id, user_id, title, created_at
            `;

            const result = await db.query(query, [userId, title.trim()]);

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Chat.create:', error);
            
            if (error.code === '23503') { // foreign_key_violation
                return { success: false, data: null, error: 'User not found' };
            }
            
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async update(id, title) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Chat ID is required' };
            }

            if (!title || title.trim().length === 0) {
                return { success: false, data: null, error: 'Chat title is required' };
            }

            if (title.length > 200) {
                return { success: false, data: null, error: 'Chat title is too long (max 200 characters)' };
            }

            const query = `
                UPDATE ai_chats 
                SET title = $1
                WHERE id = $2                 RETURNING 
                    id, user_id, title, created_at
            `;

            const result = await db.query(query, [title.trim(), id]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Chat not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in Chat.update:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async delete(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'Chat ID is required' };
            }

            return await db.transaction(async (client) => {
                // Delete all messages in the chat
                await client.query(
                    'DELETE FROM ai_messages WHERE chat_id = $1',
                    [id]
                );

                // Delete the chat
                const result = await client.query(
                    'DELETE FROM ai_chats WHERE id = $1 RETURNING id',
                    [id]
                );

                if (result.rows.length === 0) {
                    throw new Error('Chat not found');
                }

                return { success: true, data: { id: result.rows[0].id }, error: null };
            });
        } catch (error) {
            console.error('Error in Chat.delete:', error);
            return { success: false, data: null, error: error.message || 'Database error occurred' };
        }
    }

    static async addMessage(chatId, role, content) {
        try {
            if (!chatId || !role || !content) {
                return { success: false, data: null, error: 'Chat ID, role, and content are required' };
            }

            const validRoles = ['user', 'assistant'];
            if (!validRoles.includes(role)) {
                return { success: false, data: null, error: 'Invalid role. Must be "user" or "assistant"' };
            }

            if (content.length > 10000) {
                return { success: false, data: null, error: 'Message content is too long (max 10000 characters)' };
            }

            return await db.transaction(async (client) => {
                // Verify chat exists
                const chatCheck = await client.query(
                    'SELECT id FROM ai_chats WHERE id = $1',
                    [chatId]
                );

                if (chatCheck.rows.length === 0) {
                    throw new Error('Chat not found');
                }

                // Add message
                const messageQuery = `
                    INSERT INTO ai_messages (
                        chat_id, role, content, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, NOW(), NOW()
                    )
                    RETURNING 
                        id, chat_id, role, content, created_at, updated_at
                `;

                const messageResult = await client.query(messageQuery, [chatId, role, content.trim()]);

                // No need to update chat timestamp since ai_chats doesn't have updated_at

                return { success: true, data: messageResult.rows[0], error: null };
            });
        } catch (error) {
            console.error('Error in Chat.addMessage:', error);
            return { success: false, data: null, error: error.message || 'Database error occurred' };
        }
    }

    static async getMessages(chatId, limit = 50, offset = 0) {
        try {
            if (!chatId) {
                return { success: false, data: null, error: 'Chat ID is required' };
            }

            // First verify chat exists
            const chatCheck = await db.query(
                'SELECT id FROM ai_chats WHERE id = $1',
                [chatId]
            );

            if (chatCheck.rows.length === 0) {
                return { success: false, data: null, error: 'Chat not found' };
            }

            const query = `
                SELECT 
                    id, chat_id, role, content, created_at, updated_at
                FROM ai_messages 
                WHERE chat_id = $1                 ORDER BY created_at ASC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(query, [chatId, limit, offset]);

            return { success: true, data: result.rows, error: null };
        } catch (error) {
            console.error('Error in Chat.getMessages:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async getMessageCount(chatId) {
        try {
            if (!chatId) {
                return { success: false, data: null, error: 'Chat ID is required' };
            }

            const query = `
                SELECT COUNT(*) as count
                FROM ai_messages 
                WHERE chat_id = $1             `;

            const result = await db.query(query, [chatId]);

            return { 
                success: true, 
                data: { count: parseInt(result.rows[0].count) }, 
                error: null 
            };
        } catch (error) {
            console.error('Error in Chat.getMessageCount:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async getUserChatStats(userId) {
        try {
            if (!userId) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                SELECT 
                    COUNT(DISTINCT ac.id) as total_chats,
                    COUNT(am.id) as total_messages,
                    MAX(ac.created_at) as last_activity
                FROM ai_chats ac
                LEFT JOIN ai_messages am ON ac.id = am.chat_id
                WHERE ac.user_id = $1
            `;

            const result = await db.query(query, [userId]);

            const stats = {
                total_chats: parseInt(result.rows[0].total_chats),
                total_messages: parseInt(result.rows[0].total_messages || 0),
                last_activity: result.rows[0].last_activity
            };

            return { success: true, data: stats, error: null };
        } catch (error) {
            console.error('Error in Chat.getUserChatStats:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async deleteMessage(messageId) {
        try {
            if (!messageId) {
                return { success: false, data: null, error: 'Message ID is required' };
            }

            const query = `
                DELETE FROM ai_messages 
                WHERE id = $1                 RETURNING id, chat_id
            `;

            const result = await db.query(query, [messageId]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'Message not found or already deleted' };
            }

            return { 
                success: true, 
                data: { 
                    id: result.rows[0].id,
                    chat_id: result.rows[0].chat_id
                }, 
                error: null 
            };
        } catch (error) {
            console.error('Error in Chat.deleteMessage:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async clearChatMessages(chatId) {
        try {
            if (!chatId) {
                return { success: false, data: null, error: 'Chat ID is required' };
            }

            const query = `
                DELETE FROM ai_messages 
                WHERE chat_id = $1             `;

            const result = await db.query(query, [chatId]);

            return { 
                success: true, 
                data: { deleted_count: result.rowCount }, 
                error: null 
            };
        } catch (error) {
            console.error('Error in Chat.clearChatMessages:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }
}

module.exports = Chat;