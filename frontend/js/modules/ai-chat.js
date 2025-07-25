/**
 * AI Chat module for Tudushka
 * Handles AI assistant chat interface and communication
 */

class AIChatModule {
    constructor() {
        this.messages = [];
        this.isLoading = false;
        this.container = null;
    }

    /**
     * Initialize the AI chat module
     */
    async init() {
        console.log('Initializing AI Chat module...');
        
        // Replace loading placeholder with actual chat interface
        const placeholder = document.querySelector('.page-loading-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="ai-chat-placeholder">
                    <h3>AI ><>I=8: 1C45B 4>ABC?5= A:>@></h3>
                    <p>$C=:F8>=0;L=>ABL =0E>48BAO 2 @07@01>B:5</p>
                </div>
            `;
        }
    }

    /**
     * Render chat interface
     */
    renderChatInterface() {
        return `
            <div class="ai-chat">
                <div class="ai-chat__messages" id="aiChatMessages">
                    <div class="ai-message">
                        <div class="ai-message__avatar">></div>
                        <div class="ai-message__content">
                            <p>@825B! / 20H AI ?><>I=8:. ><>3C 20< ?;0=8@>20BL 7040G8 8 >B25GC =0 2>?@>AK.</p>
                        </div>
                    </div>
                </div>
                
                <div class="ai-chat__input">
                    <div class="ai-input-container">
                        <textarea 
                            id="aiChatInput" 
                            placeholder="0?8H8B5 20H5 A>>1I5=85..."
                            rows="1"
                        ></textarea>
                        <button id="aiSendButton" class="ai-send-btn" disabled>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M18 2L9 11L18 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18 2L12 20L9 11L2 8L18 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup chat event listeners
     */
    setupChatEventListeners() {
        const input = document.getElementById('aiChatInput');
        const sendButton = document.getElementById('aiSendButton');

        if (input) {
            input.addEventListener('input', () => {
                const hasText = input.value.trim().length > 0;
                if (sendButton) {
                    sendButton.disabled = !hasText;
                }
                
                // Auto-resize textarea
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }

    /**
     * Send a message to AI assistant
     */
    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        if (!input || this.isLoading) return;

        const message = input.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';

        // Show loading state
        this.setLoading(true);

        try {
            // TODO: Replace with actual API call
            await this.simulateAIResponse(message);
        } catch (error) {
            console.error('AI chat error:', error);
            this.addMessage('728=8B5, ?@>87>H;0 >H81:0. >?@>1C9B5 5I5 @07.', 'ai', true);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Simulate AI response (placeholder)
     */
    async simulateAIResponse(userMessage) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const responses = [
            '>=O; 20H 70?@>A. -B> DC=:F8O =0E>48BAO 2 @07@01>B:5.',
            '!?0A81> 70 A>>1I5=85! AI ?><>I=8: 1C45B 4>ABC?5= 2 1;8609H55 2@5<O.',
            '=B5@5A=K9 2>?@>A! >:0 GB> MB0 DC=:F8O =5 @50;87>20=0.',
            '/ 1K A C4>2>;LAB285< ?><>3, => <>O DC=:F8>=0;L=>ABL 5I5 2 @07@01>B:5.'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(randomResponse, 'ai');
    }

    /**
     * Add a message to the chat
     */
    addMessage(content, sender, isError = false) {
        const messagesContainer = document.getElementById('aiChatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `ai-message ai-message--${sender}`;
        
        if (isError) {
            messageElement.classList.add('ai-message--error');
        }

        messageElement.innerHTML = `
            <div class="ai-message__avatar">
                ${sender === 'user' ? '=d' : '>'}
            </div>
            <div class="ai-message__content">
                <p>${content}</p>
                <span class="ai-message__time">${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const sendButton = document.getElementById('aiSendButton');
        const input = document.getElementById('aiChatInput');

        if (loading) {
            this.addLoadingMessage();
            if (sendButton) sendButton.disabled = true;
            if (input) input.disabled = true;
        } else {
            this.removeLoadingMessage();
            if (sendButton) sendButton.disabled = !input?.value.trim();
            if (input) input.disabled = false;
        }
    }

    /**
     * Add loading message
     */
    addLoadingMessage() {
        const messagesContainer = document.getElementById('aiChatMessages');
        if (!messagesContainer) return;

        const loadingElement = document.createElement('div');
        loadingElement.className = 'ai-message ai-message--ai ai-message--loading';
        loadingElement.innerHTML = `
            <div class="ai-message__avatar">></div>
            <div class="ai-message__content">
                <div class="ai-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(loadingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Remove loading message
     */
    removeLoadingMessage() {
        const loadingMessage = document.querySelector('.ai-message--loading');
        if (loadingMessage) {
            loadingMessage.remove();
        }
    }
}

// Export the module
if (typeof window !== 'undefined') {
    window.AIChatModule = AIChatModule;
}