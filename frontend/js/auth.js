/**
 * Authentication handling for Telegram Web App
 * Manages user authentication, token storage and API communication
 */

class AuthManager {
    constructor() {
        this.apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
        this.token = null;
        this.user = null;
        this.refreshPromise = null;
        
        // Initialize authentication
        this.init();
    }

    /**
     * Initialize authentication system
     */
    async init() {
        // Load token from localStorage
        this.token = localStorage.getItem('authToken');
        
        // Listen for Telegram ready event
        window.addEventListener('telegramReady', (event) => {
            this.handleTelegramReady(event.detail);
        });

        // If we already have a token, validate it
        if (this.token) {
            try {
                await this.validateToken();
            } catch (error) {
                console.warn('Stored token is invalid, clearing');
                this.clearAuth();
            }
        }
    }

    /**
     * Handle Telegram Web App ready event
     */
    async handleTelegramReady(data) {
        const { initData } = data;
        
        if (!initData) {
            console.warn('No init data available from Telegram');
            return;
        }

        try {
            await this.authenticateWithTelegram(initData);
        } catch (error) {
            console.error('Failed to authenticate with Telegram:', error);
            this.handleAuthError(error);
        }
    }

    /**
     * Authenticate user with Telegram init data
     */
    async authenticateWithTelegram(initData) {
        const response = await fetch(`${this.apiUrl}/api/auth/telegram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Authentication failed');
        }

        const data = await response.json();
        
        // Store token and user data
        this.token = data.token;
        this.user = data.user;
        
        localStorage.setItem('authToken', this.token);
        
        // Dispatch authentication success event
        window.dispatchEvent(new CustomEvent('authSuccess', {
            detail: { user: this.user, token: this.token }
        }));

        console.log('Authentication successful');
        return data;
    }

    /**
     * Validate current token with backend
     */
    async validateToken() {
        if (!this.token) {
            throw new Error('No token available');
        }

        const response = await fetch(`${this.apiUrl}/api/auth/user`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token validation failed');
        }

        const userData = await response.json();
        this.user = userData;
        
        return userData;
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        // Prevent multiple simultaneous refresh requests
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this._performTokenRefresh();
        
        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.refreshPromise = null;
        }
    }

    /**
     * Perform actual token refresh
     */
    async _performTokenRefresh() {
        if (!this.token) {
            throw new Error('No token to refresh');
        }

        const response = await fetch(`${this.apiUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        
        this.token = data.token;
        this.user = data.user;
        
        localStorage.setItem('authToken', this.token);
        
        return data;
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        const response = await this.makeAuthenticatedRequest('/api/auth/user', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Profile update failed');
        }

        const updatedUser = await response.json();
        this.user = updatedUser;
        
        // Dispatch profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: { user: this.user }
        }));

        return updatedUser;
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Try to notify backend about logout
            if (this.token) {
                await fetch(`${this.apiUrl}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to notify backend about logout:', error);
        }

        // Clear local authentication data
        this.clearAuth();
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('authLogout'));
        
        console.log('User logged out');
    }

    /**
     * Delete user account
     */
    async deleteAccount() {
        if (!confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
            return false;
        }

        const response = await this.makeAuthenticatedRequest('/api/auth/user', {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Account deletion failed');
        }

        // Clear local data and logout
        this.clearAuth();
        
        // Dispatch account deletion event
        window.dispatchEvent(new CustomEvent('accountDeleted'));
        
        return true;
    }

    /**
     * Make authenticated API request with automatic token refresh
     */
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.token) {
            throw new Error('No authentication token available');
        }

        // Prepare request options
        const requestOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                ...options.headers
            }
        };

        // Make initial request
        let response = await fetch(`${this.apiUrl}${url}`, requestOptions);

        // If token expired, try to refresh and retry once
        if (response.status === 401) {
            try {
                await this.refreshToken();
                
                // Update authorization header with new token
                requestOptions.headers.Authorization = `Bearer ${this.token}`;
                
                // Retry request with new token
                response = await fetch(`${this.apiUrl}${url}`, requestOptions);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                this.clearAuth();
                throw new Error('Authentication failed');
            }
        }

        return response;
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error) {
        console.error('Authentication error:', error);
        
        // Show user-friendly error message
        if (window.telegramSDK && window.telegramSDK.isInTelegram()) {
            window.telegramSDK.showPopup(
                'Ошибка авторизации',
                'Не удалось выполнить авторизацию. Попробуйте перезапустить приложение.'
            );
        } else {
            alert('Ошибка авторизации: ' + error.message);
        }

        // Dispatch error event
        window.dispatchEvent(new CustomEvent('authError', {
            detail: { error: error.message }
        }));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Get current token
     */
    getToken() {
        return this.token;
    }

    /**
     * Get user subscription info
     */
    getSubscription() {
        return this.user?.subscription || { plan: 'free' };
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        const subscription = this.getSubscription();
        
        switch (permission) {
            case 'ai_chat':
                return subscription.plan !== 'free' || (subscription.ai_messages_used || 0) < 3;
            case 'file_upload':
                return true; // All users can upload files
            case 'unlimited_files':
                return subscription.plan === 'pro';
            default:
                return false;
        }
    }

    /**
     * Get usage limits for current user
     */
    getUsageLimits() {
        const subscription = this.getSubscription();
        
        const limits = {
            free: {
                ai_messages_per_day: 3,
                files_per_task: 3,
                max_file_size: 10 * 1024 * 1024 // 10MB
            },
            plus: {
                ai_messages_per_day: 30,
                files_per_task: 10,
                max_file_size: 20 * 1024 * 1024 // 20MB
            },
            pro: {
                ai_messages_per_day: -1, // unlimited
                files_per_task: -1, // unlimited
                max_file_size: 50 * 1024 * 1024 // 50MB
            }
        };

        return limits[subscription.plan] || limits.free;
    }
}

// Create global instance
window.authManager = new AuthManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}