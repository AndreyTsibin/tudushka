# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Тудушка** - Todo приложение с AI ассистентом на основе React + Django архитектуры.

## Project Architecture

This is a full-stack application with separated frontend and backend:

- **Frontend**: React 19 + TypeScript + Vite development server
- **Backend**: Django 5.2.4 + Django REST Framework + PostgreSQL
- **Development**: Concurrently runs both frontend and backend servers

### Key Configuration Files
- `backend/settings.py`: Django settings with PostgreSQL, CORS, and REST Framework configuration
- `frontend/vite.config.ts`: Vite configuration for React development
- `frontend/package.json`: Frontend dependencies and scripts
- Root `package.json`: Orchestrates full-stack development commands

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
npm run test                     # Run Django tests (with venv activation)
```

### Virtual Environment
```bash
source venv/bin/activate  # Activate virtual environment (required for Django commands)
deactivate               # Deactivate virtual environment
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

## CORS Configuration

Frontend development server (localhost:5173) is configured in Django CORS settings. Additional allowed origins include localhost:3000 for compatibility.

## Project Status

**Current State**: This is a freshly initialized full-stack project with basic setup completed but no application-specific functionality implemented yet. The project is ready for feature development.

**Git Branch**: Development occurs on `develop` branch, not main.

## Important Work Rules

**ОБЯЗАТЕЛЬНОЕ ПРАВИЛО**: После выполнения каждой задачи Claude Code должен делать коммит в git с осмысленным сообщением, описывающим выполненную работу.