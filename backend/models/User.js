const db = require('../config/database');

class User {
    static async findById(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                SELECT 
                    id, telegram_id, first_name, last_name, username, language,
                    subscription_plan, subscription_expires_at, onboarding_completed,
                    created_at, updated_at
                FROM users 
                WHERE id = $1             `;
            
            const result = await db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'User not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in User.findById:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async findByTelegramId(telegramId) {
        try {
            if (!telegramId) {
                return { success: false, data: null, error: 'Telegram ID is required' };
            }

            const query = `
                SELECT 
                    id, telegram_id, first_name, last_name, username, language,
                    subscription_plan, subscription_expires_at, onboarding_completed,
                    created_at, updated_at
                FROM users 
                WHERE telegram_id = $1             `;
            
            const result = await db.query(query, [telegramId]);
            
            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'User not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in User.findByTelegramId:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async create(userData) {
        try {
            const { telegram_id, first_name, last_name, username, language } = userData;

            if (!telegram_id || !first_name) {
                return { success: false, data: null, error: 'Telegram ID and first name are required' };
            }

            const query = `
                INSERT INTO users (
                    telegram_id, first_name, last_name, username, language,
                    subscription_plan, subscription_expires_at, onboarding_completed,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, 'free', NULL, false, NOW(), NOW()
                )
                RETURNING 
                    id, telegram_id, first_name, last_name, username, language,
                    subscription_plan, subscription_expires_at, onboarding_completed,
                    created_at, updated_at
            `;

            const result = await db.query(query, [
                telegram_id, first_name, last_name || null, username || null, language || 'ru'
            ]);

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in User.create:', error);
            
            if (error.code === '23505') { // unique_violation
                return { success: false, data: null, error: 'User with this Telegram ID already exists' };
            }
            
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async update(id, userData) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const allowedFields = ['first_name', 'last_name', 'username', 'language'];
            const updates = [];
            const values = [];
            let paramCount = 1;

            Object.keys(userData).forEach(key => {
                if (allowedFields.includes(key) && userData[key] !== undefined) {
                    updates.push(`${key} = $${paramCount}`);
                    values.push(userData[key]);
                    paramCount++;
                }
            });

            if (updates.length === 0) {
                return { success: false, data: null, error: 'No valid fields to update' };
            }

            updates.push(`updated_at = NOW()`);
            values.push(id);

            const query = `
                UPDATE users 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}                 RETURNING 
                    id, telegram_id, first_name, last_name, username, language,
                    subscription_plan, subscription_expires_at, onboarding_completed,
                    created_at, updated_at
            `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'User not found or inactive' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in User.update:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async delete(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                DELETE FROM users 
                WHERE id = $1 
                RETURNING id
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'User not found' };
            }

            return { success: true, data: { id: result.rows[0].id }, error: null };
        } catch (error) {
            console.error('Error in User.delete:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async getSubscriptionInfo(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                SELECT 
                    id, subscription_plan, subscription_expires_at,
                    CASE 
                        WHEN subscription_plan = 'free' THEN true
                        WHEN subscription_expires_at IS NULL THEN false
                        WHEN subscription_expires_at > NOW() THEN true
                        ELSE false
                    END as onboarding_completed_subscription
                FROM users 
                WHERE id = $1             `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'User not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in User.getSubscriptionInfo:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async updateSubscription(id, plan, expiresAt) {
        try {
            if (!id || !plan) {
                return { success: false, data: null, error: 'User ID and subscription plan are required' };
            }

            const validPlans = ['free', 'plus', 'pro'];
            if (!validPlans.includes(plan)) {
                return { success: false, data: null, error: 'Invalid subscription plan' };
            }

            const query = `
                UPDATE users 
                SET 
                    subscription_plan = $1,
                    subscription_expires_at = $2,
                    updated_at = NOW()
                WHERE id = $3                 RETURNING 
                    id, subscription_plan, subscription_expires_at
            `;

            const result = await db.query(query, [plan, expiresAt || null, id]);

            if (result.rows.length === 0) {
                return { success: false, data: null, error: 'User not found' };
            }

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in User.updateSubscription:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async getTodayUsage(id) {
        try {
            if (!id) {
                return { success: false, data: null, error: 'User ID is required' };
            }

            const query = `
                SELECT 
                    user_id,
                    ai_messages_count,
                    files_uploaded_count,
                    usage_date
                FROM usage_stats 
                WHERE user_id = $1 AND usage_date = CURRENT_DATE
            `;

            const result = await db.query(query, [id]);

            const defaultUsage = {
                user_id: id,
                ai_messages_count: 0,
                files_uploaded_count: 0,
                usage_date: new Date().toISOString().split('T')[0]
            };

            const usage = result.rows.length > 0 ? result.rows[0] : defaultUsage;

            return { success: true, data: usage, error: null };
        } catch (error) {
            console.error('Error in User.getTodayUsage:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }

    static async incrementUsage(id, type) {
        try {
            if (!id || !type) {
                return { success: false, data: null, error: 'User ID and usage type are required' };
            }

            const validTypes = ['ai_messages', 'files_uploaded'];
            if (!validTypes.includes(type)) {
                return { success: false, data: null, error: 'Invalid usage type' };
            }

            const columnName = `${type}_count`;

            const query = `
                INSERT INTO usage_stats (user_id, ${columnName}, usage_date, created_at, updated_at)
                VALUES ($1, 1, CURRENT_DATE, NOW(), NOW())
                ON CONFLICT (user_id, usage_date)
                DO UPDATE SET 
                    ${columnName} = usage_stats.${columnName} + 1,
                    updated_at = NOW()
                RETURNING user_id, ${columnName}, usage_date
            `;

            const result = await db.query(query, [id]);

            return { success: true, data: result.rows[0], error: null };
        } catch (error) {
            console.error('Error in User.incrementUsage:', error);
            return { success: false, data: null, error: 'Database error occurred' };
        }
    }
}

module.exports = User;