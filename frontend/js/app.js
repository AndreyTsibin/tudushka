/**
 * Main application logic for Tudushka
 * Handles initialization, authentication, and page coordination
 */

class TudushkaApp {
    constructor() {
        this.isInitialized = false;
        this.user = null;
        this.loadingScreen = null;
        this.currentPage = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleTelegramReady = this.handleTelegramReady.bind(this);
        this.handleAuthSuccess = this.handleAuthSuccess.bind(this);
        this.handleAuthError = this.handleAuthError.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Tudushka app...');
        
        try {
            // Get DOM elements
            this.loadingScreen = document.getElementById('loading-screen');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup header interactions
            this.setupHeaderHandlers();
            
            // Initialize Telegram Web App if available
            if (window.Telegram?.WebApp) {
                this.initializeTelegramWebApp();
                // Try to authenticate with Telegram
                this.authenticateWithTelegram();
            } else {
                console.warn('Telegram Web App not available - running in demo mode');
                // Hide loading screen and continue without authentication
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.handleDemoMode();
                }, 1000); // Small delay to show loading screen briefly
            }
            
            this.isInitialized = true;
            console.log('Tudushka app initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Ошибка инициализации приложения');
        }
    }

    /**
     * Initialize Telegram Web App
     */
    initializeTelegramWebApp() {
        const tg = window.Telegram.WebApp;
        
        // Configure Telegram Web App
        tg.ready();
        tg.expand();
        
        // Set theme colors
        if (tg.themeParams.bg_color) {
            document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
        }
        if (tg.themeParams.text_color) {
            document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color);
        }
        
        // Handle viewport height for mobile
        this.handleViewportHeight();
        
        console.log('Telegram Web App initialized');
    }

    /**
     * Authenticate with Telegram Web App
     */
    async authenticateWithTelegram() {
        try {
            if (window.authManager) {
                // Try to authenticate using Telegram Web App data
                await window.authManager.authenticateWithTelegram();
            } else {
                console.warn('Auth manager not available');
                // Fallback: hide loading screen after timeout
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.handleDemoMode();
                }, 2000);
            }
        } catch (error) {
            console.error('Telegram authentication failed:', error);
            // Hide loading screen and continue in demo mode
            setTimeout(() => {
                this.hideLoadingScreen();
                this.handleDemoMode();
            }, 1000);
        }
    }

    /**
     * Handle demo mode when Telegram Web App is not available
     */
    handleDemoMode() {
        console.log('Running in demo mode');
        
        // Set demo user for testing
        this.user = {
            id: 'demo',
            first_name: 'Demo',
            last_name: 'User',
            username: 'demo_user'
        };
        
        // Update UI
        this.updateUserInterface();
        
        // Navigate to home page
        const currentRoute = router.getCurrentRoute();
        if (!currentRoute || currentRoute === '/404') {
            router.navigate('/', true);
        }
    }

    /**
     * Handle viewport height for mobile devices
     */
    handleViewportHeight() {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
    }

    /**
     * Setup application event listeners
     */
    setupEventListeners() {
        // Telegram SDK events
        window.addEventListener('telegramReady', this.handleTelegramReady);
        window.addEventListener('authSuccess', this.handleAuthSuccess);
        window.addEventListener('authError', this.handleAuthError);
        
        // Application events
        document.addEventListener('DOMContentLoaded', () => {
            if (!this.isInitialized) {
                this.init();
            }
        });
        
        // Handle app visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.user) {
                // App became visible, refresh data if needed
                this.refreshUserData();
            }
        });
    }

    /**
     * Setup application routes
     */
    setupRoutes() {
        // Home page
        router.addRoute('/', () => {
            this.renderHomePage();
        });
        
        // AI Assistant page
        router.addRoute('/ai', () => {
            this.renderAIPage();
        });
        
        // Archive page
        router.addRoute('/archive', () => {
            this.renderArchivePage();
        });
        
        // Settings page
        router.addRoute('/settings', () => {
            this.renderSettingsPage();
        });
        
        // Day view with date parameter
        router.addRoute('/day/:date', (params) => {
            this.renderDayPage(params.date);
        });
    }

    /**
     * Setup header button handlers
     */
    setupHeaderHandlers() {
        // Date button - show calendar or date picker
        const dateButton = document.getElementById('dateButton');
        if (dateButton) {
            dateButton.addEventListener('click', () => {
                this.showDatePicker();
            });
        }
        
        // Profile button - show user menu
        const profileButton = document.getElementById('profileButton');
        if (profileButton) {
            profileButton.addEventListener('click', () => {
                this.showProfileMenu();
            });
        }
    }

    /**
     * Handle Telegram ready event
     */
    handleTelegramReady(event) {
        console.log('Telegram ready:', event.detail);
        // Telegram is ready, authentication should follow
    }

    /**
     * Handle authentication success
     */
    handleAuthSuccess(event) {
        console.log('Authentication successful:', event.detail);
        this.user = event.detail.user;
        this.hideLoadingScreen();
        
        // Update UI with user info
        this.updateUserInterface();
        
        // Navigate to appropriate page
        const currentRoute = router.getCurrentRoute();
        if (!currentRoute || currentRoute === '/404') {
            router.navigate('/', true);
        }
    }

    /**
     * Handle authentication error
     */
    handleAuthError(event) {
        console.error('Authentication failed:', event.detail);
        this.hideLoadingScreen();
        this.showError(`Ошибка авторизации: ${event.detail.error}`);
    }

    /**
     * Update user interface after authentication
     */
    updateUserInterface() {
        if (!this.user) return;
        
        // Update header profile button with user avatar or initials
        const profileButton = document.getElementById('profileButton');
        if (profileButton && this.user.first_name) {
            const initials = (this.user.first_name.charAt(0) + (this.user.last_name?.charAt(0) || '')).toUpperCase();
            profileButton.setAttribute('title', `${this.user.first_name} ${this.user.last_name || ''}`.trim());
        }
    }

    /**
     * Render home page
     */
    renderHomePage() {
        // Don't replace content, just show existing home page
        const homePage = document.getElementById('homePage');
        if (!homePage) return;
        
        mainContent.innerHTML = `
            <div class="page page--home">
                <div class="tasks-container">
                    <div class="page-loading-placeholder">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>Загрузка задач...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Load tasks module
        this.loadTasksModule();
        router.hidePageLoading();
    }

    /**
     * Render AI assistant page
     */
    renderAIPage() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page page--ai">
                <div class="ai-chat-container">
                    <div class="page-loading-placeholder">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>Загрузка AI помощника...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Load AI chat module
        this.loadAIChatModule();
        router.hidePageLoading();
    }

    /**
     * Render archive page
     */
    renderArchivePage() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page page--archive">
                <div class="archive-container">
                    <div class="page-loading-placeholder">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>Загрузка архива...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Load archive functionality
        this.loadArchiveModule();
        router.hidePageLoading();
    }

    /**
     * Render settings page
     */
    renderSettingsPage() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page page--settings">
                <div class="settings-container">
                    <div class="page-loading-placeholder">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>Загрузка настроек...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Load settings module
        this.loadSettingsModule();
        router.hidePageLoading();
    }

    /**
     * Render day page for specific date
     */
    renderDayPage(date) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page page--day" data-date="${date}">
                <div class="day-tasks-container">
                    <div class="page-loading-placeholder">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>Загрузка задач на ${date}...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Load tasks for specific date
        this.loadTasksForDate(date);
        router.hidePageLoading();
    }

    /**
     * Load tasks module
     */
    async loadTasksModule() {
        try {
            // Tasks module should be loaded in modules/tasks.js
            if (window.TasksModule) {
                const tasksModule = new window.TasksModule();
                await tasksModule.init();
            } else {
                console.warn('Tasks module not loaded');
                this.showModulePlaceholder('tasks');
            }
        } catch (error) {
            console.error('Failed to load tasks module:', error);
            this.showModulePlaceholder('tasks');
        }
    }

    /**
     * Load AI chat module
     */
    async loadAIChatModule() {
        try {
            if (window.AIChatModule) {
                const aiChatModule = new window.AIChatModule();
                await aiChatModule.init();
            } else {
                console.warn('AI Chat module not loaded');
                this.showModulePlaceholder('ai-chat');
            }
        } catch (error) {
            console.error('Failed to load AI chat module:', error);
            this.showModulePlaceholder('ai-chat');
        }
    }

    /**
     * Load archive module
     */
    async loadArchiveModule() {
        try {
            // Archive functionality placeholder
            this.showModulePlaceholder('archive');
        } catch (error) {
            console.error('Failed to load archive module:', error);
            this.showModulePlaceholder('archive');
        }
    }

    /**
     * Load settings module
     */
    async loadSettingsModule() {
        try {
            if (window.SettingsModule) {
                const settingsModule = new window.SettingsModule();
                await settingsModule.init();
            } else {
                console.warn('Settings module not loaded');
                this.showModulePlaceholder('settings');
            }
        } catch (error) {
            console.error('Failed to load settings module:', error);
            this.showModulePlaceholder('settings');
        }
    }

    /**
     * Load tasks for specific date
     */
    async loadTasksForDate(date) {
        try {
            // Similar to home page but filtered by date
            this.showModulePlaceholder('day-tasks');
        } catch (error) {
            console.error('Failed to load tasks for date:', error);
            this.showModulePlaceholder('day-tasks');
        }
    }

    /**
     * Show module placeholder when module is not available
     */
    showModulePlaceholder(moduleType) {
        const placeholders = {
            'tasks': 'Модуль задач будет доступен скоро',
            'ai-chat': 'AI помощник будет доступен скоро',
            'archive': 'Архив будет доступен скоро',
            'settings': 'Настройки будут доступны скоро',
            'day-tasks': 'Просмотр задач по дням будет доступен скоро'
        };
        
        const placeholder = document.querySelector('.page-loading-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="module-placeholder">
                    <h3>${placeholders[moduleType] || 'Модуль недоступен'}</h3>
                    <p>Функциональность находится в разработке</p>
                </div>
            `;
        }
    }

    /**
     * Show date picker modal
     */
    showDatePicker() {
        // Calendar module should handle this
        if (window.CalendarModule) {
            const calendar = new window.CalendarModule();
            calendar.showDatePicker((selectedDate) => {
                router.navigate(`/day/${selectedDate}`);
            });
        } else {
            console.warn('Calendar module not loaded');
        }
    }

    /**
     * Show profile menu
     */
    showProfileMenu() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer || !this.user) return;
        
        modalContainer.innerHTML = `
            <div class="modal modal--profile">
                <div class="modal__backdrop"></div>
                <div class="modal__content">
                    <div class="profile-menu">
                        <div class="profile-menu__header">
                            <h3>${this.user.first_name} ${this.user.last_name || ''}</h3>
                            <p>@${this.user.username || 'user'}</p>
                        </div>
                        <div class="profile-menu__actions">
                            <button onclick="router.navigate('/settings')" class="profile-menu__item">
                                Настройки
                            </button>
                            <button onclick="app.handleLogout()" class="profile-menu__item profile-menu__item--danger">
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Handle modal close
        const backdrop = modalContainer.querySelector('.modal__backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                modalContainer.innerHTML = '';
            });
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        try {
            if (window.authManager) {
                await window.authManager.logout();
            }
            this.user = null;
            router.navigate('/', true);
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // Close modal
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }

    /**
     * Refresh user data
     */
    async refreshUserData() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            return;
        }
        
        try {
            await window.authManager.refreshToken();
            this.user = window.authManager.getUser();
            this.updateUserInterface();
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('App error:', message);
        
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="page page--error">
                    <div class="error-content">
                        <h2>Произошла ошибка</h2>
                        <p>${message}</p>
                        <button onclick="location.reload()" class="btn btn--primary">
                            Перезагрузить
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Create global app instance
const app = new TudushkaApp();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TudushkaApp;
}