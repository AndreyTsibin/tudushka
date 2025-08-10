# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Тудушка** - Full-stack Todo application with AI assistant features. React + TypeScript frontend, Django + Python backend, PostgreSQL database.

## Architecture

### Current State
**Backend**: Complete Django REST API with three apps:
- `tasks/`: Task CRUD operations with custom priorities and user relationships
- `users/`: Authentication, profiles, Telegram WebApp integration  
- `chat/`: AI conversation management and message persistence

**Frontend**: React app with full backend integration:
- Real-time task management via Django REST API
- AI assistant with conversation history
- Theme switching, subscription tiers, calendar integration
- Custom API hooks and error handling

### Key Files
- `frontend/src/App.tsx`: Main application component with API integration
- `frontend/src/services/api.ts`: Base API client with auth and error handling
- `frontend/src/hooks/useAPI.ts`: Custom React hooks for API state management
- `tasks/models.py`: Task and CustomPriority models with UUID keys
- `backend/settings.py`: Django config with PostgreSQL, CORS, token auth
- `backend/urls.py`: API routing to tasks, users, and chat endpoints

## Development Commands

### Quick Start
```bash
# Install all dependencies
npm run install

# Start both servers (CRITICAL: clear ports first)
pkill -f "node\|vite\|python" 2>/dev/null || true
lsof -ti:5173,8000 | xargs kill -9 2>/dev/null || true
npm run dev  # Runs frontend (5173) + backend (8000)

# Start Telegram Bot (optional)
source venv/bin/activate
python run_bot.py  # Runs Telegram bot with welcome messages
```

### Individual Commands
```bash
# Backend (requires venv activation first)
source venv/bin/activate
python manage.py runserver        # Django server localhost:8000
python manage.py migrate          # Apply database migrations
python manage.py makemigrations   # Generate migrations

# Frontend (from frontend/ directory)
npm run dev                       # Vite dev server localhost:5173  
npm run build                     # TypeScript compilation + build
npm run lint                      # ESLint with modern flat config

# Testing
source venv/bin/activate && python manage.py check  # Django validation
cd frontend && npm run build && npm run lint        # Frontend validation
```

## Environment Setup

Required `.env` file in root:
```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=tudushka_db
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
TELEGRAM_BOT_TOKEN=your-bot-token  # For Telegram integration

# AI API Keys (optional - users can set their own keys in settings)
ADMIN_OPENAI_API_KEY=sk-your-openai-key
ADMIN_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
ADMIN_PERPLEXITY_API_KEY=pplx-your-perplexity-key
```

## Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.8.3, Vite 7.0.4, custom CSS system
- **UI**: Complete Radix UI library, Lucide icons, Sonner toasts
- **Backend**: Django 5.2.4, DRF 3.16.0, psycopg2, django-cors-headers
- **Database**: PostgreSQL with UUID primary keys
- **Auth**: Token-based authentication via DRF
- **Localization**: Russian primary, English secondary, Moscow timezone

## Critical Rules

### Port Management
**ALWAYS** clear ports before starting development:
```bash
pkill -f "node\|vite\|python" 2>/dev/null || true
lsof -ti:5173,8000 | xargs kill -9 2>/dev/null || true
```

### Pre-commit Requirements
- Always run `npm run build` from frontend directory before committing
- Always run `npm run lint` for frontend changes  
- All Django apps use UUID primary keys, not auto-incrementing IDs
- Development on `develop` branch, not main

### Styling Constraints
- Custom CSS with CSS variables only (no Tailwind utility classes)
- Dark mode via `[data-theme="dark"]` attribute selector
- All colors use `var(--color-*)` format for theme compatibility
- Modal form fields use `border: none` with focus box-shadow effects
- All badges use `border: none` styling

### API Integration
- Frontend uses real Django REST API (no local state for tasks)
- Token authentication stored in localStorage
- Custom React hooks for API state management and error handling
- All API calls show toast notifications for user feedback

## Project Status

**Fully Integrated**: Frontend and backend are completely integrated with real API calls, user authentication, and data persistence. The application supports Telegram WebApp integration and payment processing through Telegram Stars.

**Server URLs**:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000  
- Django Admin: http://localhost:8000/admin

## Production Server (TimeWeb)

### Server Information
- **Domain**: tudushka.ru
- **IPv4**: 5.129.225.19
- **IPv6**: 2a03:6f02::cedf
- **Provider**: TimeWeb
- **SSH Access**: ssh root@5.129.225.19
- **Root Password**: See .env file or secure storage

### DNS Configuration
- **A Record**: tudushka.ru → 5.129.225.19
- **AAAA Record**: tudushka.ru → 2a03:6f02::cedf
- **CNAME**: www.tudushka.ru → tudushka.ru
- **MX Records**: Configured with TimeWeb mail servers
- **TXT Records**: SPF configured for email security

### Server Ports
**Open Ports**: 389, 465, 3389, 2525, 587, 53413, 25
- Standard web ports (80, 443) should be configured for HTTP/HTTPS
- SSH access available on standard port 22
- Email ports configured (25, 465, 587)

### Production URLs
- **Production Site**: https://tudushka.ru (to be configured)
- **Admin Panel**: https://tudushka.ru/admin (to be configured)
- **API Endpoint**: https://tudushka.ru/api (to be configured)

### Deployment Notes
- Application uploaded to server (path to be documented)
- Further configuration needed for full deployment
- SSL certificate setup required for HTTPS
- Web server configuration (Nginx/Apache) needed