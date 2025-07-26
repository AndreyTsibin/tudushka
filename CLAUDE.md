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
python manage.py runserver    # Start Django development server
python manage.py migrate      # Apply database migrations
python manage.py test         # Run Django tests
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
```

### PostgreSQL Setup
The application is configured to use PostgreSQL with connection parameters from environment variables.

## Tech Stack Details

- **Frontend**: React 19.1.0, TypeScript 5.8.3, Vite 7.0.4, ESLint
- **Backend**: Django 5.2.4, Django REST Framework 3.16.0, django-cors-headers
- **Database**: PostgreSQL (psycopg2-binary)
- **Development Tools**: Concurrently for running multiple processes, python-decouple for environment management

## CORS Configuration

Frontend development server (localhost:5173) is configured in Django CORS settings. Additional allowed origins include localhost:3000 for compatibility.