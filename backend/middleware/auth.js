/**
 * Authentication middleware for API routes
 * Handles JWT token verification and user authorization
 */

const telegramAuth = require('../services/telegram-auth');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Access denied', 
                message: 'No token provided' 
            });
        }

        // Verify token
        const decoded = telegramAuth.verifyToken(token);
        
        // Get updated user data from database
        const user = await telegramAuth.getUserById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Access denied', 
                message: 'User not found' 
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;
        req.telegramId = user.telegram_id;
        
        // Record user activity
        await telegramAuth.recordActivity(user.id, 'api_request');
        
        next();
        
    } catch (error) {
        console.error('Authentication error:', error);
        
        // Handle specific JWT errors
        if (error.message.includes('expired')) {
            return res.status(401).json({ 
                error: 'Token expired', 
                message: 'Please refresh your token',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.message.includes('invalid')) {
            return res.status(401).json({ 
                error: 'Invalid token', 
                message: 'Token is malformed or invalid',
                code: 'TOKEN_INVALID'
            });
        }
        
        return res.status(401).json({ 
            error: 'Authentication failed', 
            message: error.message 
        });
    }
};

/**
 * Middleware to check subscription plan requirements
 */
const requireSubscription = (requiredPlan) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'User must be authenticated'
            });
        }

        const userPlan = req.user.subscription.plan;
        const planHierarchy = { free: 0, plus: 1, pro: 2 };
        
        const userLevel = planHierarchy[userPlan] || 0;
        const requiredLevel = planHierarchy[requiredPlan] || 0;
        
        if (userLevel < requiredLevel) {
            return res.status(403).json({
                error: 'Subscription required',
                message: `This feature requires ${requiredPlan} subscription`,
                currentPlan: userPlan,
                requiredPlan: requiredPlan
            });
        }
        
        next();
    };
};

/**
 * Middleware to check rate limits for specific actions
 */
const checkRateLimit = (action) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'User must be authenticated'
            });
        }

        try {
            const rateLimitCheck = await telegramAuth.checkRateLimit(req.userId, action);
            
            if (!rateLimitCheck.allowed) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: `Daily limit for ${action} exceeded`,
                    limit: rateLimitCheck.limit,
                    used: rateLimitCheck.used,
                    resetTime: new Date().setHours(24, 0, 0, 0) // Next midnight
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Rate limit check error:', error);
            return res.status(500).json({
                error: 'Rate limit check failed',
                message: error.message
            });
        }
    };
};

/**
 * Middleware to validate request data
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                message: error.details[0].message,
                details: error.details
            });
        }
        
        next();
    };
};

/**
 * Middleware to handle file upload size limits based on subscription
 */
const checkFileUploadLimits = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'User must be authenticated'
        });
    }

    const limits = telegramAuth.getUsageLimits(req.user.subscription.plan);
    
    // Check file size (this assumes multer or similar middleware sets req.file or req.files)
    if (req.file && req.file.size > limits.max_file_size) {
        return res.status(413).json({
            error: 'File too large',
            message: `File size exceeds limit for ${req.user.subscription.plan} plan`,
            maxSize: limits.max_file_size,
            currentSize: req.file.size
        });
    }
    
    if (req.files) {
        for (const file of req.files) {
            if (file.size > limits.max_file_size) {
                return res.status(413).json({
                    error: 'File too large',
                    message: `File "${file.originalname}" exceeds size limit`,
                    maxSize: limits.max_file_size,
                    currentSize: file.size
                });
            }
        }
    }
    
    next();
};

/**
 * Middleware to log API requests for debugging
 */
const logRequest = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${req.userId || 'Anonymous'}`);
    
    // Override res.json to log response time
    const originalJson = res.json;
    res.json = function(body) {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
        return originalJson.call(this, body);
    };
    
    next();
};

/**
 * Middleware to handle errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);
    
    // Default error response
    let status = 500;
    let message = 'Internal server error';
    let details = null;
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation error';
        details = err.details;
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Unauthorized';
    } else if (err.message.includes('not found')) {
        status = 404;
        message = 'Resource not found';
    } else if (err.message.includes('duplicate')) {
        status = 409;
        message = 'Resource already exists';
    }
    
    // Don't leak error details in production
    const response = {
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    };
    
    if (details) {
        response.details = details;
    }
    
    res.status(status).json(response);
};

/**
 * Middleware to set security headers
 */
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Only set CSP for non-API routes
    if (!req.path.startsWith('/api/')) {
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline';");
    }
    
    next();
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = telegramAuth.verifyToken(token);
            const user = await telegramAuth.getUserById(decoded.userId);
            
            if (user) {
                req.user = user;
                req.userId = user.id;
                req.telegramId = user.telegram_id;
                await telegramAuth.recordActivity(user.id, 'api_request');
            }
        }
        
        next();
        
    } catch (error) {
        // Don't fail on optional auth errors, just continue without user
        console.warn('Optional auth failed:', error.message);
        next();
    }
};

module.exports = {
    authenticateToken,
    requireSubscription,
    checkRateLimit,
    validateRequest,
    checkFileUploadLimits,
    logRequest,
    asyncHandler,
    errorHandler,
    securityHeaders,
    optionalAuth
};