# ARCHITECTURE.MD - Техническая документация проекта "Тудушка"

## 📋 Обзор проекта

**Тудушка** - Telegram Mini App с ToDo функционалом и AI-ассистентом для планирования задач.

### Основные возможности MVP:
- ✅ Создание, редактирование, удаление задач
- 📅 Планирование по дням/неделям/месяцам  
- 🤖 AI-чат помощник (Perplexity API)
- 📎 Загрузка файлов через Telegram Bot API
- 🌍 Двуязычность (русский/английский)
- 🎯 Onboarding tour для новых пользователей
- 🔐 Авторизация через Telegram

### Монетизация:
- **Free:** 3 AI сообщения/день, 3 файла на задачу (до 10MB каждый)
- **Plus:** 30 AI сообщений/день, 10 файлов на задачу (до 20MB каждый) - 149₽/мес
- **Pro:** неограниченно, файлы до 50MB - 299₽/мес

---

## 🏗️ Техническая архитектура

### Frontend Stack:
- **HTML5** - семантическая разметка
- **CSS3** - флексбокс/грид, анимации, адаптивность
- **Vanilla JavaScript** - ES6+, модульная архитектура
- **Telegram Web Apps API** - авторизация и интеграция

### Backend Stack:
- **Node.js 18 LTS** - серверная среда
- **Express.js** - минимальный веб-фреймворк
- **PostgreSQL 14** - основная база данных
- **Telegram Bot API** - хранение файлов
- **Perplexity API** - AI-ассистент

### Development Environment:
- **macOS** - разработка
- **Cursor IDE** - редактор кода
- **Claude Code** - AI помощник в разработке

### Production Environment:
- **Ubuntu 22.04** (timeweb.cloud VPS)
- **Nginx** - веб-сервер и прокси
- **PM2** - процесс-менеджер для Node.js
- **Redis** - кэширование и сессии
- **Let's Encrypt** - SSL сертификаты

---

## 🗄️ База данных (PostgreSQL)

### Схема таблиц:

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    birth_date DATE,
    language VARCHAR(2) DEFAULT 'ru',
    subscription_plan VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_by_ai BOOLEAN DEFAULT false,
    ai_context TEXT,
    repeat_interval VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
    repeat_until DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task attachments (files stored in Telegram)
CREATE TABLE task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    telegram_file_id VARCHAR(200) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'photo', 'document', 'video', 'audio'
    original_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI chat history
CREATE TABLE ai_chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Новый чат',
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI chat messages
CREATE TABLE ai_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES ai_chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User subscription usage tracking
CREATE TABLE usage_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ai_messages_today INTEGER DEFAULT 0,
    files_uploaded_today INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, date)
);

-- Session storage for rate limiting
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_attachments_telegram_file_id ON task_attachments(telegram_file_id);
CREATE INDEX idx_ai_chats_user_id ON ai_chats(user_id);
CREATE INDEX idx_messages_chat_id ON ai_messages(chat_id);
CREATE INDEX idx_messages_created_at ON ai_messages(created_at);
CREATE INDEX idx_usage_user_date ON usage_stats(user_id, date);
CREATE INDEX idx_usage_stats_date ON usage_stats(date);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

---

## 🔌 API Endpoints

### Authentication:
```http
POST /api/auth/telegram        # Telegram Web Apps authentication
GET  /api/auth/user           # Get current user info
PUT  /api/auth/user           # Update user profile
POST /api/auth/refresh        # Refresh JWT token
DELETE /api/auth/user         # Delete user account
```

### Tasks:
```http
GET    /api/tasks                    # Get user tasks (with date filters)
POST   /api/tasks                    # Create new task
GET    /api/tasks/:id                # Get specific task
PUT    /api/tasks/:id                # Update task
DELETE /api/tasks/:id                # Delete task
PUT    /api/tasks/:id/complete       # Mark task as completed
GET    /api/tasks/calendar/:year/:month  # Calendar view data
```

### File Attachments:
```http
POST   /api/tasks/:id/attachments    # Upload file via Telegram
GET    /api/tasks/:id/attachments    # Get task attachments
GET    /api/attachments/:id          # Get specific attachment
DELETE /api/attachments/:id          # Delete attachment
GET    /api/attachments/:id/download # Download file (proxy)
```

### AI Chat:
```http
GET    /api/ai/chats                 # Get user's chat list
POST   /api/ai/chats                 # Create new chat
GET    /api/ai/chats/:id             # Get chat messages
POST   /api/ai/chats/:id/messages    # Send message to AI
DELETE /api/ai/chats/:id             # Delete chat
GET    /api/ai/usage                 # Get AI usage statistics
```

### User Settings & Subscription:
```http
GET    /api/users/settings           # Get user settings
PUT    /api/users/settings           # Update user settings
GET    /api/users/usage              # Get subscription usage stats
GET    /api/subscription/plans       # Get available plans
POST   /api/subscription/upgrade     # Upgrade subscription
```

### System:
```http
GET    /health                       # Health check
GET    /api/health/detailed          # Detailed system status
POST   /api/webhook/telegram         # Telegram webhook handler
```

---

## 🔐 Безопасность

### Аутентификация:
```javascript
// Enhanced Telegram auth validation
const validateTelegramAuth = (req, res, next) => {
    const initData = req.headers['x-telegram-init-data'];
    const hash = req.headers['x-telegram-hash'];
    
    // Validate HMAC-SHA256 signature
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();
    
    const computedHash = crypto.createHmac('sha256', secretKey)
        .update(initData)
        .digest('hex');
    
    if (computedHash === hash) {
        // Additional checks
        const data = new URLSearchParams(initData);
        const authDate = parseInt(data.get('auth_date'));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if data is not older than 24 hours
        if (currentTime - authDate > 86400) {
            return res.status(401).json({ error: 'Authentication data expired' });
        }
        
        next();
    } else {
        res.status(401).json({ error: 'Invalid authentication signature' });
    }
};
```

### Security Middleware:
```javascript
// backend/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityMiddleware = [
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.telegram.org", "https://api.perplexity.ai"]
            }
        }
    }),
    
    // Rate limiting by endpoint
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
    })
];
```

### File Upload Security:
```javascript
// backend/middleware/upload.js
const multer = require('multer');
const crypto = require('crypto');

const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': { maxSize: 10 * 1024 * 1024, extension: '.jpg' },
        'image/png': { maxSize: 10 * 1024 * 1024, extension: '.png' },
        'image/gif': { maxSize: 5 * 1024 * 1024, extension: '.gif' },
        'application/pdf': { maxSize: 20 * 1024 * 1024, extension: '.pdf' },
        'text/plain': { maxSize: 1 * 1024 * 1024, extension: '.txt' },
        'audio/mpeg': { maxSize: 50 * 1024 * 1024, extension: '.mp3' },
        'video/mp4': { maxSize: 50 * 1024 * 1024, extension: '.mp4' }
    };
    
    if (!allowedTypes[file.mimetype]) {
        return cb(new Error('File type not allowed'), false);
    }
    
    // Validate file signature
    if (!validateFileSignature(file.buffer, file.mimetype)) {
        return cb(new Error('File signature mismatch'), false);
    }
    
    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});
```

### Environment Variables:
```bash
# .env (создайте этот файл локально)
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tudushka_dev
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Telegram Bot API
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=generate_random_32_char_string
TELEGRAM_WEBHOOK_URL=https://tudushka.ru/api/webhook/telegram

# AI Service
PERPLEXITY_API_KEY=your_perplexity_api_key
PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online
PERPLEXITY_MAX_TOKENS=1000
PERPLEXITY_TEMPERATURE=0.7

# Security
JWT_SECRET=generate_secure_jwt_secret_64_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ENCRYPTION_KEY=generate_32_char_aes_encryption_key

# Rate Limiting (requests per hour)
RATE_LIMIT_GENERAL=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_AI_FREE=3
RATE_LIMIT_AI_PLUS=30
RATE_LIMIT_AI_PRO=1000
RATE_LIMIT_FILE_UPLOAD=20

# File Upload Limits
MAX_FILE_SIZE_FREE=10485760      # 10MB
MAX_FILE_SIZE_PLUS=20971520      # 20MB  
MAX_FILE_SIZE_PRO=52428800       # 50MB
MAX_FILES_PER_TASK_FREE=3
MAX_FILES_PER_TASK_PLUS=10
MAX_FILES_PER_TASK_PRO=50

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_for_error_tracking
HEALTH_CHECK_INTERVAL=30000

# Circuit Breaker Settings
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=60000
```

---

## 🎨 UI/UX Дизайн

### Стиль дизайна:
- **Apple-inspired** - минимализм, чистота, элегантность
- **Цветовая схема:** Светлая с акцентами синего цвета
- **Типографика:** Inter
- **Анимации:** Плавные, ненавязчивые, 0.3s ease-in-out

### Компонентная архитектура:
```css
/* Main color palette */
:root {
    --primary-blue: #007AFF;
    --secondary-gray: #F2F2F7;
    --text-primary: #000000;
    --text-secondary: #8E8E93;
    --background: #FFFFFF;
    --border: #C6C6C8;
    --success: #34C759;
    --warning: #FF9500;
    --error: #FF3B30;
    
    /* Telegram theme variables */
    --tg-theme-bg-color: var(--background);
    --tg-theme-text-color: var(--text-primary);
    --tg-theme-hint-color: var(--text-secondary);
    --tg-theme-link-color: var(--primary-blue);
    --tg-theme-button-color: var(--primary-blue);
    --tg-theme-button-text-color: #FFFFFF;
}

/* Component structure */
.task-card {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 8px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    padding: 16px;
}

.chat-bubble {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 18px;
    margin-bottom: 8px;
    word-wrap: break-word;
}

.chat-bubble--user {
    background: var(--primary-blue);
    color: white;
    margin-left: auto;
}

.chat-bubble--assistant {
    background: var(--secondary-gray);
    color: var(--text-primary);
    margin-right: auto;
}

.onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease-in-out;
}

.onboarding-overlay.active {
    opacity: 1;
    visibility: visible;
}
```

---

## 📱 Telegram Mini App Integration

### Enhanced SDK Integration:
```javascript
// frontend/js/telegram-sdk.js
class TelegramApp {
    constructor() {
        this.webapp = window.Telegram.WebApp;
        this.isReady = false;
        this.init();
    }
    
    async init() {
        try {
            // Wait for Telegram WebApp to be ready
            await this.waitForReady();
            
            // Expand to full height
            this.webapp.expand();
            
            // Configure theme
            this.configureTheme();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Configure main button
            this.webapp.MainButton.setText('Готово');
            
            this.isReady = true;
            this.dispatchEvent('telegram:ready');
            
        } catch (error) {
            console.error('Telegram WebApp initialization failed:', error);
            this.handleFallback();
        }
    }
    
    waitForReady(timeout = 3000) {
        return new Promise((resolve, reject) => {
            if (this.webapp.initDataUnsafe.user) {
                resolve();
                return;
            }
            
            const timer = setTimeout(() => {
                reject(new Error('Telegram WebApp timeout'));
            }, timeout);
            
            this.webapp.ready(() => {
                clearTimeout(timer);
                resolve();
            });
        });
    }
    
    configureTheme() {
        const themeParams = this.webapp.themeParams;
        const root = document.documentElement;
        
        if (themeParams.bg_color) {
            root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
        }
        if (themeParams.text_color) {
            root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
        }
        if (themeParams.button_color) {
            root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
        }
    }
    
    setupEventListeners() {
        // Handle back button
        this.webapp.BackButton.onClick(() => {
            this.dispatchEvent('telegram:back');
        });
        
        // Handle main button
        this.webapp.MainButton.onClick(() => {
            this.dispatchEvent('telegram:main-button');
        });
        
        // Handle viewport changes
        this.webapp.onEvent('viewportChanged', (data) => {
            this.handleViewportChange(data);
        });
        
        // Handle theme changes
        this.webapp.onEvent('themeChanged', () => {
            this.configureTheme();
        });
    }
    
    getAuthData() {
        if (!this.isReady) {
            throw new Error('Telegram WebApp not ready');
        }
        
        return {
            initData: this.webapp.initData,
            initDataUnsafe: this.webapp.initDataUnsafe,
            user: this.webapp.initDataUnsafe.user,
            hash: this.calculateHash(this.webapp.initData)
        };
    }
    
    calculateHash(initData) {
        // This should match backend validation
        const data = new URLSearchParams(initData);
        data.delete('hash');
        
        const dataCheckString = Array.from(data.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
            
        return crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(process.env.TELEGRAM_BOT_TOKEN),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        ).then(key => {
            return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataCheckString));
        }).then(signature => {
            return Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }
    
    handleFallback() {
        // Fallback for non-Telegram environments
        console.warn('Running outside Telegram WebApp');
        document.body.classList.add('non-telegram');
        this.isReady = true;
        this.dispatchEvent('telegram:fallback');
    }
    
    dispatchEvent(eventName, data = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
}
```

---

## 📎 Файловая система через Telegram

### Enhanced File Service:
```javascript
// backend/services/telegram-files.js
class TelegramFileService {
    constructor(botToken) {
        this.botToken = botToken;
        this.apiUrl = `https://api.telegram.org/bot${botToken}`;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }
    
    async uploadFile(file, userId, subscription = 'free') {
        try {
            // Validate file based on subscription
            this.validateFile(file, subscription);
            
            // Create private chat if not exists
            const chatId = await this.getOrCreatePrivateChat(userId);
            
            // Upload with retry logic
            return await this.uploadWithRetry(file, chatId);
            
        } catch (error) {
            console.error('File upload failed:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
    }
    
    validateFile(file, subscription) {
        const limits = {
            free: { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
            plus: { maxSize: 20 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'audio/mpeg'] },
            pro: { maxSize: 50 * 1024 * 1024, allowedTypes: ['*'] }
        };
        
        const limit = limits[subscription] || limits.free;
        
        if (file.size > limit.maxSize) {
            throw new Error(`File too large. Max size: ${limit.maxSize / 1024 / 1024}MB`);
        }
        
        if (limit.allowedTypes[0] !== '*' && !limit.allowedTypes.includes(file.mimetype)) {
            throw new Error(`File type not allowed: ${file.mimetype}`);
        }
        
        // Check file signature
        if (!this.validateFileSignature(file)) {
            throw new Error('File signature validation failed');
        }
    }
    
    async uploadWithRetry(file, chatId, attempt = 1) {
        try {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            
            let endpoint;
            let fileField;
            
            if (file.mimetype.startsWith('image/')) {
                endpoint = '/sendPhoto';
                fileField = 'photo';
            } else if (file.mimetype.startsWith('video/')) {
                endpoint = '/sendVideo';
                fileField = 'video';
            } else if (file.mimetype.startsWith('audio/')) {
                endpoint = '/sendAudio';
                fileField = 'audio';
            } else {
                endpoint = '/sendDocument';
                fileField = 'document';
            }
            
            formData.append(fileField, file);
            
            const response = await fetch(`${this.apiUrl}${endpoint}`, {
                method: 'POST',
                body: formData,
                timeout: 30000
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.description || 'Upload failed');
            }
            
            const result = await response.json();
            return this.extractFileId(result.result, fileField);
            
        } catch (error) {
            if (attempt < this.maxRetries) {
                await this.sleep(this.retryDelay * attempt);
                return this.uploadWithRetry(file, chatId, attempt + 1);
            }
            throw error;
        }
    }
    
    async getFileUrl(fileId) {
        try {
            const response = await fetch(`${this.apiUrl}/getFile?file_id=${fileId}`);
            const result = await response.json();
            
            if (!result.ok) {
                throw new Error(result.description);
            }
            
            return `https://api.telegram.org/file/bot${this.botToken}/${result.result.file_path}`;
            
        } catch (error) {
            console.error('Failed to get file URL:', error);
            throw new Error('File not accessible');
        }
    }
    
    validateFileSignature(file) {
        const signatures = {
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'image/png': [0x89, 0x50, 0x4E, 0x47],
            'application/pdf': [0x25, 0x50, 0x44, 0x46],
            'audio/mpeg': [0xFF, 0xFB],
            'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]
        };
        
        const signature = signatures[file.mimetype];
        if (!signature) return true; // Allow unknown types for now
        
        const header = new Uint8Array(file.buffer.slice(0, signature.length));
        return signature.every((byte, index) => header[index] === byte);
    }
    
    extractFileId(result, fileField) {
        if (fileField === 'photo') {
            // Get largest photo size
            return result.photo[result.photo.length - 1].file_id;
        }
        return result[fileField].file_id;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async getOrCreatePrivateChat(userId) {
        // For file storage, we use a private channel or group
        // This should be configured per user or use a shared storage channel
        return process.env.TELEGRAM_STORAGE_CHAT_ID || `-100${userId}`;
    }
}
```

---

## 🤖 AI Integration (Perplexity)

### Enhanced AI Service with Circuit Breaker:
```javascript
// backend/services/perplexity-api.js
const CircuitBreaker = require('./circuitBreaker');

class PerplexityService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.perplexity.ai/chat/completions';
        this.circuitBreaker = new CircuitBreaker({
            failureThreshold: 5,
            recoveryTimeout: 60000,
            monitorTimeout: 30000
        });
    }
    
    async sendMessage(messages, userLanguage = 'ru', userId = null) {
        try {
            return await this.circuitBreaker.execute(() => 
                this.makeAPICall(messages, userLanguage, userId)
            );
        } catch (error) {
            console.error('Perplexity API error:', error);
            
            // Fallback response when API is down
            if (this.circuitBreaker.isOpen()) {
                return this.getFallbackResponse(userLanguage);
            }
            
            throw error;
        }
    }
    
    async makeAPICall(messages, userLanguage, userId) {
        const systemPrompt = this.getSystemPrompt(userLanguage);
        
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': `Tudushka/1.0 (User: ${userId || 'anonymous'})`
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.slice(-10) // Keep only last 10 messages for context
                ],
                max_tokens: 1000,
                temperature: 0.7,
                top_p: 0.9,
                stream: false
            }),
            timeout: 30000
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API Error ${response.status}: ${error.message || 'Unknown error'}`);
        }
        
        const result = await response.json();
        
        if (!result.choices || !result.choices[0]) {
            throw new Error('Invalid API response format');
        }
        
        // Track usage
        if (result.usage && userId) {
            await this.trackTokenUsage(userId, result.usage.total_tokens);
        }
        
        return result.choices[0].message.content;
    }
    
    getSystemPrompt(language) {
        const prompts = {
            ru: `Ты полезный AI-ассистент для планирования задач и повышения продуктивности. 
                 Отвечай кратко и по делу на русском языке. 
                 Помогай пользователю организовать его дела и давай практические советы.
                 Если пользователь описывает задачи, предлагай конкретные шаги для их выполнения.
                 Используй эмодзи для улучшения восприятия, но умеренно.`,
                 
            en: `You are a helpful AI assistant for task planning and productivity. 
                 Reply concisely and to the point in English. 
                 Help users organize their tasks and provide practical advice.
                 If users describe tasks, suggest specific steps to complete them.
                 Use emojis to improve readability, but moderately.`
        };
        
        return prompts[language] || prompts.ru;
    }
    
    getFallbackResponse(language) {
        const fallbacks = {
            ru: 'Извините, AI-помощник временно недоступен. Попробуйте позже. 🤖',
            en: 'Sorry, AI assistant is temporarily unavailable. Please try again later. 🤖'
        };
        
        return fallbacks[language] || fallbacks.ru;
    }
    
    async trackTokenUsage(userId, tokens) {
        // This would integrate with your usage tracking system
        console.log(`User ${userId} used ${tokens} tokens`);
        // TODO: Update usage_stats table
    }
    
    // Future: extract tasks from AI response
    async extractTasksFromResponse(aiResponse) {
        const taskPatterns = [
            /(?:создать|сделать|выполнить|задача)[\s:]+(.*?)(?:\.|$)/gi,
            /(?:need to|should|must|task)[\s:]+(.*?)(?:\.|$)/gi
        ];
        
        const extractedTasks = [];
        
        for (const pattern of taskPatterns) {
            let match;
            while ((match = pattern.exec(aiResponse)) !== null) {
                extractedTasks.push({
                    title: match[1].trim(),
                    description: '',
                    created_by_ai: true,
                    ai_context: aiResponse
                });
            }
        }
        
        return extractedTasks;
    }
}
```

### Circuit Breaker Implementation:
```javascript
// backend/utils/circuitBreaker.js
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 60000;
        this.monitorTimeout = options.monitorTimeout || 30000;
        
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.nextAttempt = Date.now();
        this.successCount = 0;
    }
    
    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
            this.successCount = 0;
        }
        
        try {
            const result = await operation();
            return this.onSuccess(result);
        } catch (error) {
            return this.onFailure(error);
        }
    }
    
    onSuccess(result) {
        this.failureCount = 0;
        
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= 3) {
                this.state = 'CLOSED';
            }
        }
        
        return result;
    }
    
    onFailure(error) {
        this.failureCount++;
        
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.recoveryTimeout;
        }
        
        throw error;
    }
    
    isOpen() {
        return this.state === 'OPEN';
    }
    
    getStatus() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            nextAttempt: this.nextAttempt,
            successCount: this.successCount
        };
    }
}

module.exports = CircuitBreaker;
```

---

## 🌍 Интернационализация

### Enhanced Translation System:
```javascript
// frontend/js/translations.js
class TranslationManager {
    constructor() {
        this.currentLanguage = 'ru';
        this.translations = TRANSLATIONS;
        this.pluralRules = {
            ru: this.russianPluralization,
            en: this.englishPluralization
        };
        this.dateFormatters = {
            ru: new Intl.DateTimeFormat('ru-RU'),
            en: new Intl.DateTimeFormat('en-US')
        };
        this.init();
    }
    
    init() {
        // Auto-detect language
        this.currentLanguage = this.detectLanguage();
        
        // Set document language
        document.documentElement.lang = this.currentLanguage;
        
        // Update page direction if needed (future RTL support)
        document.documentElement.dir = this.getTextDirection(this.currentLanguage);
    }
    
    detectLanguage() {
        // 1. Check saved preference
        const saved = localStorage.getItem('tudushka_language');
        if (saved && this.translations[saved]) return saved;
        
        // 2. Check Telegram user language
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
            const tgLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
            if (this.translations[tgLang]) return tgLang;
        }
        
        // 3. Check browser language
        const browserLang = navigator.language.split('-')[0];
        if (this.translations[browserLang]) return browserLang;
        
        // 4. Default fallback
        return 'ru';
    }
    
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }
        
        // Fallback to Russian if translation missing
        if (value === undefined && this.currentLanguage !== 'ru') {
            value = this.translations.ru;
            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) break;
            }
        }
        
        // Final fallback to key itself
        if (value === undefined) {
            console.warn(`Missing translation for key: ${key}`);
            return key;
        }
        
        // Handle pluralization
        if (params.count !== undefined) {
            return this.pluralize(value, params.count, this.currentLanguage);
        }
        
        // Parameter substitution
        return this.substituteParams(value, params);
    }
    
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`Language ${lang} not supported`);
            return;
        }
        
        this.currentLanguage = lang;
        localStorage.setItem('tudushka_language', lang);
        document.documentElement.lang = lang;
        
        // Trigger UI update
        this.dispatchLanguageChange();
    }
    
    pluralize(value, count, language) {
        if (typeof value === 'string') return value;
        
        const pluralRule = this.pluralRules[language];
        const form = pluralRule ? pluralRule(count) : 0;
        
        return value[form] || value[0] || '';
    }
    
    russianPluralization(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;
        
        if (mod10 === 1 && mod100 !== 11) return 0; // 1, 21, 31, ...
        if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 1; // 2-4, 22-24, ...
        return 2; // 0, 5-20, 25-30, ...
    }
    
    englishPluralization(count) {
        return count === 1 ? 0 : 1;
    }
    
    substituteParams(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }
    
    formatDate(date, style = 'medium') {
        return this.dateFormatters[this.currentLanguage].format(date);
    }
    
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return this.t('time.just_now');
        if (minutes < 60) return this.t('time.minutes_ago', { count: minutes });
        if (hours < 24) return this.t('time.hours_ago', { count: hours });
        if (days < 7) return this.t('time.days_ago', { count: days });
        
        return this.formatDate(date);
    }
    
    getTextDirection(language) {
        // Future RTL support
        const rtlLanguages = ['ar', 'he', 'fa'];
        return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    }
    
    dispatchLanguageChange() {
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Enhanced translations with more complete coverage
const TRANSLATIONS = {
    ru: {
        // Navigation
        navigation: {
            today: 'Сегодня',
            week: 'Неделя',
            month: 'Месяц',
            ai_assistant: 'AI Ассистент',
            archive: 'Архив',
            settings: 'Настройки'
        },
        
        // Tasks
        tasks: {
            add_task: 'Добавить задачу',
            edit_task: 'Редактировать задачу',
            task_title: 'Название задачи',
            task_description: 'Описание',
            due_date: 'Срок выполнения',
            due_time: 'Время',
            mark_completed: 'Отметить выполненной',
            delete_task: 'Удалить задачу',
            no_tasks: 'Нет задач на сегодня',
            overdue: 'Просрочено',
            completed: 'Выполнено',
            
            // Repeat options
            repeat_none: 'Не повторять',
            repeat_daily: 'Каждый день',
            repeat_weekly: 'Каждую неделю',
            repeat_monthly: 'Каждый месяц',
            repeat_yearly: 'Каждый год',
            
            // Validation
            title_required: 'Название задачи обязательно',
            title_too_long: 'Название слишком длинное (макс. 255 символов)'
        },
        
        // AI Chat
        ai: {
            type_message: 'Напишите сообщение...',
            new_chat: 'Новый чат',
            messages_left: ['осталось {{count}} сообщение', 'осталось {{count}} сообщения', 'осталось {{count}} сообщений'],
            ai_thinking: 'AI печатает...',
            send_message: 'Отправить',
            delete_chat: 'Удалить чат',
            no_chats: 'У вас пока нет чатов',
            limit_reached: 'Лимит сообщений исчерпан',
            upgrade_needed: 'Для продолжения нужно улучшить план'
        },
        
        // Files
        files: {
            upload_files: 'Загрузить файлы',
            drag_drop: 'Перетащите файлы или выберите',
            file_too_large: 'Файл слишком большой (макс. {{max}}MB)',
            unsupported_format: 'Неподдерживаемый формат файла',
            upload_failed: 'Ошибка загрузки',
            upload_success: 'Файл успешно загружен',
            download: 'Скачать',
            preview: 'Предпросмотр',
            delete_file: 'Удалить файл',
            files_limit_reached: 'Достигнут лимит файлов для этого плана'
        },
        
        // Settings
        settings: {
            profile: 'Профиль',
            first_name: 'Имя',
            last_name: 'Фамилия',
            birth_date: 'Дата рождения',
            language: 'Язык',
            subscription: 'Подписка',
            delete_account: 'Удалить аккаунт',
            save_changes: 'Сохранить изменения',
            changes_saved: 'Изменения сохранены'
        },
        
        // Subscription
        subscription: {
            free_plan: 'Бесплатный',
            plus_plan: 'Plus',
            pro_plan: 'Pro',
            upgrade: 'Улучшить план',
            current_plan: 'Текущий план',
            expires: 'Истекает',
            messages_limit: 'лимит сообщений',
            files_limit: 'лимит файлов',
            features: 'Возможности',
            choose_plan: 'Выберите план'
        },
        
        // Time
        time: {
            just_now: 'только что',
            minutes_ago: ['{{count}} минуту назад', '{{count}} минуты назад', '{{count}} минут назад'],
            hours_ago: ['{{count}} час назад', '{{count}} часа назад', '{{count}} часов назад'],
            days_ago: ['{{count}} день назад', '{{count}} дня назад', '{{count}} дней назад']
        },
        
        // Common
        common: {
            save: 'Сохранить',
            cancel: 'Отмена',
            delete: 'Удалить',
            edit: 'Редактировать',
            loading: 'Загрузка...',
            error: 'Ошибка',
            success: 'Успешно',
            confirm: 'Подтвердить',
            yes: 'Да',
            no: 'Нет',
            close: 'Закрыть',
            month: 'месяц'
        },
        
        // Error messages
        errors: {
            network_error: 'Ошибка сети. Проверьте подключение к интернету.',
            server_error: 'Ошибка сервера. Попробуйте позже.',
            auth_error: 'Ошибка авторизации. Перезагрузите приложение.',
            validation_error: 'Проверьте правильность заполнения полей',
            file_upload_error: 'Ошибка загрузки файла: {{error}}',
            ai_service_error: 'AI сервис временно недоступен'
        }
    },
    
    en: {
        // Navigation
        navigation: {
            today: 'Today',
            week: 'Week',
            month: 'Month',
            ai_assistant: 'AI Assistant',
            archive: 'Archive',
            settings: 'Settings'
        },
        
        // Tasks
        tasks: {
            add_task: 'Add Task',
            edit_task: 'Edit Task',
            task_title: 'Task title',
            task_description: 'Description',
            due_date: 'Due date',
            due_time: 'Time',
            mark_completed: 'Mark as completed',
            delete_task: 'Delete task',
            no_tasks: 'No tasks for today',
            overdue: 'Overdue',
            completed: 'Completed',
            
            // Repeat options
            repeat_none: 'Don\'t repeat',
            repeat_daily: 'Every day',
            repeat_weekly: 'Every week',
            repeat_monthly: 'Every month',
            repeat_yearly: 'Every year',
            
            // Validation
            title_required: 'Task title is required',
            title_too_long: 'Title too long (max 255 characters)'
        },
        
        // AI Chat
        ai: {
            type_message: 'Type a message...',
            new_chat: 'New Chat',
            messages_left: ['{{count}} message left', '{{count}} messages left'],
            ai_thinking: 'AI is typing...',
            send_message: 'Send',
            delete_chat: 'Delete chat',
            no_chats: 'You have no chats yet',
            limit_reached: 'Message limit reached',
            upgrade_needed: 'Upgrade needed to continue'
        },
        
        // Files
        files: {
            upload_files: 'Upload files',
            drag_drop: 'Drag files here or click to select',
            file_too_large: 'File too large (max {{max}}MB)',
            unsupported_format: 'Unsupported file format',
            upload_failed: 'Upload failed',
            upload_success: 'File uploaded successfully',
            download: 'Download',
            preview: 'Preview',
            delete_file: 'Delete file',
            files_limit_reached: 'File limit reached for this plan'
        },
        
        // Settings
        settings: {
            profile: 'Profile',
            first_name: 'First name',
            last_name: 'Last name',
            birth_date: 'Birth date',
            language: 'Language',
            subscription: 'Subscription',
            delete_account: 'Delete account',
            save_changes: 'Save changes',
            changes_saved: 'Changes saved'
        },
        
        // Subscription
        subscription: {
            free_plan: 'Free',
            plus_plan: 'Plus',
            pro_plan: 'Pro',
            upgrade: 'Upgrade',
            current_plan: 'Current plan',
            expires: 'Expires',
            messages_limit: 'message limit',
            files_limit: 'file limit',
            features: 'Features',
            choose_plan: 'Choose plan'
        },
        
        // Time
        time: {
            just_now: 'just now',
            minutes_ago: ['{{count}} minute ago', '{{count}} minutes ago'],
            hours_ago: ['{{count}} hour ago', '{{count}} hours ago'],
            days_ago: ['{{count}} day ago', '{{count}} days ago']
        },
        
        // Common
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            confirm: 'Confirm',
            yes: 'Yes',
            no: 'No',
            close: 'Close',
            month: 'month'
        },
        
        // Error messages
        errors: {
            network_error: 'Network error. Please check your internet connection.',
            server_error: 'Server error. Please try again later.',
            auth_error: 'Authentication error. Please reload the app.',
            validation_error: 'Please check the form fields',
            file_upload_error: 'File upload error: {{error}}',
            ai_service_error: 'AI service is temporarily unavailable'
        }
    }
};

// Initialize global translation instance
window.i18n = new TranslationManager();
window.t = (key, params) => window.i18n.t(key, params);
```

---

## 🚀 Развертывание

### Enhanced Production Configuration:

#### Docker Configuration:
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: tudushka_prod
      POSTGRES_USER: tudushka
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./frontend:/usr/share/nginx/html
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Enhanced Nginx Configuration:
```nginx
# Enhanced nginx.conf with better security and performance
user nginx;
worker_processes auto;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Main server configuration
    server {
        listen 443 ssl http2;
        server_name tudushka.ru;
        
        ssl_certificate /etc/ssl/certs/tudushka.ru.crt;
        ssl_certificate_key /etc/ssl/certs/tudushka.ru.key;
        
        # HSTS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # CSP
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.telegram.org https://api.perplexity.ai; font-src 'self' data:;" always;
        
        root /usr/share/nginx/html;
        index index.html;
        
        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary "Accept-Encoding";
        }
        
        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 60s;
            proxy_connect_timeout 60s;
        }
        
        # Auth endpoints with stricter limits
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # File upload endpoints
        location /api/files/ {
            limit_req zone=upload burst=3 nodelay;
            client_max_body_size 50M;
            proxy_pass http://app:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
        }
        
        # Telegram webhook
        location /api/webhook/telegram {
            allow 149.154.160.0/20;
            allow 91.108.4.0/22;
            deny all;
            
            proxy_pass http://app:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://app:3001;
            access_log off;
        }
        
        # Frontend SPA routing
        location / {
            try_files $uri $uri/ /index.html;
            
            # Security headers for HTML
            location ~ \.html$ {
                add_header Cache-Control "no-cache, no-store, must-revalidate";
                add_header Pragma "no-cache";
                add_header Expires "0";
            }
        }
        
        # Block access to sensitive files
        location ~ /\.(ht|git|env) {
            deny all;
        }
        
        # Custom error pages
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
        
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
    
    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name tudushka.ru www.tudushka.ru;
        return 301 https://tudushka.ru$request_uri;
    }
    
    # WWW redirect
    server {
        listen 443 ssl http2;
        server_name www.tudushka.ru;
        ssl_certificate /etc/ssl/certs/tudushka.ru.crt;
        ssl_certificate_key /etc/ssl/certs/tudushka.ru.key;
        return 301 https://tudushka.ru$request_uri;
    }
}
```

---

## 📊 Мониторинг и производительность

### Enhanced Monitoring System:
```javascript
// backend/utils/logger.js
const winston = require('winston');
const path = require('path');

class Logger {
    constructor() {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'tudushka-api' },
            transports: [
                // Console output
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                
                // File outputs
                new winston.transports.File({ 
                    filename: path.join(process.env.LOG_DIR || './logs', 'error.log'), 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: path.join(process.env.LOG_DIR || './logs', 'combined.log') 
                })
            ]
        });
    }
    
    info(message, meta = {}) {
        this.logger.info(message, { ...meta, timestamp: new Date().toISOString() });
    }
    
    error(message, error = null, meta = {}) {
        this.logger.error(message, {
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null,
            ...meta,
            timestamp: new Date().toISOString()
        });
    }
    
    warn(message, meta = {}) {
        this.logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
    }
    
    debug(message, meta = {}) {
        this.logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
    }
    
    // Request logging middleware
    requestLogger() {
        return (req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const logData = {
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    userId: req.user?.id || null
                };
                
                if (res.statusCode >= 400) {
                    this.warn('HTTP Error', logData);
                } else {
                    this.info('HTTP Request', logData);
                }
            });
            
            next();
        };
    }
}

module.exports = new Logger();
```

### Performance Monitoring:
```javascript
// backend/utils/metrics.js
class MetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.startTime = Date.now();
    }
    
    // Request duration tracking
    trackRequestDuration(endpoint, duration) {
        const key = `request_duration_${endpoint}`;
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }
        this.metrics.get(key).push(duration);
        
        // Keep only last 1000 measurements
        const measurements = this.metrics.get(key);
        if (measurements.length > 1000) {
            measurements.splice(0, measurements.length - 1000);
        }
    }
    
    // Error rate tracking
    trackError(endpoint, errorType) {
        const key = `error_${endpoint}_${errorType}`;
        this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    }
    
    // User activity tracking
    trackUserActivity(userId, action) {
        const key = `user_activity_${action}`;
        const today = new Date().toISOString().split('T')[0];
        const dailyKey = `${key}_${today}`;
        
        if (!this.metrics.has(dailyKey)) {
            this.metrics.set(dailyKey, new Set());
        }
        this.metrics.get(dailyKey).add(userId);
    }
    
    // AI API usage tracking
    trackAIUsage(userId, tokens, responseTime) {
        this.metrics.set('ai_tokens_total', (this.metrics.get('ai_tokens_total') || 0) + tokens);
        this.trackRequestDuration('ai_api', responseTime);
    }
    
    // File upload tracking
    trackFileUpload(userId, fileSize, fileType, success) {
        this.metrics.set('files_uploaded_total', (this.metrics.get('files_uploaded_total') || 0) + 1);
        this.metrics.set('files_size_total', (this.metrics.get('files_size_total') || 0) + fileSize);
        
        if (!success) {
            this.trackError('file_upload', 'failed');
        }
    }
    
    // Get metrics summary
    getSummary() {
        const now = Date.now();
        const uptime = Math.floor((now - this.startTime) / 1000);
        
        return {
            uptime,
            timestamp: new Date().toISOString(),
            requests: this.getRequestMetrics(),
            errors: this.getErrorMetrics(),
            users: this.getUserMetrics(),
            ai: this.getAIMetrics(),
            files: this.getFileMetrics(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };
    }
    
    getRequestMetrics() {
        const metrics = {};
        for (const [key, values] of this.metrics.entries()) {
            if (key.startsWith('request_duration_') && Array.isArray(values)) {
                const endpoint = key.replace('request_duration_', '');
                metrics[endpoint] = {
                    count: values.length,
                    avg: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values)
                };
            }
        }
        return metrics;
    }
    
    getErrorMetrics() {
        const errors = {};
        for (const [key, count] of this.metrics.entries()) {
            if (key.startsWith('error_')) {
                errors[key.replace('error_', '')] = count;
            }
        }
        return errors;
    }
    
    getUserMetrics() {
        const today = new Date().toISOString().split('T')[0];
        const dailyActiveUsers = this.metrics.get(`user_activity_login_${today}`)?.size || 0;
        
        return {
            dailyActiveUsers,
            totalUsers: this.metrics.get('users_total') || 0
        };
    }
    
    getAIMetrics() {
        return {
            totalTokens: this.metrics.get('ai_tokens_total') || 0,
            totalRequests: this.metrics.get('request_duration_ai_api')?.length || 0
        };
    }
    
    getFileMetrics() {
        return {
            totalUploads: this.metrics.get('files_uploaded_total') || 0,
            totalSize: this.metrics.get('files_size_total') || 0
        };
    }
    
    // Reset daily metrics (call via cron)
    resetDailyMetrics() {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        for (const key of this.metrics.keys()) {
            if (key.includes(yesterday)) {
                this.metrics.delete(key);
            }
        }
    }
}

module.exports = new MetricsCollector();
```

### Health Check System:
```javascript
// backend/utils/healthCheck.js
const { Pool } = require('pg');
const Redis = require('redis');

class HealthChecker {
    constructor() {
        this.checks = new Map();
        this.lastResults = new Map();
    }
    
    // Register health check
    register(name, checkFunction, timeout = 5000) {
        this.checks.set(name, { checkFunction, timeout });
    }
    
    // Run all health checks
    async runAll() {
        const results = new Map();
        const promises = [];
        
        for (const [name, { checkFunction, timeout }] of this.checks) {
            promises.push(
                this.runSingleCheck(name, checkFunction, timeout)
                    .then(result => results.set(name, result))
                    .catch(error => results.set(name, {
                        status: 'unhealthy',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }))
            );
        }
        
        await Promise.all(promises);
        this.lastResults = results;
        
        return this.getOverallHealth();
    }
    
    async runSingleCheck(name, checkFunction, timeout) {
        const start = Date.now();
        
        try {
            const result = await Promise.race([
                checkFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Health check timeout')), timeout)
                )
            ]);
            
            return {
                status: 'healthy',
                responseTime: Date.now() - start,
                data: result,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    getOverallHealth() {
        const results = Array.from(this.lastResults.values());
        const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
        
        let overallStatus;
        if (unhealthyCount === 0) {
            overallStatus = 'healthy';
        } else if (unhealthyCount < results.length / 2) {
            overallStatus = 'degraded';
        } else {
            overallStatus = 'unhealthy';
        }
        
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: Object.fromEntries(this.lastResults),
            summary: {
                total: results.length,
                healthy: results.filter(r => r.status === 'healthy').length,
                unhealthy: unhealthyCount
            }
        };
    }
}

// Initialize health checker with standard checks
const healthChecker = new HealthChecker();

// Database health check
healthChecker.register('database', async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const result = await pool.query('SELECT 1 as healthy');
        await pool.end();
        return { connected: true, query: result.rows[0] };
    } catch (error) {
        await pool.end();
        throw error;
    }
});

// Redis health check
healthChecker.register('redis', async () => {
    const redis = Redis.createClient({ url: process.env.REDIS_URL });
    try {
        await redis.connect();
        await redis.ping();
        await redis.disconnect();
        return { connected: true };
    } catch (error) {
        await redis.disconnect();
        throw error;
    }
});

// Perplexity API health check
healthChecker.register('perplexity_api', async () => {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
        })
    });
    
    if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
    }
    
    return { status: response.status, available: true };
});

// Telegram API health check
healthChecker.register('telegram_api', async () => {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
    const result = await response.json();
    
    if (!result.ok) {
        throw new Error(result.description);
    }
    
    return { bot: result.result.username, available: true };
});

module.exports = healthChecker;
```

---

## 💰 Экономическая модель

### Детальные расходы (в месяц):
```javascript
// Monthly costs breakdown
const monthlyCosts = {
    // Infrastructure
    vps: 1090, // 2 CPU, 2GB RAM, timeweb.cloud
    domain: 100, // .ru domain
    ssl: 0, // Let's Encrypt (free)
    backup_storage: 200, // Additional backup space
    
    // APIs
    perplexity_base: 20 * 30, // $20/month base
    perplexity_usage: 0, // Variable based on usage
    telegram_api: 0, // Free
    
    // Monitoring & Tools
    sentry: 0, // Free tier
    uptime_monitoring: 500, // External monitoring service
    
    // Development & Maintenance
    development_tools: 300, // Various dev tools
    maintenance_reserve: 500, // Bug fixes, updates
    
    total: function() {
        return Object.values(this).reduce((sum, cost) => 
            typeof cost === 'number' ? sum + cost : sum, 0
        );
    }
};

// Revenue projections with realistic conversion rates
const revenueModel = {
    userGrowth: {
        month1: 100,
        month2: 300,
        month3: 600,
        month6: 1500,
        month12: 5000
    },
    
    conversionRates: {
        freeToPlus: 0.08, // 8% conversion (realistic for B2C SaaS)
        freeToRro: 0.02, // 2% conversion to premium
        churnRate: 0.15 // 15% monthly churn
    },
    
    pricing: {
        plus: 149,
        pro: 299
    },
    
    calculateRevenue(totalUsers) {
        const plusUsers = Math.floor(totalUsers * this.conversionRates.freeToPlus);
        const proUsers = Math.floor(totalUsers * this.conversionRates.freeToRro);
        
        return {
            plus: plusUsers * this.pricing.plus,
            pro: proUsers * this.pricing.pro,
            total: plusUsers * this.pricing.plus + proUsers * this.pricing.pro,
            breakdown: { plusUsers, proUsers, freeUsers: totalUsers - plusUsers - proUsers }
        };
    }
};
```

### Break-even Analysis:
```javascript
// Break-even calculation
const breakEvenAnalysis = {
    fixedCosts: monthlyCosts.total(),
    variableCostPerUser: 15, // AI API costs per active user
    
    calculateBreakEven() {
        const avgRevenuePerPaidUser = (149 * 0.8 + 299 * 0.2); // Weighted average
        const contribution = avgRevenuePerPaidUser - this.variableCostPerUser;
        
        return {
            breakEvenUsers: Math.ceil(this.fixedCosts / contribution),
            breakEvenRevenue: this.fixedCosts,
            contributionMargin: (contribution / avgRevenuePerPaidUser * 100).toFixed(1) + '%'
        };
    }
};
```

---

## 🔄 Будущие возможности (v2+)

### Technical Architecture for Future Features:
```javascript
// Future feature architecture planning
const futureFeatures = {
    v2: {
        // AI-powered task creation from text
        aiTaskExtraction: {
            implementation: 'Enhanced NLP processing of user messages',
            dependencies: ['OpenAI GPT-4 API', 'Custom training data'],
            estimatedDevelopment: '2-3 weeks'
        },
        
        // Voice input via Speech-to-Text
        voiceInput: {
            implementation: 'Web Speech API + fallback to cloud STT',
            dependencies: ['Browser compatibility layer', 'Audio processing'],
            estimatedDevelopment: '1-2 weeks'
        },
        
        // Smart notifications via Telegram Bot
        smartNotifications: {
            implementation: 'Cron jobs + ML-based timing optimization',
            dependencies: ['Telegram Bot API', 'User behavior tracking'],
            estimatedDevelopment: '2 weeks'
        }
    },
    
    v3: {
        // Team collaboration
        teamFeatures: {
            implementation: 'Shared workspaces, real-time sync',
            dependencies: ['WebSocket implementation', 'Permission system'],
            estimatedDevelopment: '4-6 weeks'
        },
        
        // Calendar integrations
        calendarSync: {
            implementation: 'Google Calendar, Outlook, iCal APIs',
            dependencies: ['OAuth2 flows', 'Sync conflict resolution'],
            estimatedDevelopment: '3-4 weeks'
        },
        
        // Advanced analytics
        productivityAnalytics: {
            implementation: 'Dashboard with charts, insights',
            dependencies: ['Chart.js/D3.js', 'Data aggregation pipelines'],
            estimatedDevelopment: '3 weeks'
        }
    }
};

// Database schema preparation for future features
const futureSchemaAdditions = `
-- Voice messages table
CREATE TABLE voice_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    telegram_file_id VARCHAR(200),
    transcription TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team workspaces
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workspace members
CREATE TABLE workspace_members (
    workspace_id INTEGER REFERENCES workspaces(id),
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    type VARCHAR(50), -- 'reminder', 'overdue', 'completed', 'shared'
    title VARCHAR(255),
    message TEXT,
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User productivity analytics
CREATE TABLE productivity_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE,
    tasks_completed INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    focus_time_minutes INTEGER DEFAULT 0,
    ai_interactions INTEGER DEFAULT 0,
    productivity_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);
`;
```

---

## 📈 Метрики успеха и KPI

### Technical KPIs:
```javascript
const technicalKPIs = {
    performance: {
        pageLoadTime: { target: '<2s', critical: '<3s' },
        apiResponseTime: { target: '<500ms', critical: '<1s' },
        uptimePercentage: { target: '99.9%', critical: '99.5%' },
        errorRate: { target: '<0.1%', critical: '<1%' }
    },
    
    scalability: {
        concurrentUsers: { target: '1000+', critical: '500+' },
        databaseConnections: { target: '<50%', critical: '<80%' },
        memoryUsage: { target: '<70%', critical: '<90%' },
        cpuUsage: { target: '<60%', critical: '<80%' }
    },
    
    reliability: {
        backupSuccess: { target: '100%', critical: '99%' },
        migrationSuccess: { target: '100%', critical: '100%' },
        dataIntegrity: { target: '100%', critical: '100%' }
    }
};

const businessKPIs = {
    userEngagement: {
        dailyActiveUsers: { month1: 50, month6: 500, month12: 2000 },
        sessionDuration: { target: '5+ min', critical: '3+ min' },
        tasksPerUser: { target: '10+ per month', critical: '5+ per month' },
        retentionRate7Day: { target: '40%', critical: '25%' },
        retentionRate30Day: { target: '20%', critical: '10%' }
    },
    
    monetization: {
        conversionRate: { target: '10%', critical: '5%' },
        monthlyChurn: { target: '<15%', critical: '<25%' },
        avgRevenuePerUser: { target: '50₽', critical: '30₽' },
        customerLifetimeValue: { target: '1000₽', critical: '500₽' }
    },
    
    aiUsage: {
        messagesPerUserPerDay: { free: 2, plus: 15, pro: 50 },
        aiResponseQuality: { target: '4.5/5', critical: '4.0/5' },
        aiServiceUptime: { target: '99%', critical: '95%' }
    }
};
```

---

## 🔒 Безопасность

### Advanced Security Measures:
```javascript
// backend/middleware/security.js (enhanced)
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

const securityConfig = {
    // Advanced rate limiting with different tiers
    rateLimits: {
        general: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: (req) => {
                if (req.user?.subscription_plan === 'pro') return 1000;
                if (req.user?.subscription_plan === 'plus') return 500;
                return 100; // free tier
            },
            message: 'Too many requests from this IP',
            standardHeaders: true,
            legacyHeaders: false
        }),
        
        auth: rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 10,
            skipSuccessfulRequests: true,
            message: 'Too many auth attempts'
        }),
        
        ai: rateLimit({
            windowMs: 24 * 60 * 60 * 1000, // 24 hours
            max: (req) => {
                const plan = req.user?.subscription_plan || 'free';
                return { free: 3, plus: 30, pro: 1000 }[plan];
            },
            keyGenerator: (req) => req.user?.id || req.ip,
            message: 'Daily AI message limit exceeded'
        })
    },
    
    // Request slowdown for suspicious activity
    slowDown: slowDown({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 50, // allow 50 requests per windowMs without delay
        delayMs: 500, // add 500ms delay per request after delayAfter
        maxDelayMs: 20000, // max 20 second delay
    }),
    
    // Enhanced helmet configuration
    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for Telegram SDK
                    "https://telegram.org",
                    "https://t.me"
                ],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: [
                    "'self'", 
                    "data:", 
                    "https:",
                    "https://api.telegram.org" // For file previews
                ],
                connectSrc: [
                    "'self'",
                    "https://api.telegram.org",
                    "https://api.perplexity.ai"
                ],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'", "https://api.telegram.org"],
                frameSrc: ["'none'"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    })
};

// Input validation and sanitization
const validator = require('validator');

const sanitizeInput = {
    text: (input, maxLength = 1000) => {
        if (typeof input !== 'string') return '';
        return validator.escape(input.trim()).substring(0, maxLength);
    },
    
    email: (input) => {
        return validator.isEmail(input) ? validator.normalizeEmail(input) : null;
    },
    
    telegramId: (input) => {
        const id = parseInt(input);
        return (id > 0 && id < Number.MAX_SAFE_INTEGER) ? id : null;
    },
    
    filename: (input) => {
        if (typeof input !== 'string') return 'unnamed';
        return input.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 255);
    }
};

module.exports = { securityConfig, sanitizeInput };
```

### Data Privacy and GDPR Compliance:
```javascript
// backend/services/privacy.js
class PrivacyService {
    // Export user data (GDPR Article 20)
    async exportUserData(userId) {
        const userData = await User.findById(userId);
        const tasks = await Task.findByUserId(userId);
        const chats = await Chat.findByUserId(userId);
        const attachments = await Attachment.findByUserId(userId);
        
        return {
            personal_data: {
                telegram_id: userData.telegram_id,
                first_name: userData.first_name,
                last_name: userData.last_name,
                username: userData.username,
                language: userData.language,
                created_at: userData.created_at
            },
            tasks: tasks.map(task => ({
                title: task.title,
                description: task.description,
                completed: task.completed,
                created_at: task.created_at
            })),
            ai_chats: chats.map(chat => ({
                title: chat.title,
                messages: chat.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    created_at: msg.created_at
                }))
            })),
            file_attachments: attachments.map(att => ({
                original_name: att.original_name,
                file_type: att.file_type,
                created_at: att.created_at
            })),
            export_date: new Date().toISOString()
        };
    }
    
    // Delete user data (GDPR Article 17)
    async deleteUserData(userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Delete in correct order (foreign key constraints)
            await client.query('DELETE FROM ai_messages WHERE chat_id IN (SELECT id FROM ai_chats WHERE user_id = $1)', [userId]);
            await client.query('DELETE FROM ai_chats WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE user_id = $1)', [userId]);
            await client.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM usage_stats WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            
            await client.query('COMMIT');
            
            // Log the deletion for audit purposes
            logger.info('User data deleted', { userId, timestamp: new Date().toISOString() });
            
            return { success: true, deletedAt: new Date().toISOString() };
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to delete user data', error, { userId });
            throw new Error('Data deletion failed');
        } finally {
            client.release();
        }
    }
    
    // Anonymize user data (alternative to deletion)
    async anonymizeUserData(userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Replace personal data with anonymized values
            await client.query(`
                UPDATE users 
                SET username = 'anonymous_' || id,
                    first_name = 'Anonymous',
                    last_name = 'User',
                    telegram_id = -id,
                    updated_at = NOW()
                WHERE id = $1
            `, [userId]);
            
            // Anonymize AI chat content
            await client.query(`
                UPDATE ai_messages 
                SET content = '[ANONYMIZED]'
                WHERE chat_id IN (SELECT id FROM ai_chats WHERE user_id = $1)
                AND role = 'user'
            `, [userId]);
            
            // Anonymize task content
            await client.query(`
                UPDATE tasks 
                SET title = 'Anonymous Task',
                    description = '[ANONYMIZED]',
                    ai_context = NULL
                WHERE user_id = $1
            `, [userId]);
            
            await client.query('COMMIT');
            
            logger.info('User data anonymized', { userId });
            return { success: true, anonymizedAt: new Date().toISOString() };
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to anonymize user data', error, { userId });
            throw error;
        } finally {
            client.release();
        }
    }
    
    // Data retention policy enforcement
    async enforceDataRetention() {
        const client = await pool.connect();
        
        try {
            // Delete inactive users after 2 years
            const inactiveThreshold = new Date();
            inactiveThreshold.setFullYear(inactiveThreshold.getFullYear() - 2);
            
            const result = await client.query(`
                SELECT id FROM users 
                WHERE updated_at < $1 
                AND subscription_plan = 'free'
                LIMIT 100
            `, [inactiveThreshold]);
            
            for (const user of result.rows) {
                await this.anonymizeUserData(user.id);
            }
            
            // Clean old usage stats (keep only 1 year)
            const statsThreshold = new Date();
            statsThreshold.setFullYear(statsThreshold.getFullYear() - 1);
            
            await client.query('DELETE FROM usage_stats WHERE date < $1', [statsThreshold]);
            
            logger.info('Data retention policy enforced', { 
                usersProcessed: result.rows.length,
                statsCleanedBefore: statsThreshold
            });
            
        } catch (error) {
            logger.error('Data retention enforcement failed', error);
        } finally {
            client.release();
        }
    }
}

module.exports = new PrivacyService();
```

---

## 🧪 Тестирование

### Comprehensive Testing Strategy:
```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../backend/server');
const { setupTestDB, cleanupTestDB } = require('../helpers/database');

describe('API Integration Tests', () => {
    let testUser;
    let authToken;
    
    beforeAll(async () => {
        await setupTestDB();
        
        // Create test user
        const response = await request(app)
            .post('/api/auth/telegram')
            .send({
                initData: 'mock_telegram_data',
                hash: 'mock_hash'
            });
            
        testUser = response.body.user;
        authToken = response.body.token;
    });
    
    afterAll(async () => {
        await cleanupTestDB();
    });
    
    describe('Tasks API', () => {
        test('should create task with valid data', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'Test Description',
                due_date: '2024-12-31T12:00:00Z'
            };
            
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);
                
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(taskData.title);
            expect(response.body.data.user_id).toBe(testUser.id);
        });
        
        test('should reject task with invalid data', async () => {
            const invalidTask = {
                title: '', // Empty title should fail
                description: 'Test Description'
            };
            
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidTask)
                .expect(400);
                
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('title');
        });
        
        test('should enforce subscription limits', async () => {
            // Create max allowed tasks for free user
            const maxTasks = 100;
            const taskPromises = [];
            
            for (let i = 0; i < maxTasks; i++) {
                taskPromises.push(
                    request(app)
                        .post('/api/tasks')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({ title: `Task ${i}` })
                );
            }
            
            await Promise.all(taskPromises);
            
            // Next task should fail
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Limit exceeded task' })
                .expect(429);
                
            expect(response.body.error).toContain('limit');
        });
    });
    
    describe('AI Chat API', () => {
        test('should create chat and send message', async () => {
            // Create chat
            const chatResponse = await request(app)
                .post('/api/ai/chats')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Test Chat' })
                .expect(201);
                
            const chatId = chatResponse.body.data.id;
            
            // Send message
            const messageResponse = await request(app)
                .post(`/api/ai/chats/${chatId}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'Hello AI' })
                .expect(201);
                
            expect(messageResponse.body.data.content).toBeTruthy();
            expect(messageResponse.body.data.role).toBe('assistant');
        });
        
        test('should enforce daily message limits', async () => {
            const chatResponse = await request(app)
                .post('/api/ai/chats')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Limit Test Chat' });
                
            const chatId = chatResponse.body.data.id;
            
            // Send 3 messages (free tier limit)
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post(`/api/ai/chats/${chatId}/messages`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ content: `Message ${i}` })
                    .expect(201);
            }
            
            // 4th message should fail
            await request(app)
                .post(`/api/ai/chats/${chatId}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'Limit exceeded message' })
                .expect(429);
        });
    });
    
    describe('File Upload API', () => {
        test('should upload valid file', async () => {
            const taskResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'File Test Task' });
                
            const taskId = taskResponse.body.data.id;
            
            const response = await request(app)
                .post(`/api/tasks/${taskId}/attachments`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from('test file content'), {
                    filename: 'test.txt',
                    contentType: 'text/plain'
                })
                .expect(201);
                
            expect(response.body.data.telegram_file_id).toBeTruthy();
            expect(response.body.data.original_name).toBe('test.txt');
        });
        
        test('should reject oversized file', async () => {
            const taskResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'File Test Task' });
                
            const taskId = taskResponse.body.data.id;
            
            // Create file larger than 10MB (free tier limit)
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x');
            
            await request(app)
                .post(`/api/tasks/${taskId}/attachments`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', largeBuffer, {
                    filename: 'large.txt',
                    contentType: 'text/plain'
                })
                .expect(413);
        });
    });
});

// Performance tests
describe('Performance Tests', () => {
    test('should handle 100 concurrent requests', async () => {
        const start = Date.now();
        const promises = [];
        
        for (let i = 0; i < 100; i++) {
            promises.push(
                request(app)
                    .get('/health')
                    .expect(200)
            );
        }
        
        await Promise.all(promises);
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
    
    test('should maintain response time under load', async () => {
        const results = [];
        
        for (let i = 0; i < 10; i++) {
            const start = Date.now();
            
            await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
                
            results.push(Date.now() - start);
        }
        
        const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
        expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
    });
});
```

### Frontend Testing Strategy:
```javascript
// frontend/tests/integration.test.js
class TestRunner {
    constructor() {
        this.results = [];
        this.mockTelegram();
    }
    
    mockTelegram() {
        window.Telegram = {
            WebApp: {
                initData: 'mock_data',
                initDataUnsafe: {
                    user: {
                        id: 123456,
                        first_name: 'Test',
                        last_name: 'User',
                        language_code: 'en'
                    }
                },
                expand: () => {},
                MainButton: {
                    setText: () => {},
                    onClick: () => {},
                    show: () => {},
                    hide: () => {}
                },
                BackButton: {
                    onClick: () => {}
                },
                ready: (callback) => callback()
            }
        };
    }
    
    async runTests() {
        console.log('🧪 Running frontend integration tests...');
        
        await this.testAppInitialization();
        await this.testRouting();
        await this.testTaskManagement();
        await this.testAIChat();
        await this.testFileUpload();
        await this.testLanguageSwitching();
        
        this.printResults();
    }
    
    async testAppInitialization() {
        try {
            // Test app initialization
            const app = new TelegramApp();
            this.assert(app.isReady, 'App should initialize');
            
            // Test translation system
            const translation = t('common.save');
            this.assert(translation === 'Save', 'Translation system working');
            
            this.pass('App initialization');
        } catch (error) {
            this.fail('App initialization', error.message);
        }
    }
    
    async testRouting() {
        try {
            const router = new Router();
            
            // Test route navigation
            router.navigate('/');
            this.assert(window.location.hash === '#/', 'Home route navigation');
            
            router.navigate('/ai');
            this.assert(window.location.hash === '#/ai', 'AI route navigation');
            
            router.navigate('/settings');
            this.assert(window.location.hash === '#/settings', 'Settings route navigation');
            
            this.pass('Routing system');
        } catch (error) {
            this.fail('Routing system', error.message);
        }
    }
    
    async testTaskManagement() {
        try {
            const taskManager = new TaskManager();
            
            // Test task creation
            const testTask = {
                title: 'Test Task',
                description: 'Test Description',
                due_date: new Date().toISOString()
            };
            
            const createdTask = await taskManager.createTask(testTask);
            this.assert(createdTask.title === testTask.title, 'Task creation');
            
            // Test task completion
            await taskManager.toggleComplete(createdTask.id);
            const updatedTask = await taskManager.getTask(createdTask.id);
            this.assert(updatedTask.completed, 'Task completion');
            
            // Test task deletion
            await taskManager.deleteTask(createdTask.id);
            const deletedTask = await taskManager.getTask(createdTask.id);
            this.assert(!deletedTask, 'Task deletion');
            
            this.pass('Task management');
        } catch (error) {
            this.fail('Task management', error.message);
        }
    }
    
    async testAIChat() {
        try {
            const aiManager = new AIChatManager();
            
            // Test chat creation
            const chat = await aiManager.createNewChat();
            this.assert(chat.id, 'Chat creation');
            
            // Test message sending
            const response = await aiManager.sendMessage(chat.id, 'Hello AI');
            this.assert(response && response.content, 'AI message response');
            
            // Test chat deletion
            await aiManager.deleteChat(chat.id);
            const deletedChat = await aiManager.getChat(chat.id);
            this.assert(!deletedChat, 'Chat deletion');
            
            this.pass('AI chat functionality');
        } catch (error) {
            this.fail('AI chat functionality', error.message);
        }
    }
    
    async testFileUpload() {
        try {
            const fileManager = new FileUploadManager();
            
            // Create mock file
            const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
            
            // Test file validation
            const isValid = fileManager.validateFile(mockFile, 'free');
            this.assert(isValid, 'File validation');
            
            // Test upload process (mock)
            const uploadResult = await fileManager.uploadFile(mockFile, 1);
            this.assert(uploadResult.success, 'File upload');
            
            this.pass('File upload system');
        } catch (error) {
            this.fail('File upload system', error.message);
        }
    }
    
    async testLanguageSwitching() {
        try {
            // Test language detection
            const detectedLang = i18n.detectLanguage();
            this.assert(['ru', 'en'].includes(detectedLang), 'Language detection');
            
            // Test language switching
            i18n.setLanguage('en');
            this.assert(i18n.getCurrentLanguage() === 'en', 'Language switching to EN');
            
            i18n.setLanguage('ru');
            this.assert(i18n.getCurrentLanguage() === 'ru', 'Language switching to RU');
            
            // Test translation updates
            const ruText = t('common.save');
            i18n.setLanguage('en');
            const enText = t('common.save');
            this.assert(ruText !== enText, 'Translation updates on language change');
            
            this.pass('Language switching');
        } catch (error) {
            this.fail('Language switching', error.message);
        }
    }
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    pass(testName) {
        this.results.push({ name: testName, status: 'PASS' });
        console.log(`✅ ${testName}`);
    }
    
    fail(testName, error) {
        this.results.push({ name: testName, status: 'FAIL', error });
        console.log(`❌ ${testName}: ${error}`);
    }
    
    printResults() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log(`\n🧪 Test Results: ${passed} passed, ${failed} failed`);
        
        if (failed > 0) {
            console.log('\n❌ Failed tests:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }
        
        return failed === 0;
    }
}

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
    document.addEventListener('DOMContentLoaded', async () => {
        const testRunner = new TestRunner();
        await testRunner.runTests();
    });
}
```

---