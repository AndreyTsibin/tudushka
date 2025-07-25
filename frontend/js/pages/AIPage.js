import Modal from '../components/Modal.js';
import API from '../api.js';

/**
 * AIPage - AI Assistant chat interface
 */
class AIPage {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onChatCreate: options.onChatCreate || (() => {}),
            onMessageSend: options.onMessageSend || (() => {}),
            ...options
        };

        this.element = null;
        this.chats = [];
        this.currentChat = null;
        this.messages = [];
        this.messageInput = null;
        this.messagesContainer = null;
        this.isLoading = false;
        this.isTyping = false;
        this.usageData = null;
        this.autoScrollEnabled = true;

        // Message constraints
        this.maxMessageLength = 1000;
        this.messageQueue = [];
        this.isProcessingMessage = false;

        this.bindMethods();
    }

    bindMethods() {
        this.handleSendMessage = this.handleSendMessage.bind(this);
        this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
        this.handleNewChat = this.handleNewChat.bind(this);
        this.handleChatSelect = this.handleChatSelect.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'ai-page';
        this.element.innerHTML = `
            <div class="ai-header">
                <div class="ai-title-section">
                    <h1 class="ai-title">AI Помощник</h1>
                    <div class="usage-info">
                        <span class="usage-counter">0/3</span>
                        <span class="usage-period">сегодня</span>
                    </div>
                </div>
                <div class="ai-actions">
                    <button class="header-btn new-chat-btn" aria-label="New chat" title="Новый чат">
                        <svg viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                    </button>
                    <button class="header-btn chat-list-toggle" aria-label="Toggle chat list" title="Список чатов">
                        <svg viewBox="0 0 24 24">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="ai-content">
                <div class="chat-sidebar">
                    <div class="chat-list-header">
                        <h3>Чаты</h3>
                        <button class="new-chat-btn-small">
                            <svg viewBox="0 0 24 24">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="chat-list" role="list">
                        <!-- Chat items will be inserted here -->
                    </div>
                </div>

                <div class="chat-main">
                    <div class="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
                        <div class="welcome-message">
                            <div class="ai-avatar">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div class="welcome-content">
                                <h3>Добро пожаловать в AI Помощник!</h3>
                                <p>Я помогу вам планировать задачи, составлять расписание и отвечать на вопросы. Просто напишите, что вас интересует.</p>
                                <div class="quick-actions">
                                    <button class="quick-action-btn" data-prompt="Помоги мне спланировать день">
                                        📅 Планирование дня
                                    </button>
                                    <button class="quick-action-btn" data-prompt="Как лучше организовать рабочее время?">
                                        ⏰ Тайм-менеджмент
                                    </button>
                                    <button class="quick-action-btn" data-prompt="Посоветуй способы повышения продуктивности">
                                        🚀 Продуктивность
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="chat-input-container">
                        <div class="input-wrapper">
                            <textarea 
                                class="message-input" 
                                placeholder="Напишите сообщение..." 
                                rows="1"
                                maxlength="${this.maxMessageLength}"
                                aria-label="Message input"
                            ></textarea>
                            <div class="input-actions">
                                <div class="character-counter">
                                    <span class="current-length">0</span>/<span class="max-length">${this.maxMessageLength}</span>
                                </div>
                                <button class="send-btn" type="button" disabled aria-label="Send message" title="Отправить">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="typing-indicator" style="display: none;">
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span class="typing-text">AI набирает ответ...</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="usage-limit-warning" style="display: none;">
                <div class="warning-content">
                    <svg class="warning-icon" viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                    <div class="warning-text">
                        <h4>Лимит сообщений исчерпан</h4>
                        <p>Вы достигли дневного лимита сообщений. Обновите подписку для продолжения.</p>
                    </div>
                    <button class="upgrade-btn">Обновить план</button>
                </div>
            </div>
        `;

        this.messagesContainer = this.element.querySelector('.chat-messages');
        this.messageInput = this.element.querySelector('.message-input');

        this.bindEvents();
        this.loadChats();
        this.loadUsageData();

        if (this.container) {
            this.container.appendChild(this.element);
        }

        return this.element;
    }

    bindEvents() {
        if (!this.element) return;

        // Send button and input
        const sendBtn = this.element.querySelector('.send-btn');
        sendBtn.addEventListener('click', this.handleSendMessage);
        this.messageInput.addEventListener('keydown', this.handleInputKeyDown);
        this.messageInput.addEventListener('input', this.handleInputChange);

        // New chat buttons
        const newChatBtns = this.element.querySelectorAll('.new-chat-btn, .new-chat-btn-small');
        newChatBtns.forEach(btn => {
            btn.addEventListener('click', this.handleNewChat);
        });

        // Chat list toggle
        const chatListToggle = this.element.querySelector('.chat-list-toggle');
        chatListToggle.addEventListener('click', this.toggleChatSidebar.bind(this));

        // Quick action buttons
        const quickActionBtns = this.element.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.getAttribute('data-prompt');
                if (prompt) {
                    this.messageInput.value = prompt;
                    this.updateInputUI();
                    this.messageInput.focus();
                }
            });
        });

        // Messages container scroll
        this.messagesContainer.addEventListener('scroll', this.handleScroll);

        // Usage limit warning
        const upgradeBtn = this.element.querySelector('.upgrade-btn');
        upgradeBtn.addEventListener('click', this.showUpgradeModal.bind(this));

        // Auto-resize textarea
        this.messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));
    }

    handleInputChange() {
        this.updateInputUI();
    }

    handleInputKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessingMessage) return;

        // Check usage limits
        if (!this.canSendMessage()) {
            this.showUsageLimitWarning();
            return;
        }

        this.isProcessingMessage = true;
        this.messageInput.value = '';
        this.updateInputUI();

        // Add user message to UI
        this.addMessage({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        this.showTypingIndicator();
        this.scrollToBottom();

        try {
            // Create new chat if needed
            if (!this.currentChat) {
                await this.createNewChat(message);
            }

            // Send message to API
            const response = await API.sendAIMessage(this.currentChat.id, message);
            
            // Add AI response to UI
            this.addMessage({
                role: 'assistant',
                content: response.content,
                timestamp: response.timestamp || new Date().toISOString()
            });

            // Update usage data
            this.updateUsageData(response.usage);
            this.options.onMessageSend(message, response);

        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage({
                role: 'error',
                content: 'Извините, произошла ошибка при отправке сообщения. Попробуйте еще раз.',
                timestamp: new Date().toISOString()
            });
        } finally {
            this.hideTypingIndicator();
            this.isProcessingMessage = false;
            this.scrollToBottom();
        }
    }

    async handleNewChat() {
        try {
            this.currentChat = null;
            this.messages = [];
            this.clearMessages();
            this.showWelcomeMessage();
            this.messageInput.focus();
        } catch (error) {
            console.error('Error creating new chat:', error);
            Modal.alert('Ошибка создания нового чата', 'Ошибка');
        }
    }

    async createNewChat(firstMessage) {
        try {
            const chat = await API.createAIChat({ 
                title: this.generateChatTitle(firstMessage) 
            });
            
            this.currentChat = chat;
            this.chats.unshift(chat);
            this.renderChatList();
            this.options.onChatCreate(chat);
            
        } catch (error) {
            console.error('Error creating chat:', error);
            throw error;
        }
    }

    handleChatSelect(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        this.currentChat = chat;
        this.loadChatMessages(chatId);
        this.updateChatListSelection();
    }

    async loadChats() {
        try {
            const response = await API.getAIChats();
            this.chats = response.chats || [];
            this.renderChatList();
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    async loadChatMessages(chatId) {
        try {
            this.clearMessages();
            const response = await API.getAIMessages(chatId);
            this.messages = response.messages || [];
            this.renderMessages();
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
            Modal.alert('Ошибка загрузки сообщений', 'Ошибка');
        }
    }

    async loadUsageData() {
        try {
            const response = await API.getAIUsage();
            this.usageData = response;
            this.updateUsageDisplay();
        } catch (error) {
            console.error('Error loading usage data:', error);
        }
    }

    renderChatList() {
        const chatList = this.element.querySelector('.chat-list');
        if (!chatList) return;

        if (this.chats.length === 0) {
            chatList.innerHTML = `
                <div class="empty-chat-list">
                    <p>Пока нет чатов</p>
                    <p class="empty-subtitle">Начните новый разговор с AI</p>
                </div>
            `;
            return;
        }

        chatList.innerHTML = this.chats.map(chat => `
            <div class="chat-item ${chat.id === this.currentChat?.id ? 'active' : ''}" 
                 data-chat-id="${chat.id}" 
                 role="listitem"
                 tabindex="0">
                <div class="chat-preview">
                    <h4 class="chat-title">${this.escapeHtml(chat.title)}</h4>
                    <p class="chat-last-message">${this.escapeHtml(chat.last_message || 'Новый чат')}</p>
                </div>
                <div class="chat-meta">
                    <span class="chat-time">${this.formatChatTime(chat.updated_at)}</span>
                    <button class="chat-delete-btn" aria-label="Delete chat" title="Удалить чат">
                        <svg viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Bind chat item events
        chatList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.chat-delete-btn')) return;
                const chatId = item.getAttribute('data-chat-id');
                this.handleChatSelect(chatId);
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const chatId = item.getAttribute('data-chat-id');
                    this.handleChatSelect(chatId);
                }
            });

            const deleteBtn = item.querySelector('.chat-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = item.getAttribute('data-chat-id');
                this.deleteChatWithConfirmation(chatId);
            });
        });
    }

    renderMessages() {
        this.messagesContainer.innerHTML = '';

        if (this.messages.length === 0) {
            this.showWelcomeMessage();
            return;
        }

        this.messages.forEach(message => {
            this.addMessageElement(message);
        });
    }

    addMessage(message) {
        this.messages.push(message);
        this.addMessageElement(message);
    }

    addMessageElement(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${message.role}`;
        
        if (message.role === 'user') {
            messageEl.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.formatMessageContent(message.content)}</div>
                    <div class="message-time">${this.formatMessageTime(message.timestamp)}</div>
                </div>
                <div class="message-avatar user-avatar">
                    <span>Вы</span>
                </div>
            `;
        } else if (message.role === 'assistant') {
            messageEl.innerHTML = `
                <div class="message-avatar ai-avatar">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-text">${this.formatMessageContent(message.content)}</div>
                    <div class="message-actions">
                        <button class="copy-btn" title="Копировать">
                            <svg viewBox="0 0 24 24">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                        <span class="message-time">${this.formatMessageTime(message.timestamp)}</span>
                    </div>
                </div>
            `;

            // Bind copy button
            const copyBtn = messageEl.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard(message.content);
            });
        } else if (message.role === 'error') {
            messageEl.innerHTML = `
                <div class="message-avatar error-avatar">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-text error-text">${this.escapeHtml(message.content)}</div>
                    <div class="message-time">${this.formatMessageTime(message.timestamp)}</div>
                </div>
            `;
        }

        this.messagesContainer.appendChild(messageEl);

        // Hide welcome message if it exists
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    showWelcomeMessage() {
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'block';
        }
    }

    clearMessages() {
        const messages = this.messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        this.showWelcomeMessage();
    }

    showTypingIndicator() {
        const indicator = this.element.querySelector('.typing-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
            this.isTyping = true;
        }
    }

    hideTypingIndicator() {
        const indicator = this.element.querySelector('.typing-indicator');
        if (indicator) {
            indicator.style.display = 'none';
            this.isTyping = false;
        }
    }

    updateInputUI() {
        const message = this.messageInput.value.trim();
        const sendBtn = this.element.querySelector('.send-btn');
        const currentLength = this.element.querySelector('.current-length');
        
        sendBtn.disabled = !message || this.isProcessingMessage || !this.canSendMessage();
        
        if (currentLength) {
            currentLength.textContent = this.messageInput.value.length;
            
            // Update character counter color
            const counter = this.element.querySelector('.character-counter');
            const ratio = this.messageInput.value.length / this.maxMessageLength;
            
            if (ratio > 0.9) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        const maxHeight = 120; // 6 lines approximately
        const newHeight = Math.min(this.messageInput.scrollHeight, maxHeight);
        this.messageInput.style.height = newHeight + 'px';
    }

    canSendMessage() {
        if (!this.usageData) return true;
        
        const { daily_limit, used_today } = this.usageData;
        return used_today < daily_limit;
    }

    showUsageLimitWarning() {
        const warning = this.element.querySelector('.usage-limit-warning');
        if (warning) {
            warning.style.display = 'flex';
            setTimeout(() => {
                warning.style.display = 'none';
            }, 5000);
        }
    }

    updateUsageData(newUsage) {
        if (newUsage) {
            this.usageData = { ...this.usageData, ...newUsage };
            this.updateUsageDisplay();
        }
    }

    updateUsageDisplay() {
        const counter = this.element.querySelector('.usage-counter');
        if (!counter || !this.usageData) return;

        const { daily_limit, used_today } = this.usageData;
        counter.textContent = `${used_today}/${daily_limit}`;
        
        // Add warning class if near limit
        if (used_today / daily_limit > 0.8) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }
    }

    updateChatListSelection() {
        const chatItems = this.element.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            const chatId = item.getAttribute('data-chat-id');
            item.classList.toggle('active', chatId === this.currentChat?.id);
        });
    }

    async deleteChatWithConfirmation(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        const confirmed = await Modal.confirm(
            `Вы уверены, что хотите удалить чат "${chat.title}"?`,
            'Удаление чата'
        );

        if (!confirmed) return;

        try {
            await API.deleteAIChat(chatId);
            
            this.chats = this.chats.filter(c => c.id !== chatId);
            this.renderChatList();
            
            if (this.currentChat?.id === chatId) {
                this.handleNewChat();
            }
            
        } catch (error) {
            console.error('Error deleting chat:', error);
            Modal.alert('Ошибка удаления чата', 'Ошибка');
        }
    }

    toggleChatSidebar() {
        const sidebar = this.element.querySelector('.chat-sidebar');
        sidebar.classList.toggle('open');
    }

    handleScroll() {
        const container = this.messagesContainer;
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
        this.autoScrollEnabled = isNearBottom;
    }

    scrollToBottom() {
        if (this.autoScrollEnabled) {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 100);
        }
    }

    showUpgradeModal() {
        Modal.alert(
            'Обновление подписки будет доступно в следующей версии приложения.',
            'Обновление плана'
        );
    }

    // Utility methods
    generateChatTitle(firstMessage) {
        return firstMessage.length > 30 ? 
            firstMessage.substring(0, 30) + '...' : 
            firstMessage;
    }

    formatMessageContent(content) {
        // Basic markdown-like formatting
        let formatted = this.escapeHtml(content);
        
        // Bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks
        formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        
        // Inline code
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'только что';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} мин назад`;
        } else if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    formatChatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000 && date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
            });
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show brief success feedback
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = 'Скопировано!';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.messagesContainer = null;
        this.messageInput = null;
    }
}

export default AIPage;