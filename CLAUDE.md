# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Тудушка** - Todo приложение с AI ассистентом на основе React + Django архитектуры.

## Project Architecture

This is a full-stack application with separated frontend and backend:

- **Frontend**: React 19 + TypeScript + Vite development server
- **Backend**: Django 5.2.4 + Django REST Framework + PostgreSQL
- **Development**: Concurrently runs both frontend and backend servers

### Current Architecture State

**Backend**: Minimal Django project setup with no custom apps created yet. Only default Django admin interface exists at `/admin/`. Ready for feature development with DRF configured for JSON-only API responses and CORS enabled for React frontend.

**Frontend**: Fresh Vite + React application with TypeScript, modern ESLint flat config, and dark/light theme CSS. Currently contains only default counter component - ready for todo application development.

### Key Configuration Files
- `backend/settings.py`: Django settings with PostgreSQL, CORS, and REST Framework configuration
- `backend/urls.py`: Currently only routes to Django admin (no API endpoints yet)
- `frontend/vite.config.ts`: Minimal Vite configuration with React plugin
- `frontend/tsconfig.json`: Project references for separate app/node TypeScript configs
- `frontend/eslint.config.js`: Modern ESLint flat configuration with React and TypeScript rules

## Development Commands

### Full-Stack Development
```bash
npm run install       # Install all dependencies (backend + frontend)
npm run dev          # Start both backend and frontend concurrently
```

### Frontend Only (from root)
```bash
npm run frontend     # Start Vite dev server on http://localhost:5173
```

### Backend Only (from root)  
```bash
npm run backend      # Start Django server on http://localhost:8000
```

### Frontend Commands (from frontend/ directory)
```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compilation + Vite build
npm run lint         # ESLint checking
npm run preview      # Preview production build
```

### Backend Commands (from root directory)
```bash
python manage.py runserver       # Start Django development server
python manage.py migrate         # Apply database migrations  
python manage.py makemigrations  # Generate database migrations
python manage.py test            # Run Django tests
python manage.py createsuperuser # Create Django admin user
python manage.py shell           # Django interactive shell
python manage.py startapp <name> # Create new Django application
python manage.py check           # Validate Django configuration
npm run test                     # Run Django tests (with venv activation)
```

### Virtual Environment
```bash
source venv/bin/activate  # Activate virtual environment (required for Django commands)
deactivate               # Deactivate virtual environment
```

### Development Workflow
```bash
# First time setup
npm run install          # Install all dependencies
source venv/bin/activate # Activate Python virtual environment
python manage.py migrate # Initialize database

# Daily development
npm run dev             # Start both servers concurrently
# OR separately:
npm run backend         # Django server (localhost:8000)  
npm run frontend        # Vite dev server (localhost:5173)
```

## Environment Setup

### Required Environment Variables
Create a `.env` file in the root directory with:
```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=tudushka_db
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Note**: Missing DB_NAME, DB_USER, and DB_PASSWORD will cause Django to fail. SECRET_KEY and DEBUG have defaults in settings.py.

### PostgreSQL Setup
The application is configured to use PostgreSQL with connection parameters from environment variables.

## Tech Stack Details

- **Frontend**: React 19.1.0, TypeScript 5.8.3, Vite 7.0.4, ESLint 9.x (flat config)
- **Backend**: Django 5.2.4, Django REST Framework 3.16.0, django-cors-headers, python-decouple
- **Database**: PostgreSQL (psycopg2-binary) 
- **Development Tools**: Concurrently for running multiple processes
- **Localization**: Russian language (ru-ru), Europe/Moscow timezone

### Architecture Patterns

**Backend**:
- JSON-only API design (DRF configured with JSONRenderer/JSONParser only)
- Environment-based configuration using python-decouple
- CORS-enabled for React frontend integration
- Russian localization and Moscow timezone
- No custom Django apps yet - ready for feature development

**Frontend**:
- Modern React with hooks-based architecture
- TypeScript with strict configuration and project references
- ESLint flat config (9.x) with React-specific rules
- CSS custom properties with automatic dark/light theme switching
- Vite for fast development and HMR
- No routing or state management libraries yet - ready for implementation

## CORS Configuration

Frontend development server (localhost:5173) is configured in Django CORS settings. Additional allowed origins include localhost:3000 for compatibility. CORS credentials are enabled for authentication support.

## Project Status

**Current State**: This is a freshly initialized full-stack project with basic setup completed but no application-specific functionality implemented yet. The project is ready for feature development.

**Git Branch**: Development occurs on `develop` branch, not main.

### Next Development Steps
When implementing features, typical workflow will be:

1. **Backend Development**:
   - `python manage.py startapp <appname>` - Create Django apps (e.g., `todos`, `users`, `ai_assistant`)
   - Define models in `models.py` and create migrations
   - Implement DRF viewsets and serializers
   - Add API URLs to `backend/urls.py`

2. **Frontend Development**:
   - Implement routing (consider React Router)
   - Add state management (Context API, Zustand, or Redux Toolkit)
   - Create API integration layer for Django backend
   - Build UI components for todo functionality

## Important Work Rules

**ОБЯЗАТЕЛЬНОЕ ПРАВИЛО**: После выполнения каждой задачи Claude Code должен делать коммит в git с осмысленным сообщением, описывающим выполненную работу.