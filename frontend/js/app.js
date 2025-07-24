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
            } else {
                console.warn('Telegram Web App not available');
                this.hideLoadingScreen();
            }
            
            this.isInitialized = true;
            console.log('Tudushka app initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('H81:0 8=8F80;870F88 ?@8;>65=8O');
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
        this.showError(`H81:0 02B>@870F88: ${event.detail.error}`);
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
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page page--home">
                <div class="tasks-container">
                    <div class="page-loading-placeholder">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>03@C7:0 7040G...</p>
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
                        <p>03@C7:0 AI ?><>I=8:0...</p>
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
                        <p>03@C7:0 0@E820...</p>
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
                        <p>03@C7:0 =0AB@>5:...</p>
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
                        <p>03@C7:0 7040G =0 ${date}...</p>
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
            'tasks': '>4C;L 7040G 1C45B 4>ABC?5= A:>@>',
            'ai-chat': 'AI ?><>I=8: 1C45B 4>ABC?5= A:>@>',
            'archive': '@E82 1C45B 4>ABC?5= A:>@>',
            'settings': '0AB@>9:8 1C4CB 4>ABC?=K A:>@>',
            'day-tasks': '@>A<>B@ 7040G ?> 4=O< 1C45B 4>ABC?5= A:>@>'
        };
        
        const placeholder = document.querySelector('.page-loading-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="module-placeholder">
                    <h3>${placeholders[moduleType] || '>4C;L =54>ABC?5='}</h3>
                    <p>$C=:F8>=0;L=>ABL =0E>48BAO 2 @07@01>B:5</p>
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
                                0AB@>9:8
                            </button>
                            <button onclick="app.handleLogout()" class="profile-menu__item profile-menu__item--danger">
                                K9B8
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
                        <h2>@>87>H;0 >H81:0</h2>
                        <p>${message}</p>
                        <button onclick="location.reload()" class="btn btn--primary">
                            5@5703@C78BL
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