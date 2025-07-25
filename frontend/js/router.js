/**
 * Client-side hash-based router for Tudushka
 * Handles navigation between pages, route parameters, and back button
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.currentParams = {};
        this.isNavigating = false;
        
        // Bind methods
        this.handleHashChange = this.handleHashChange.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        
        // Initialize
        this.init();
    }

    /**
     * Initialize router and event listeners
     */
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', this.handleHashChange);
        window.addEventListener('popstate', this.handlePopState);
        
        // Handle initial route
        this.handleHashChange();
        
        // Setup navigation link handlers
        this.setupNavigationHandlers();
    }

    /**
     * Add a route handler
     * @param {string} path - Route path (e.g., '/', '/ai', '/day/:date')
     * @param {Function} handler - Route handler function
     */
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Navigate to a specific path
     * @param {string} path - Path to navigate to
     * @param {boolean} replace - Replace current history entry instead of pushing
     */
    navigate(path, replace = false) {
        if (this.isNavigating) return;
        
        const currentHash = window.location.hash.slice(1) || '/';
        if (currentHash === path) return;
        
        this.isNavigating = true;
        
        // Show loading animation
        this.showPageLoading();
        
        // Update URL
        if (replace) {
            window.location.replace(`#${path}`);
        } else {
            window.location.hash = path;
        }
        
        // Small delay for smooth animation
        setTimeout(() => {
            this.isNavigating = false;
        }, 150);
    }

    /**
     * Get current route path
     * @returns {string} Current route path
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get current route parameters
     * @returns {Object} Route parameters
     */
    getParams() {
        return { ...this.currentParams };
    }

    /**
     * Handle hash change events
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1) || '/';
        this.handleRoute(hash);
    }

    /**
     * Handle popstate events (back/forward buttons)
     */
    handlePopState(event) {
        this.handleHashChange();
    }

    /**
     * Handle route matching and execution
     * @param {string} path - Path to handle
     */
    handleRoute(path) {
        const { route, params, handler } = this.matchRoute(path);
        
        if (handler) {
            this.currentRoute = route;
            this.currentParams = params;
            
            // Update navigation active states
            this.updateNavigationStates(route);
            
            // Execute route handler
            try {
                handler(params);
            } catch (error) {
                console.error('Route handler error:', error);
                this.handle404();
            }
        } else {
            this.handle404();
        }
    }

    /**
     * Match path against registered routes
     * @param {string} path - Path to match
     * @returns {Object} Match result with route, params, and handler
     */
    matchRoute(path) {
        // Try exact matches first
        if (this.routes.has(path)) {
            return {
                route: path,
                params: {},
                handler: this.routes.get(path)
            };
        }

        // Try parametric routes
        for (const [routePath, handler] of this.routes) {
            const params = this.matchParametricRoute(routePath, path);
            if (params !== null) {
                return {
                    route: routePath,
                    params,
                    handler
                };
            }
        }

        return { route: null, params: {}, handler: null };
    }

    /**
     * Match parametric route (e.g., /day/:date)
     * @param {string} routePath - Route pattern
     * @param {string} actualPath - Actual path
     * @returns {Object|null} Parameters or null if no match
     */
    matchParametricRoute(routePath, actualPath) {
        const routeParts = routePath.split('/');
        const pathParts = actualPath.split('/');

        if (routeParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        
        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (routePart.startsWith(':')) {
                // Parameter
                const paramName = routePart.slice(1);
                params[paramName] = decodeURIComponent(pathPart);
            } else if (routePart !== pathPart) {
                // Fixed part doesn't match
                return null;
            }
        }

        return params;
    }

    /**
     * Handle 404 errors
     */
    handle404() {
        this.currentRoute = '/404';
        this.currentParams = {};
        
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="page page--error">
                    <div class="error-content">
                        <h2>Страница не найдена</h2>
                        <p>Запрашиваемая страница не существует</p>
                        <button onclick="router.navigate('/')" class="btn btn--primary">
                            На главную
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.hidePageLoading();
    }

    /**
     * Setup navigation link handlers
     */
    setupNavigationHandlers() {
        // Handle footer navigation
        const navItems = document.querySelectorAll('.footer__nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href && href.startsWith('#')) {
                    this.navigate(href.slice(1));
                }
            });
        });

        // Handle back button in header if exists
        const backButton = document.querySelector('.header__back');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }
    }

    /**
     * Update navigation active states
     * @param {string} currentRoute - Current route path
     */
    updateNavigationStates(currentRoute) {
        const navItems = document.querySelectorAll('.footer__nav-item');
        
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            item.classList.remove('footer__nav-item--active');
            
            // Match routes to pages
            if ((currentRoute === '/' && page === 'home') ||
                (currentRoute.startsWith('/ai') && page === 'ai') ||
                (currentRoute.startsWith('/archive') && page === 'archive') ||
                (currentRoute.startsWith('/settings') && page === 'settings')) {
                item.classList.add('footer__nav-item--active');
            }
        });

        // Update header title based on route
        this.updateHeaderTitle(currentRoute);
    }

    /**
     * Update header title based on current route
     * @param {string} route - Current route
     */
    updateHeaderTitle(route) {
        const currentDateElement = document.getElementById('currentDate');
        if (!currentDateElement) return;

        let title = 'Сегодня';
        
        if (route.startsWith('/day/')) {
            const dateParam = this.currentParams.date;
            if (dateParam) {
                const date = new Date(dateParam);
                if (!isNaN(date.getTime())) {
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (this.isSameDay(date, today)) {
                        title = 'Сегодня';
                    } else if (this.isSameDay(date, tomorrow)) {
                        title = 'Завтра';
                    } else if (this.isSameDay(date, yesterday)) {
                        title = 'G5@0';
                    } else {
                        title = date.toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long'
                        });
                    }
                }
            }
        } else if (route === '/ai') {
            title = 'AI Ассистент';
        } else if (route === '/archive') {
            title = '@E82';
        } else if (route === '/settings') {
            title = 'Настройки';
        }

        currentDateElement.textContent = title;
    }

    /**
     * Check if two dates are the same day
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if same day
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    /**
     * Go back in browser history
     */
    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.navigate('/');
        }
    }

    /**
     * Show page loading animation
     */
    showPageLoading() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.classList.add('page-loading');
        }
    }

    /**
     * Hide page loading animation
     */
    hidePageLoading() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.classList.remove('page-loading');
        }
    }

    /**
     * Destroy router and cleanup event listeners
     */
    destroy() {
        window.removeEventListener('hashchange', this.handleHashChange);
        window.removeEventListener('popstate', this.handlePopState);
    }
}

// Create global router instance
const router = new Router();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}