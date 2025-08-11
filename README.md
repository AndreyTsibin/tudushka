# Тудушка

Полнофункциональное Todo приложение с AI ассистентом, построенное на современном стеке технологий. Поддерживает управление задачами, AI-чат, тематизацию и Telegram WebApp интеграцию.

## 🚀 Технологии

### Frontend
- **React 18.3.1** + **TypeScript 5.8.3** + **Vite 7.0.4**
- **UI**: Radix UI библиотека, Lucide иконки, Sonner уведомления
- **Стилизация**: Custom CSS с CSS переменными (без Tailwind)
- **Локализация**: Русский/Английский с полной поддержкой

### Backend
- **Django 5.2.4** + **Django REST Framework 3.16.0**
- **База данных**: PostgreSQL с UUID первичными ключами
- **Аутентификация**: Token-based через DRF
- **AI интеграция**: OpenAI, Anthropic Claude, Perplexity

### Архитектура приложения
- **3 Django приложения**: `tasks/`, `users/`, `chat/`
- **Полная интеграция**: Frontend использует реальный Django REST API
- **Telegram WebApp**: Авторизация и платежи через Telegram Stars

## 📦 Быстрый старт

### Клонирование и установка
```bash
git clone https://github.com/AndreyTsibin/tudushka.git
cd tudushka
npm run install  # Установит зависимости для frontend и backend
```

### Настройка окружения
Создайте `.env` файл в корне проекта:
```bash
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=tudushka_db
DB_USER=your-postgres-user
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# AI API ключи (опционально - пользователи могут указать свои)
ADMIN_OPENAI_API_KEY=sk-your-openai-key
ADMIN_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
ADMIN_PERPLEXITY_API_KEY=pplx-your-perplexity-key
```

### База данных
```bash
# Создайте PostgreSQL базу данных
createdb tudushka_db

# Активируйте виртуальное окружение и выполните миграции
source venv/bin/activate
python manage.py migrate
python manage.py createsuperuser  # Для доступа к Django admin
```

### Запуск разработки

**КРИТИЧЕСКИ ВАЖНО**: Всегда очищайте порты перед запуском:
```bash
# Освободить порты (обязательно перед каждым запуском)
pkill -f "node\|vite\|python" 2>/dev/null || true
lsof -ti:5173,8000 | xargs kill -9 2>/dev/null || true

# Запустить оба сервера одновременно
npm run dev
```

**Альтернативно** (запуск по отдельности):
```bash
# Backend (требует активации venv)
source venv/bin/activate
python manage.py runserver  # http://localhost:8000

# Frontend (в отдельном терминале)
cd frontend
npm run dev  # http://localhost:5173
```

### Telegram Bot (опционально)
```bash
source venv/bin/activate
python run_bot.py  # Запустит Telegram бота с приветственными сообщениями
```

## 🛠 Команды разработки

### Тестирование и сборка
```bash
# Frontend валидация (ОБЯЗАТЕЛЬНО перед коммитами)
cd frontend
npm run build  # TypeScript компиляция + сборка
npm run lint   # ESLint проверка

# Backend валидация
source venv/bin/activate
python manage.py check  # Django конфигурация
```

### Работа с базой данных
```bash
source venv/bin/activate
python manage.py makemigrations  # Создать миграции
python manage.py migrate         # Применить миграции
python manage.py shell           # Django shell
```

## 🏗 Архитектура проекта

### Структура Backend (Django Apps)
```
tasks/       # CRUD операции с задачами, пользовательские приоритеты
users/       # Аутентификация, профили, Telegram WebApp интеграция  
chat/        # AI управление диалогами и сохранение сообщений
```

### Ключевые файлы Frontend
```
frontend/src/App.tsx                 # Главный компонент с интеграцией API
frontend/src/services/api.ts         # Базовый API клиент с auth и обработкой ошибок
frontend/src/hooks/useAPI.ts         # Кастомные React хуки для управления API состоянием
frontend/src/components/ui/          # Полная библиотека Radix UI компонентов
```

### Ключевые файлы Backend
```
tasks/models.py      # Task и CustomPriority модели с UUID ключами
backend/settings.py  # Django конфиг с PostgreSQL, CORS, token auth
backend/urls.py      # API маршрутизация к tasks, users, и chat endpoints
```

## 🎨 Система стилизации

- **Custom CSS** с CSS переменными (НЕ Tailwind)
- **Темная тема** через `[data-theme="dark"]` селектор
- **Цветовая система**: `var(--color-*)` для совместимости тем
- **Формы**: Все поля в модальных окнах используют `border: none`
- **Badge компоненты**: Всегда `border: none` для чистого внешнего вида

## 🚦 Правила разработки

### Git Workflow
- **Основная ветка разработки**: `develop` (НЕ main)
- **ОБЯЗАТЕЛЬНО**: Запускать `npm run build` перед коммитами
- **Коммиты**: Используйте осмысленные сообщения на русском языке

### Архитектурные ограничения
- Frontend использует **реальный Django REST API** (не локальное состояние)
- Аутентификация через **token** хранится в localStorage
- Все UI компоненты построены на **Radix UI** для доступности
- **UUID первичные ключи** во всех Django моделях

## 🌐 Production сервер

### Информация о сервере (TimeWeb)
- **Домен**: tudushka.ru
- **IP**: 5.129.225.19
- **SSH**: `ssh root@5.129.225.19`
- **OS**: Ubuntu 22.04 LTS
- **Web сервер**: Nginx с SSL (Let's Encrypt)

### Docker развертывание
```bash
docker-compose up --build
```

## 📚 API Документация

### Endpoints
- **Tasks**: `/api/tasks/` - CRUD операции с задачами
- **Users**: `/api/users/` - Регистрация, авторизация, профили
- **Chat**: `/api/chat/` - AI диалоги и история сообщений

### Аутентификация
```bash
POST /api/users/login/
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}

# Ответ
{
  "token": "your-auth-token",
  "user": {...}
}
```

## 🤖 AI Интеграция

Приложение поддерживает несколько AI моделей:
- **OpenAI GPT** (основная модель)
- **Anthropic Claude** (альтернативная)
- **Perplexity** (для исследований)

Пользователи могут выбирать модель и указывать свои API ключи в настройках.

## 📱 Telegram WebApp

- **Авторизация** через Telegram WebApp API
- **Платежи** через Telegram Stars
- **Уведомления** о новых задачах и AI сообщениях
- Полная интеграция с основным приложением

## 🔧 Устранение неполадок

### Проблемы запуска
```bash
# Проверить запущенные процессы
ps aux | grep -E "(vite|runserver)" | grep -v grep

# Проверить доступность портов
curl -I http://localhost:5173
curl -I http://localhost:8000

# Принудительно очистить все и перезапустить
pkill -f "node\|vite\|python" 2>/dev/null || true
lsof -ti:5173,8000 | xargs kill -9 2>/dev/null || true  
npm run dev
```

### Частые проблемы
- **Ошибки сборки**: Обычно из-за неиспользуемых импортов или TypeScript ошибок
- **Проблемы со стилями**: Проверьте CSS переменные в `index.css`
- **API ошибки**: Убедитесь что backend запущен и база данных доступна

## 🤝 Участие в разработке

1. **Fork** проекта
2. Создайте **feature branch** из `develop`
3. Выполните изменения с соблюдением правил стилизации
4. **Протестируйте**: `npm run build && npm run lint`
5. Создайте **Pull Request** в `develop` ветку

## 📄 Лицензия

MIT License. Смотрите [LICENSE](LICENSE) для деталей.

---

**Автор**: [Андрей Цибин](https://github.com/AndreyTsibin)  
**Проект**: [Тудушка](https://github.com/AndreyTsibin/tudushka)
