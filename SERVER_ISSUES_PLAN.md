# 🚨 Tudushka Server Issues & Fix Plan

## 📊 Текущий статус сервера

### ✅ Работает:
- **Frontend**: https://tudushka.ru - React приложение загружается
- **SSL/HTTPS**: Сертификаты Let's Encrypt работают
- **PostgreSQL**: База данных запущена и настроена
- **Gunicorn**: Django приложение запущено через systemd
- **Nginx**: Правильно настроен для frontend + API

### ❌ Критические ошибки:

## 1. 🔴 Django API возвращает 400 Bad Request

**Проблема**: Все API endpoints (/api/tasks/, /api/users/, /api/chat/) возвращают HTTP 400
**Симптомы**: 
- `curl https://tudushka.ru/api/tasks/` → 400 Bad Request
- Frontend показывает "Load failed"
- Django логи показывают 400 без детальной информации

**Возможные причины**:
- CORS проблемы в production режиме (DEBUG=False)
- Отсутствует корневой API endpoint в urls.py
- Проблемы с заголовками запросов
- Django middleware конфликты

**План исправления**:
1. Включить временно DEBUG=True для детальных ошибок
2. Проверить CORS_ALLOWED_ORIGINS в settings.py
3. Добавить корневой API endpoint: `path('api/', views.api_root)`
4. Проверить Django middleware порядок
5. Добавить логирование запросов в Django
6. Тестировать API endpoints по отдельности

## 2. 🔴 Telegram Bot не запускается

**Проблема**: Systemd сервис tudushka-bot постоянно падает
**Ошибка**: `Cannot close a running event loop`

**Причина**: Конфликт async/await в python-telegram-bot library
**Симптомы**:
- `systemctl status tudushka-bot` показывает failed
- RuntimeWarning: coroutine 'Application.initialize' was never awaited

**План исправления**:
1. Обновить python-telegram-bot до последней версии
2. Переписать telegram_bot.py под новый API библиотеки
3. Исправить async/await структуру в start_bot.py
4. Добавить правильную обработку сигналов для systemd
5. Тестировать бота отдельно от systemd

## 3. 🟡 Frontend "Load failed" ошибка

**Проблема**: React приложение не может подключиться к API
**Изображение**: Показывает "Ошибка: Load failed" в интерфейсе

**Причины**:
- API endpoints возвращают 400 (связано с проблемой #1)
- VITE_API_URL в frontend указывает неправильно
- CORS блокирует запросы от frontend к API

**План исправления**:
1. Исправить Django API (проблема #1)
2. Проверить environment variables в frontend build
3. Настроить правильные CORS headers
4. Обновить frontend конфигурацию для production

## 4. 🔵 Удаление Anthropic AI

**Задача**: Убрать поддержку Anthropic из приложения
**Файлы для изменения**:
- `backend/settings.py` - удалить ANTHROPIC_API_KEY
- `chat/views.py` - удалить Anthropic provider
- `frontend/src/components/` - убрать из UI выбора
- `users/models.py` - удалить anthropic_api_key поля
- `.env` - удалить ADMIN_ANTHROPIC_API_KEY

**План действий**:
1. Найти все упоминания "anthropic" в коде
2. Удалить Anthropic из AI providers
3. Обновить UI для показа только OpenAI и Perplexity
4. Удалить миграции для anthropic полей
5. Тестировать работу с оставшимися AI

## 5. 🟡 Производительность и оптимизация

**Проблемы**:
- Nginx warning: proxy_headers_hash размер
- Django staticfiles не оптимизированы для production
- Отсутствует кеширование

**План исправления**:
1. Увеличить proxy_headers_hash_max_size в nginx.conf
2. Настроить gzip сжатие для статических файлов
3. Добавить кеширование API ответов
4. Оптимизировать PostgreSQL для production

---

## 📋 Пошаговый план исправления

### Фаза 1: Критические API ошибки (Приоритет: ВЫСОКИЙ)
1. **Диагностика Django API**:
   ```bash
   # На сервере включить DEBUG для диагностики
   sed -i 's/DEBUG=False/DEBUG=True/' .env
   systemctl restart tudushka
   # Тестировать API и смотреть детальные ошибки
   curl -v https://tudushka.ru/api/tasks/
   ```

2. **Исправление CORS**:
   - Добавить tudushka.ru в CORS_ALLOWED_ORIGINS
   - Проверить CORS middleware в settings.py
   - Тестировать с браузера

3. **Добавление корневого API endpoint**:
   - Создать views.api_root() в backend/urls.py
   - Добавить базовую API документацию

### Фаза 2: Удаление Anthropic (Приоритет: СРЕДНИЙ)
1. **Backend очистка**:
   ```bash
   grep -r "anthropic" backend/ chat/ users/
   # Удалить все найденные упоминания
   ```

2. **Frontend очистка**:
   ```bash
   grep -r "anthropic" frontend/src/
   # Удалить из компонентов выбора AI
   ```

3. **Database migration**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Фаза 3: Telegram Bot (Приоритет: СРЕДНИЙ)
1. **Обновление библиотек**:
   ```bash
   pip install python-telegram-bot==20.8 --upgrade
   ```

2. **Переписать bot запуск**:
   - Исправить async структуру
   - Добавить правильную обработку systemd сигналов

### Фаза 4: Тестирование и оптимизация (Приоритет: НИЗКИЙ)
1. **End-to-end тестирование**:
   - Тест всех API endpoints
   - Тест frontend функциональности
   - Тест Telegram bot интеграции

2. **Performance оптимизации**:
   - Nginx настройки
   - Django кеширование
   - Static files оптимизация

---

## 🔧 Команды для быстрой диагностики

```bash
# Статус всех сервисов
systemctl status tudushka nginx postgresql tudushka-bot

# Проверка API
curl -I https://tudushka.ru/api/tasks/

# Логи Django
journalctl -u tudushka -f

# Логи Nginx
tail -f /var/log/nginx/error.log

# Тест базы данных
sudo -u postgres psql -d tudushka_db -c "SELECT COUNT(*) FROM auth_user;"
```

---

## ⚠️ Важные заметки

1. **Безопасность**: После диагностики обязательно вернуть DEBUG=False
2. **Backup**: Сделать snapshot сервера перед крупными изменениями
3. **Мониторинг**: Следить за логами во время исправлений
4. **Тестирование**: Каждое исправление тестировать по отдельности

---

**Создано**: 2025-08-10  
**Статус**: Готов к исправлению  
**Приоритет**: API ошибки → Anthropic удаление → Telegram bot → Оптимизация