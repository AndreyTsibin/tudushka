/**
 * Telegram Web Apps authentication service
 * Handles validation of Telegram initData and user management
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

class TelegramAuthService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.jwtSecret = process.env.JWT_SECRET;
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        if (!this.botToken) {
            console.warn('TELEGRAM_BOT_TOKEN not set - Telegram auth will not work');
        }

        if (!this.jwtSecret) {
            console.warn('JWT_SECRET not set - using default (INSECURE)');
            this.jwtSecret = 'default-jwt-secret-change-in-production';
        }
    }

    /**
     * Validate Telegram Web App initData using HMAC-SHA256
     */
    validateInitData(initData) {
        if (!this.botToken || !initData) {
            throw new Error('Missing bot token or init data');
        }

        try {
            // Parse init data
            const urlParams = new URLSearchParams(initData);
            const hash = urlParams.get('hash');
            urlParams.delete('hash');

            // Create data-check-string from sorted parameters
            const dataCheckString = Array.from(urlParams.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');

            // Create secret key from bot token
            const secretKey = crypto
                .createHmac('sha256', 'WebAppData')
                .update(this.botToken)
                .digest();

            // Calculate expected hash
            const expectedHash = crypto
                .createHmac('sha256', secretKey)
                .update(dataCheckString)
                .digest('hex');

            // Verify hash
            if (hash !== expectedHash) {
                throw new Error('Invalid hash - data integrity check failed');
            }

            // Check auth_date (should be within 24 hours)
            const authDate = parseInt(urlParams.get('auth_date'));
            const currentTime = Math.floor(Date.now() / 1000);
            const timeDiff = currentTime - authDate;

            if (timeDiff > 86400) { // 24 hours
                throw new Error('Init data is too old');
            }

            // Parse user data
            const userDataString = urlParams.get('user');
            if (!userDataString) {
                throw new Error('No user data in init data');
            }

            const userData = JSON.parse(userDataString);
            
            return {
                isValid: true,
                user: userData,
                authDate: authDate,
                startParam: urlParams.get('start_param'),
                chatType: urlParams.get('chat_type'),
                chatInstance: urlParams.get('chat_instance')
            };

        } catch (error) {
            console.error('Init data validation failed:', error);
            throw new Error(`Validation failed: ${error.message}`);
        }
    }

    /**
     * Create or update user in database
     */
    async createOrUpdateUser(telegramUser) {
        const client = await this.db.connect();
        
        try {
            // Check if user exists
            const existingUser = await client.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [telegramUser.id]
            );

            let user;
            const now = new Date();

            if (existingUser.rows.length > 0) {
                // Update existing user
                const updateQuery = `
                    UPDATE users 
                    SET 
                        username = $2,
                        first_name = $3,
                        last_name = $4,
                        language_code = $5,
                        is_premium = $6,
                        last_active = $7,
                        updated_at = $7
                    WHERE telegram_id = $1
                    RETURNING *
                `;
                
                const result = await client.query(updateQuery, [
                    telegramUser.id,
                    telegramUser.username || null,
                    telegramUser.first_name || null,
                    telegramUser.last_name || null,
                    telegramUser.language_code || 'en',
                    telegramUser.is_premium || false,
                    now
                ]);
                
                user = result.rows[0];
            } else {
                // Create new user
                const insertQuery = `
                    INSERT INTO users (
                        telegram_id, 
                        username, 
                        first_name, 
                        last_name, 
                        language_code, 
                        is_premium,
                        created_at,
                        updated_at,
                        last_active
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $7)
                    RETURNING *
                `;
                
                const result = await client.query(insertQuery, [
                    telegramUser.id,
                    telegramUser.username || null,
                    telegramUser.first_name || null,
                    telegramUser.last_name || null,
                    telegramUser.language_code || 'en',
                    telegramUser.is_premium || false,
                    now
                ]);
                
                user = result.rows[0];
            }

            // Get user subscription info
            const subscriptionQuery = `
                SELECT 
                    subscription_plan,
                    subscription_expires_at,
                    ai_messages_used_today,
                    files_uploaded_today,
                    last_usage_reset
                FROM users 
                WHERE id = $1
            `;
            
            const subscriptionResult = await client.query(subscriptionQuery, [user.id]);
            const subscription = subscriptionResult.rows[0];

            // Reset daily usage if needed
            const today = new Date().toDateString();
            const lastReset = subscription.last_usage_reset ? 
                new Date(subscription.last_usage_reset).toDateString() : null;

            if (lastReset !== today) {
                await client.query(`
                    UPDATE users 
                    SET 
                        ai_messages_used_today = 0,
                        files_uploaded_today = 0,
                        last_usage_reset = $1
                    WHERE id = $2
                `, [now, user.id]);
                
                subscription.ai_messages_used_today = 0;
                subscription.files_uploaded_today = 0;
            }

            // Add subscription info to user object
            user.subscription = {
                plan: subscription.subscription_plan || 'free',
                expires_at: subscription.subscription_expires_at,
                ai_messages_used: subscription.ai_messages_used_today || 0,
                files_uploaded: subscription.files_uploaded_today || 0
            };

            return user;

        } finally {
            client.release();
        }
    }

    /**
     * Generate JWT token for user
     */
    generateToken(user, expiresIn = '24h') {
        const payload = {
            userId: user.id,
            telegramId: user.telegram_id,
            username: user.username,
            subscription: user.subscription
        };

        return jwt.sign(payload, this.jwtSecret, { expiresIn });
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    /**
     * Refresh JWT token
     */
    async refreshToken(oldToken) {
        try {
            // Verify old token (even if expired)
            const decoded = jwt.verify(oldToken, this.jwtSecret, { ignoreExpiration: true });
            
            // Get updated user data from database
            const client = await this.db.connect();
            
            try {
                const userQuery = `
                    SELECT 
                        *,
                        subscription_plan,
                        subscription_expires_at,
                        ai_messages_used_today,
                        files_uploaded_today
                    FROM users 
                    WHERE id = $1
                `;
                
                const result = await client.query(userQuery, [decoded.userId]);
                
                if (result.rows.length === 0) {
                    throw new Error('User not found');
                }

                const user = result.rows[0];
                
                // Add subscription info
                user.subscription = {
                    plan: user.subscription_plan || 'free',
                    expires_at: user.subscription_expires_at,
                    ai_messages_used: user.ai_messages_used_today || 0,
                    files_uploaded: user.files_uploaded_today || 0
                };

                // Generate new token
                return this.generateToken(user);

            } finally {
                client.release();
            }

        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }

    /**
     * Get user by ID with subscription info
     */
    async getUserById(userId) {
        const client = await this.db.connect();
        
        try {
            const query = `
                SELECT 
                    *,
                    subscription_plan,
                    subscription_expires_at,
                    ai_messages_used_today,
                    files_uploaded_today
                FROM users 
                WHERE id = $1
            `;
            
            const result = await client.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return null;
            }

            const user = result.rows[0];
            
            // Add subscription info
            user.subscription = {
                plan: user.subscription_plan || 'free',
                expires_at: user.subscription_expires_at,
                ai_messages_used: user.ai_messages_used_today || 0,
                files_uploaded: user.files_uploaded_today || 0
            };

            return user;

        } finally {
            client.release();
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        const client = await this.db.connect();
        
        try {
            const allowedFields = ['first_name', 'last_name', 'username', 'language_code'];
            const setClause = [];
            const values = [];
            let paramIndex = 1;

            // Build dynamic update query
            for (const [field, value] of Object.entries(updates)) {
                if (allowedFields.includes(field)) {
                    setClause.push(`${field} = $${paramIndex}`);
                    values.push(value);
                    paramIndex++;
                }
            }

            if (setClause.length === 0) {
                throw new Error('No valid fields to update');
            }

            setClause.push(`updated_at = $${paramIndex}`);
            values.push(new Date());
            values.push(userId);

            const query = `
                UPDATE users 
                SET ${setClause.join(', ')}
                WHERE id = $${paramIndex + 1}
                RETURNING *
            `;

            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            return result.rows[0];

        } finally {
            client.release();
        }
    }

    /**
     * Delete user account
     */
    async deleteUser(userId) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');
            
            // Delete related data first (due to foreign key constraints)
            await client.query('DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE user_id = $1)', [userId]);
            await client.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM ai_messages WHERE chat_id IN (SELECT id FROM ai_chats WHERE user_id = $1)', [userId]);
            await client.query('DELETE FROM ai_chats WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM usage_stats WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
            
            // Finally delete user
            const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
            
            await client.query('COMMIT');
            
            return result.rows.length > 0;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Record user activity
     */
    async recordActivity(userId, activityType = 'general') {
        const client = await this.db.connect();
        
        try {
            await client.query(
                'UPDATE users SET last_active = $1 WHERE id = $2',
                [new Date(), userId]
            );

            // Optional: Record detailed activity in usage_stats
            await client.query(`
                INSERT INTO usage_stats (user_id, action_type, created_at)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING
            `, [userId, activityType, new Date()]);

        } finally {
            client.release();
        }
    }

    /**
     * Check rate limits for user
     */
    async checkRateLimit(userId, action) {
        const client = await this.db.connect();
        
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const limits = this.getUsageLimits(user.subscription.plan);
            
            switch (action) {
                case 'ai_message':
                    if (limits.ai_messages_per_day !== -1 && 
                        user.subscription.ai_messages_used >= limits.ai_messages_per_day) {
                        return { allowed: false, limit: limits.ai_messages_per_day, used: user.subscription.ai_messages_used };
                    }
                    break;
                    
                case 'file_upload':
                    if (limits.files_per_day !== -1 && 
                        user.subscription.files_uploaded >= limits.files_per_day) {
                        return { allowed: false, limit: limits.files_per_day, used: user.subscription.files_uploaded };
                    }
                    break;
            }

            return { allowed: true };

        } finally {
            client.release();
        }
    }

    /**
     * Get usage limits for subscription plan
     */
    getUsageLimits(plan) {
        const limits = {
            free: {
                ai_messages_per_day: 3,
                files_per_task: 3,
                files_per_day: 10,
                max_file_size: 10 * 1024 * 1024 // 10MB
            },
            plus: {
                ai_messages_per_day: 30,
                files_per_task: 10,
                files_per_day: 50,
                max_file_size: 20 * 1024 * 1024 // 20MB
            },
            pro: {
                ai_messages_per_day: -1, // unlimited
                files_per_task: -1, // unlimited
                files_per_day: -1, // unlimited
                max_file_size: 50 * 1024 * 1024 // 50MB
            }
        };

        return limits[plan] || limits.free;
    }
}

module.exports = new TelegramAuthService();