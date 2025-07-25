/**
 * Modal Component
 * Reusable modal dialog with overlay and animations
 */
class Modal {
    constructor(options = {}) {
        this.options = {
            title: options.title || '',
            content: options.content || '',
            closeOnOverlay: options.closeOnOverlay !== false,
            closeOnEscape: options.closeOnEscape !== false,
            showCloseButton: options.showCloseButton !== false,
            size: options.size || 'medium', // small, medium, large, fullscreen
            animationType: options.animationType || 'slideUp', // slideUp, fadeIn, slideDown
            className: options.className || '',
            onShow: options.onShow || (() => {}),
            onHide: options.onHide || (() => {}),
            onDestroy: options.onDestroy || (() => {}),
            ...options
        };
        
        this.element = null;
        this.overlay = null;
        this.content = null;
        this.isVisible = false;
        this.isAnimating = false;
        this.previousActiveElement = null;
        this.isLoading = false;
    }

    create() {
        if (this.element) return this;

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = `modal-overlay ${this.options.animationType}`;
        this.overlay.setAttribute('role', 'presentation');

        // Create modal element
        this.element = document.createElement('div');
        this.element.className = `modal modal-${this.options.size} ${this.options.className}`;
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        if (this.options.title) {
            this.element.setAttribute('aria-labelledby', 'modal-title');
        }

        this.element.innerHTML = `
            <div class="modal-header">
                ${this.options.title ? `<h2 class="modal-title" id="modal-title">${this.escapeHtml(this.options.title)}</h2>` : ''}
                ${this.options.showCloseButton ? `
                    <button class="modal-close-btn" type="button" aria-label="Close modal" title="Close">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
            <div class="modal-content">
                ${this.options.content}
            </div>
            <div class="modal-loading">
                <div class="loading-spinner"></div>
                <span class="loading-text">Загрузка...</span>
            </div>
        `;

        this.content = this.element.querySelector('.modal-content');
        this.overlay.appendChild(this.element);

        this.bindEvents();
        return this;
    }

    bindEvents() {
        if (!this.element) return;

        // Close button
        const closeBtn = this.element.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.hide.bind(this));
        }

        // Overlay click
        if (this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });
        }

        // Escape key
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }

        // Prevent scroll on body when modal is open
        this.overlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    handleKeyDown(e) {
        if (!this.isVisible) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            this.hide();
        } else if (e.key === 'Tab') {
            this.handleTabKeyPress(e);
        }
    }

    handleTabKeyPress(e) {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    show() {
        if (this.isVisible || this.isAnimating) return this;

        this.create();
        this.isAnimating = true;
        this.previousActiveElement = document.activeElement;

        // Add to DOM
        document.body.appendChild(this.overlay);
        document.body.classList.add('modal-open');

        // Force reflow for animation
        this.overlay.offsetHeight;

        // Start animation
        requestAnimationFrame(() => {
            this.overlay.classList.add('show');
            this.element.classList.add('show');
        });

        // Animation complete
        setTimeout(() => {
            this.isAnimating = false;
            this.isVisible = true;
            this.focusFirstElement();
            this.options.onShow(this);
        }, 300);

        return this;
    }

    hide() {
        if (!this.isVisible || this.isAnimating) return this;

        this.isAnimating = true;
        this.overlay.classList.remove('show');
        this.element.classList.remove('show');

        setTimeout(() => {
            this.isAnimating = false;
            this.isVisible = false;
            document.body.classList.remove('modal-open');
            
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }

            // Restore focus
            if (this.previousActiveElement) {
                this.previousActiveElement.focus();
                this.previousActiveElement = null;
            }

            this.options.onHide(this);
        }, 300);

        return this;
    }

    destroy() {
        this.hide();
        
        setTimeout(() => {
            if (this.element) {
                document.removeEventListener('keydown', this.handleKeyDown.bind(this));
                this.element = null;
                this.overlay = null;
                this.content = null;
            }
            this.options.onDestroy(this);
        }, 350);

        return this;
    }

    setTitle(title) {
        const titleElement = this.element?.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
            this.element.setAttribute('aria-labelledby', 'modal-title');
        }
        return this;
    }

    setContent(content) {
        if (this.content) {
            if (typeof content === 'string') {
                this.content.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                this.content.innerHTML = '';
                this.content.appendChild(content);
            }
        }
        return this;
    }

    appendContent(content) {
        if (this.content) {
            if (typeof content === 'string') {
                this.content.insertAdjacentHTML('beforeend', content);
            } else if (content instanceof HTMLElement) {
                this.content.appendChild(content);
            }
        }
        return this;
    }

    showLoading(message = 'Загрузка...') {
        if (!this.element) return this;

        this.isLoading = true;
        const loadingElement = this.element.querySelector('.modal-loading');
        const loadingText = loadingElement.querySelector('.loading-text');
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        this.element.classList.add('loading');
        return this;
    }

    hideLoading() {
        if (!this.element) return this;

        this.isLoading = false;
        this.element.classList.remove('loading');
        return this;
    }

    focusFirstElement() {
        const focusableElements = this.element?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            this.element?.focus();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Static methods for common modal types
    static alert(message, title = 'Уведомление') {
        return new Modal({
            title,
            content: `<p class="modal-message">${message}</p>`,
            size: 'small'
        }).show();
    }

    static confirm(message, title = 'Подтверждение') {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: `
                    <p class="modal-message">${message}</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary cancel-btn">Отмена</button>
                        <button class="btn btn-primary confirm-btn">Подтвердить</button>
                    </div>
                `,
                size: 'small',
                closeOnOverlay: false,
                onShow: (modal) => {
                    const confirmBtn = modal.element.querySelector('.confirm-btn');
                    const cancelBtn = modal.element.querySelector('.cancel-btn');
                    
                    confirmBtn.addEventListener('click', () => {
                        modal.destroy();
                        resolve(true);
                    });
                    
                    cancelBtn.addEventListener('click', () => {
                        modal.destroy();
                        resolve(false);
                    });
                    
                    confirmBtn.focus();
                }
            }).show();
        });
    }

    static prompt(message, defaultValue = '', title = 'Введите значение') {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: `
                    <p class="modal-message">${message}</p>
                    <div class="form-group">
                        <input type="text" class="form-input prompt-input" value="${defaultValue}" placeholder="Введите значение">
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary cancel-btn">Отмена</button>
                        <button class="btn btn-primary confirm-btn">OK</button>
                    </div>
                `,
                size: 'small',
                closeOnOverlay: false,
                onShow: (modal) => {
                    const input = modal.element.querySelector('.prompt-input');
                    const confirmBtn = modal.element.querySelector('.confirm-btn');
                    const cancelBtn = modal.element.querySelector('.cancel-btn');
                    
                    const handleConfirm = () => {
                        modal.destroy();
                        resolve(input.value);
                    };
                    
                    const handleCancel = () => {
                        modal.destroy();
                        resolve(null);
                    };
                    
                    confirmBtn.addEventListener('click', handleConfirm);
                    cancelBtn.addEventListener('click', handleCancel);
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirm();
                        }
                    });
                    
                    input.focus();
                    input.select();
                }
            }).show();
        });
    }

    static loading(message = 'Загрузка...') {
        const modal = new Modal({
            content: '',
            size: 'small',
            showCloseButton: false,
            closeOnOverlay: false,
            closeOnEscape: false
        }).show();
        
        modal.showLoading(message);
        return modal;
    }
}

export default Modal;