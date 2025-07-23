# Testing Prompts для проекта "Тудушка"

## 🧪 Early Stage Testing (Этапы 1-3)

**Используется после выполнения задач:** TASK-001, TASK-002, TASK-003

### Промпт для Claude Code:

```
Run comprehensive early-stage testing for the Tudushka project. This is a basic infrastructure test to verify that the foundation is working correctly.

TEST SCOPE:
- Database connectivity and basic operations
- Express server functionality 
- Basic API endpoints
- Static file serving
- Environment configuration
- Telegram SDK integration (if available)

TESTING REQUIREMENTS:

1. DATABASE TESTING:
   - Test PostgreSQL connection using the DATABASE_URL from .env
   - Verify all tables exist (users, tasks, task_attachments, ai_chats, ai_messages, usage_stats)
   - Run basic CRUD operations on users table
   - Check database indexes are created
   - Test connection pool limits

2. SERVER TESTING:
   - Verify Express server starts on correct port (3001)
   - Test CORS middleware configuration
   - Check JSON body parsing middleware
   - Verify static file serving on port 3000
   - Test basic error handling middleware

3. API ENDPOINTS TESTING:
   - GET /health - should return 200 with status OK
   - GET /api/health - should return detailed system status
   - POST /api/auth/telegram - test with mock Telegram data
   - Verify proper HTTP status codes and JSON responses
   - Test error responses for invalid requests

4. ENVIRONMENT & SECURITY:
   - Verify all required environment variables are loaded
   - Check that .env file is not exposed publicly
   - Test CORS headers are set correctly
   - Verify security middleware (helmet) is working

5. FRONTEND BASICS:
   - Verify index.html loads without errors
   - Check that CSS and JS files are served correctly
   - Test Telegram Web Apps SDK loading (if integrated)
   - Verify basic HTML structure and meta tags

CREATE A COMPREHENSIVE TEST SCRIPT:
Write a Node.js test script that automatically runs all these tests and provides a detailed report in RUSSIAN language in this format:

```
🧪 ОТЧЕТ ПО ТЕСТИРОВАНИЮ ТУДУШКА - РАННЯЯ СТАДИЯ
===============================================

✅ Подключение к БД: ПРОЙДЕНО (45мс)
✅ Создание таблиц: ПРОЙДЕНО (найдено все 6 таблиц)
✅ Express сервер: ПРОЙДЕНО (слушает порт 3001)
✅ Статические файлы: ПРОЙДЕНО (frontend на порту 3000)
✅ Health endpoint: ПРОЙДЕНО (200 OK)
❌ Auth endpoint: ПРОВАЛЕНО (500 Internal Server Error)
⚠️  Окружение: ПРЕДУПРЕЖДЕНИЕ (TELEGRAM_BOT_TOKEN не установлен)

МЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ:
- Время запуска сервера: 1.2с
- Время запроса к БД: 34мс
- Время ответа API: 156мс

ПРОВЕРКИ БЕЗОПАСНОСТИ:
✅ CORS настроен правильно
✅ .env файл недоступен
⚠️  Отсутствует rate limiting (ожидаемо для этой стадии)

РЕКОМЕНДАЦИИ:
🔧 Исправить ошибку auth endpoint в routes/auth.js строка 23
🔧 Установить TELEGRAM_BOT_TOKEN в .env файл
📊 Рассмотреть добавление middleware для логирования запросов

ОБЩИЙ СТАТУС: 🟡 В ОСНОВНОМ РАБОТАЕТ (2 проблемы для исправления)
```

The test script should:
1. Be self-contained and runnable with `node test-early-stage.js`
2. Include proper error handling and timeouts
3. Clean up any test data created
4. Exit with appropriate status codes (0 for success, 1 for failures)
5. Be non-destructive (don't delete existing data)

Focus on speed and essential functionality - this should complete in under 30 seconds.
```

---

## 🚀 Feature Testing (Этапы 4-6)

**Используется после выполнения задач:** TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013, TASK-014

### Промпт для Claude Code:

```
Run comprehensive feature testing for the Tudushka project. This tests all major business logic functionality and integrations.

TEST SCOPE:
- Complete CRUD operations for tasks
- Authentication and JWT tokens
- AI chat functionality (Perplexity API)
- File upload system (Telegram Bot API)
- Calendar and date filtering
- Subscription limits enforcement
- Frontend-backend integration

TESTING REQUIREMENTS:

1. AUTHENTICATION TESTING:
   - Test Telegram initData validation
   - JWT token generation and verification
   - Token refresh functionality
   - Auth middleware protection
   - User creation and profile updates

2. TASKS FUNCTIONALITY:
   - Create, read, update, delete tasks
   - Task completion toggling
   - Due date and recurring tasks
   - Calendar filtering (today, week, month)
   - Task validation and error handling

3. AI INTEGRATION:
   - Perplexity API connectivity
   - Chat creation and message sending
   - Usage limit enforcement (3 messages for free tier)
   - Error handling for API failures
   - Chat history persistence

4. FILE SYSTEM:
   - File upload via Telegram Bot API
   - File validation (type, size limits)
   - Attachment linking to tasks
   - File retrieval and download URLs
   - Storage cleanup

5. FRONTEND TESTING:
   - Component rendering and interactions
   - API calls and error handling
   - Router functionality
   - Form validation
   - UI state management

6. INTEGRATION TESTING:
   - End-to-end user workflows
   - Data consistency across layers
   - Error propagation and handling
   - Performance under typical load

Create a comprehensive test suite that generates a detailed report WITH ALL TEXT IN RUSSIAN LANGUAGE with pass/fail status, performance metrics, and actionable recommendations.

The report should follow this format:
```
🚀 ОТЧЕТ ПО ФУНКЦИОНАЛЬНОМУ ТЕСТИРОВАНИЮ ТУДУШКА
===============================================

АУТЕНТИФИКАЦИЯ:
✅ Валидация Telegram данных: ПРОЙДЕНО
✅ Генерация JWT токенов: ПРОЙДЕНО
❌ Обновление токенов: ПРОВАЛЕНО

УПРАВЛЕНИЕ ЗАДАЧАМИ:
✅ Создание задач: ПРОЙДЕНО
✅ Редактирование задач: ПРОЙДЕНО
⚠️  Удаление задач: ПРЕДУПРЕЖДЕНИЕ (медленно)

AI ИНТЕГРАЦИЯ:
✅ Подключение к Perplexity: ПРОЙДЕНО
❌ Лимиты сообщений: ПРОВАЛЕНО

ЗАГРУЗКА ФАЙЛОВ:
✅ Telegram Bot API: ПРОЙДЕНО
✅ Валидация файлов: ПРОЙДЕНО

МЕТРИКИ ПРОИЗВОДИТЕЛЬНОСТИ:
- Среднее время ответа API: 234мс
- Время создания задачи: 45мс
- AI ответ: 2.1с

РЕКОМЕНДАЦИИ:
🔧 Исправить refresh токены в auth.js
🔧 Добавить проверку лимитов AI сообщений
📊 Оптимизировать удаление задач

ОБЩИЙ СТАТУС: 🟡 ТРЕБУЕТ ДОРАБОТКИ (2 критические ошибки)
```

Execution time target: 2-3 minutes maximum.
```

---

## 🏭 Production Testing (Этапы 7-10)

**Используется после выполнения задач:** TASK-015, TASK-016, TASK-017, TASK-018, TASK-019, TASK-020, TASK-021, TASK-022

### Промпт для Claude Code:

```
Run comprehensive production readiness testing for the Tudushka project. This is a full-scale test simulating real-world usage and security scenarios.

TEST SCOPE:
- Security vulnerability scanning
- Performance and load testing
- Multi-language functionality
- Subscription system validation
- Production environment setup
- Deployment verification
- Error handling and recovery

TESTING REQUIREMENTS:

1. SECURITY TESTING:
   - SQL injection attempts on all inputs
   - XSS vulnerability testing
   - JWT token security (expiry, tampering)
   - Rate limiting effectiveness
   - File upload security (malicious files)
   - CORS and CSP headers validation

2. PERFORMANCE TESTING:
   - Load testing with 100+ concurrent users
   - Database performance under load
   - API response times under stress
   - Memory usage and leak detection
   - File upload performance with large files

3. FUNCTIONALITY TESTING:
   - Complete user journey simulation
   - Multi-language switching
   - Subscription limits enforcement
   - Onboarding tour functionality
   - Error recovery scenarios

4. PRODUCTION ENVIRONMENT:
   - SSL certificate validation
   - Domain configuration
   - Server monitoring and logging
   - Backup system verification
   - Health check endpoints

5. INTEGRATION TESTING:
   - External API reliability (Perplexity, Telegram)
   - Database consistency and integrity
   - Real-time features and notifications
   - Cross-browser compatibility

6. DISASTER RECOVERY:
   - Database backup and restore
   - Server restart recovery
   - API failure handling
   - Data corruption detection

Generate a production-ready assessment report WITH ALL TEXT IN RUSSIAN LANGUAGE with security score, performance benchmarks, and deployment checklist.

The report should follow this format:
```
🏭 ОТЧЕТ ПО ПРОДАКШН ГОТОВНОСТИ ТУДУШКА
======================================

БЕЗОПАСНОСТЬ:
✅ SQL инъекции: ЗАЩИЩЕНО
✅ XSS уязвимости: ЗАЩИЩЕНО
❌ Rate limiting: НЕ РАБОТАЕТ
⚠️  JWT безопасность: ЧАСТИЧНО

ПРОИЗВОДИТЕЛЬНОСТЬ:
✅ Нагрузочное тестирование: ПРОЙДЕНО (500 пользователей)
✅ Время ответа API: ОТЛИЧНО (< 200мс)
⚠️  Использование памяти: ВЫСОКОЕ (85%)

РАЗВЕРТЫВАНИЕ:
✅ SSL сертификат: ДЕЙСТВИТЕЛЕН
✅ Домен настроен: РАБОТАЕТ
✅ Мониторинг: АКТИВЕН
❌ Резервное копирование: НЕ НАСТРОЕНО

ИНТЕГРАЦИИ:
✅ Perplexity API: СТАБИЛЬНО
✅ Telegram Bot API: СТАБИЛЬНО
⚠️  База данных: МЕДЛЕННЫЕ ЗАПРОСЫ

ОЦЕНКА БЕЗОПАСНОСТИ: 7/10
ОЦЕНКА ПРОИЗВОДИТЕЛЬНОСТИ: 8/10
ГОТОВНОСТЬ К ПРОДАКШНУ: 75%

КРИТИЧЕСКИЕ ПРОБЛЕМЫ:
🚨 Настроить резервное копирование БД
🚨 Исправить rate limiting
🚨 Оптимизировать медленные запросы

ОБЩИЙ СТАТУС: 🟡 ПОЧТИ ГОТОВ (3 критические проблемы)
```

Execution time target: 5-10 minutes maximum.
```