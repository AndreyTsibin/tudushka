/**
 * Telegram Web Apps SDK Integration
 * Handles all interactions with Telegram Web App API
 */

class TelegramSDK {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isInitialized = false;
        this.user = null;
        this.initData = null;
        
        if (this.tg) {
            this.init();
        } else {
            console.warn('Telegram Web App not available');
        }
    }

    /**
     * Initialize Telegram Web App
     */
    init() {
        try {
            // Ready the app
            this.tg.ready();
            
            // Expand the viewport
            this.tg.expand();
            
            // Set closing confirmation
            this.tg.enableClosingConfirmation();
            
            // Apply theme
            this.applyTheme();
            
            // Get user data
            this.user = this.tg.initDataUnsafe?.user;
            this.initData = this.tg.initData;
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Telegram Web App initialized successfully');
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('telegramReady', {
                detail: {
                    user: this.user,
                    initData: this.initData
                }
            }));
            
        } catch (error) {
            console.error('Failed to initialize Telegram Web App:', error);
        }
    }

    /**
     * Apply Telegram theme to the app
     */
    applyTheme() {
        if (!this.tg) return;

        const themeParams = this.tg.themeParams;
        
        // Apply theme colors to CSS variables
        if (themeParams) {
            const root = document.documentElement;
            
            root.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
            root.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
            root.style.setProperty('--tg-hint-color', themeParams.hint_color || '#999999');
            root.style.setProperty('--tg-link-color', themeParams.link_color || '#007AFF');
            root.style.setProperty('--tg-button-color', themeParams.button_color || '#007AFF');
            root.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
            root.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color || '#f1f1f1');
            
            // Add dark theme class if needed
            if (this.tg.colorScheme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
    }

    /**
     * Setup event listeners for Telegram Web App events
     */
    setupEventListeners() {
        if (!this.tg) return;

        // Main button events
        this.tg.onEvent('mainButtonClicked', () => {
            window.dispatchEvent(new CustomEvent('telegramMainButtonClicked'));
        });

        // Back button events  
        this.tg.onEvent('backButtonClicked', () => {
            window.dispatchEvent(new CustomEvent('telegramBackButtonClicked'));
        });

        // Theme change events
        this.tg.onEvent('themeChanged', () => {
            this.applyTheme();
            window.dispatchEvent(new CustomEvent('telegramThemeChanged'));
        });

        // Viewport change events
        this.tg.onEvent('viewportChanged', () => {
            this.updateViewport();
            window.dispatchEvent(new CustomEvent('telegramViewportChanged'));
        });
    }

    /**
     * Update viewport height based on Telegram viewport
     */
    updateViewport() {
        if (!this.tg) return;

        const viewportHeight = this.tg.viewportHeight;
        document.documentElement.style.setProperty('--tg-viewport-height', `${viewportHeight}px`);
        
        // Update CSS viewport units
        const vh = viewportHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    /**
     * Show main button with text and optional parameters
     */
    showMainButton(text, options = {}) {
        if (!this.tg) return;

        this.tg.MainButton.setText(text);
        
        if (options.color) {
            this.tg.MainButton.setParams({ color: options.color });
        }
        
        if (options.textColor) {
            this.tg.MainButton.setParams({ text_color: options.textColor });
        }
        
        this.tg.MainButton.show();
        
        if (!options.disabled) {
            this.tg.MainButton.enable();
        } else {
            this.tg.MainButton.disable();
        }
    }

    /**
     * Hide main button
     */
    hideMainButton() {
        if (!this.tg) return;
        this.tg.MainButton.hide();
    }

    /**
     * Show back button
     */
    showBackButton() {
        if (!this.tg) return;
        this.tg.BackButton.show();
    }

    /**
     * Hide back button
     */
    hideBackButton() {
        if (!this.tg) return;
        this.tg.BackButton.hide();
    }

    /**
     * Show haptic feedback
     */
    hapticFeedback(type = 'impact', style = 'medium') {
        if (!this.tg?.HapticFeedback) return;

        switch (type) {
            case 'impact':
                this.tg.HapticFeedback.impactOccurred(style); // light, medium, heavy
                break;
            case 'notification':
                this.tg.HapticFeedback.notificationOccurred(style); // error, success, warning
                break;
            case 'selection':
                this.tg.HapticFeedback.selectionChanged();
                break;
        }
    }

    /**
     * Close the web app
     */
    close() {
        if (!this.tg) return;
        this.tg.close();
    }

    /**
     * Get user data
     */
    getUser() {
        return this.user;
    }

    /**
     * Get init data for backend validation
     */
    getInitData() {
        return this.initData;
    }

    /**
     * Check if running in Telegram
     */
    isInTelegram() {
        return !!this.tg && this.isInitialized;
    }

    /**
     * Get platform info
     */
    getPlatform() {
        if (!this.tg) return 'unknown';
        return this.tg.platform;
    }

    /**
     * Get version info
     */
    getVersion() {
        if (!this.tg) return 'unknown';
        return this.tg.version;
    }

    /**
     * Show popup with message
     */
    showPopup(title, message, buttons = []) {
        if (!this.tg) {
            alert(`${title}\n\n${message}`);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.tg.showPopup({
                title,
                message,
                buttons: buttons.length ? buttons : [{ type: 'ok' }]
            }, (buttonId) => {
                resolve(buttonId);
            });
        });
    }

    /**
     * Show confirm dialog
     */
    showConfirm(message, okText = 'OK', cancelText = 'Cancel') {
        if (!this.tg) {
            return Promise.resolve(confirm(message));
        }

        return new Promise((resolve) => {
            this.tg.showConfirm(message, (confirmed) => {
                resolve(confirmed);
            });
        });
    }

    /**
     * Send data to bot
     */
    sendData(data) {
        if (!this.tg) {
            console.warn('Cannot send data: not in Telegram');
            return;
        }

        try {
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            this.tg.sendData(dataStr);
        } catch (error) {
            console.error('Failed to send data:', error);
        }
    }

    /**
     * Open external link
     */
    openLink(url, options = {}) {
        if (!this.tg) {
            window.open(url, '_blank');
            return;
        }

        this.tg.openLink(url, options);
    }

    /**
     * Open internal Telegram link
     */
    openTelegramLink(url) {
        if (!this.tg) {
            console.warn('Cannot open Telegram link: not in Telegram');
            return;
        }

        this.tg.openTelegramLink(url);
    }

    /**
     * Request contact sharing
     */
    requestContact(callback) {
        if (!this.tg) {
            console.warn('Cannot request contact: not in Telegram');
            return;
        }

        this.tg.requestContact(callback);
    }

    /**
     * Check if feature is supported
     */
    isFeatureSupported(feature) {
        if (!this.tg) return false;
        
        const supportedFeatures = {
            mainButton: !!this.tg.MainButton,
            backButton: !!this.tg.BackButton,
            hapticFeedback: !!this.tg.HapticFeedback,
            cloudStorage: !!this.tg.CloudStorage,
            biometric: !!this.tg.BiometricManager
        };

        return supportedFeatures[feature] || false;
    }
}

// Create global instance
window.telegramSDK = new TelegramSDK();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramSDK;
}