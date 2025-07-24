/**
 * Authentication routes for Telegram Web Apps
 * Handles user login, token refresh, profile management
 */

const express = require('express');
const router = express.Router();
const telegramAuth = require('../services/telegram-auth');
const { 
    authenticateToken, 
    asyncHandler, 
    logRequest,
    validateRequest 
} = require('../middleware/auth');

// Apply logging to all auth routes
router.use(logRequest);

/**
 * POST /api/auth/telegram
 * Authenticate user with Telegram Web App initData
 */
router.post('/telegram', asyncHandler(async (req, res) => {
    const { initData } = req.body;

    if (!initData) {
        return res.status(400).json({
            error: 'Validation error',
            message: 'initData is required'
        });
    }

    try {
        // Validate Telegram initData
        const validationResult = telegramAuth.validateInitData(initData);
        
        if (!validationResult.isValid) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid Telegram data'
            });
        }

        // Create or update user in database
        const user = await telegramAuth.createOrUpdateUser(validationResult.user);
        
        // Generate JWT token
        const token = telegramAuth.generateToken(user);
        
        // Return user data and token
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                telegram_id: user.telegram_id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                language_code: user.language_code,
                is_premium: user.is_premium,
                subscription: user.subscription,
                created_at: user.created_at,
                last_active: user.last_active
            }
        });

    } catch (error) {
        console.error('Telegram authentication error:', error);
        
        return res.status(401).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
}));

/**
 * GET /api/auth/user
 * Get current authenticated user info
 */
router.get('/user', authenticateToken, asyncHandler(async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            telegram_id: req.user.telegram_id,
            username: req.user.username,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            language_code: req.user.language_code,
            is_premium: req.user.is_premium,
            subscription: req.user.subscription,
            created_at: req.user.created_at,
            last_active: req.user.last_active
        }
    });
}));

/**
 * PUT /api/auth/user
 * Update user profile
 */
router.put('/user', authenticateToken, asyncHandler(async (req, res) => {
    const allowedUpdates = ['first_name', 'last_name', 'username', 'language_code'];
    const updates = {};
    
    // Filter only allowed fields
    for (const [key, value] of Object.entries(req.body)) {
        if (allowedUpdates.includes(key)) {
            updates[key] = value;
        }
    }
    
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            error: 'Validation error',
            message: 'No valid fields to update',
            allowedFields: allowedUpdates
        });
    }

    try {
        const updatedUser = await telegramAuth.updateUserProfile(req.userId, updates);
        
        // Get updated user with subscription info
        const userWithSubscription = await telegramAuth.getUserById(req.userId);
        
        res.json({
            success: true,
            user: {
                id: userWithSubscription.id,
                telegram_id: userWithSubscription.telegram_id,
                username: userWithSubscription.username,
                first_name: userWithSubscription.first_name,
                last_name: userWithSubscription.last_name,
                language_code: userWithSubscription.language_code,
                is_premium: userWithSubscription.is_premium,
                subscription: userWithSubscription.subscription,
                created_at: userWithSubscription.created_at,
                updated_at: userWithSubscription.updated_at,
                last_active: userWithSubscription.last_active
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        
        return res.status(400).json({
            error: 'Update failed',
            message: error.message
        });
    }
}));

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Token required',
            message: 'No token provided for refresh'
        });
    }

    try {
        const newToken = await telegramAuth.refreshToken(token);
        
        // Get updated user data
        const decoded = telegramAuth.verifyToken(newToken);
        const user = await telegramAuth.getUserById(decoded.userId);
        
        res.json({
            success: true,
            token: newToken,
            user: {
                id: user.id,
                telegram_id: user.telegram_id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                language_code: user.language_code,
                is_premium: user.is_premium,
                subscription: user.subscription,
                created_at: user.created_at,
                last_active: user.last_active
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        
        return res.status(401).json({
            error: 'Refresh failed',
            message: error.message
        });
    }
}));

/**
 * POST /api/auth/logout
 * Logout user (client-side token invalidation)
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
    // In a JWT system, logout is primarily client-side
    // We just record the activity and return success
    
    await telegramAuth.recordActivity(req.userId, 'logout');
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
}));

/**
 * DELETE /api/auth/user
 * Delete user account and all associated data
 */
router.delete('/user', authenticateToken, asyncHandler(async (req, res) => {
    try {
        const deleted = await telegramAuth.deleteUser(req.userId);
        
        if (!deleted) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Account deletion error:', error);
        
        return res.status(500).json({
            error: 'Deletion failed',
            message: 'Failed to delete account'
        });
    }
}));

/**
 * GET /api/auth/subscription
 * Get user subscription details and usage statistics
 */
router.get('/subscription', authenticateToken, asyncHandler(async (req, res) => {
    const limits = telegramAuth.getUsageLimits(req.user.subscription.plan);
    
    res.json({
        success: true,
        subscription: {
            plan: req.user.subscription.plan,
            expires_at: req.user.subscription.expires_at,
            limits: limits,
            usage: {
                ai_messages_used: req.user.subscription.ai_messages_used,
                files_uploaded: req.user.subscription.files_uploaded
            }
        }
    });
}));

/**
 * POST /api/auth/validate
 * Validate current token (health check for authentication)
 */
router.post('/validate', authenticateToken, asyncHandler(async (req, res) => {
    res.json({
        success: true,
        valid: true,
        user_id: req.userId,
        expires_at: req.user.subscription.expires_at
    });
}));

/**
 * GET /api/auth/activity
 * Get user activity log (last 10 activities)
 */
router.get('/activity', authenticateToken, asyncHandler(async (req, res) => {
    try {
        const client = await telegramAuth.db.connect();
        
        try {
            const result = await client.query(`
                SELECT action_type, created_at 
                FROM usage_stats 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 10
            `, [req.userId]);
            
            res.json({
                success: true,
                activities: result.rows
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Activity fetch error:', error);
        
        return res.status(500).json({
            error: 'Failed to fetch activity',
            message: error.message
        });
    }
}));

module.exports = router;