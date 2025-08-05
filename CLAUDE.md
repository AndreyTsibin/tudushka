# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Тудушка** - A fully functional Todo application with AI assistant features built on React + Django architecture. The application includes task management, AI-powered task descriptions, chat functionality, themes, and subscription management.

## Project Architecture

This is a full-stack application with separated frontend and backend:

- **Frontend**: React 19 + TypeScript + Vite with complete UI implementation
- **Backend**: Django 5.2.4 + Django REST Framework + PostgreSQL (backend ready for API development)
- **Development**: Concurrently runs both frontend and backend servers

### Current Architecture State

**Backend**: Minimal Django project setup with no custom apps created yet. Only default Django admin interface exists at `/admin/`. Ready for feature development with DRF configured for JSON-only API responses and CORS enabled for React frontend.

**Frontend**: Complete todo application implementation with:
- Task management (CRUD operations with local state)
- AI assistant with chat functionality and usage limits
- Multi-page navigation (Home, AI Assistant, Archive, Settings)
- Theme switching (light/dark mode)
- Subscription tiers (Free, Plus, Pro)
- Calendar integration and task scheduling
- Fully responsive UI with custom CSS and Radix UI components

### Key Architecture Files

**Frontend Core:**
- `frontend/src/App.tsx`: Main application component with state management for tasks, chat sessions, user settings, and page routing
- `frontend/src/components/ui/`: Complete Radix UI component library with custom CSS styling
- `frontend/src/index.css`: CSS custom properties for light/dark themes using HSL color format
- `frontend/src/index.css`: Custom CSS with color palette and dark mode support

**Configuration Files:**
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

- **Frontend**: React 19.1.0, TypeScript 5.8.3, Vite 7.0.4, custom CSS system, ESLint 9.x (flat config)
- **UI Components**: Complete Radix UI library (@radix-ui/react-*), Lucide React icons, Sonner for toasts
- **Styling**: Custom CSS with design system using CSS custom properties
- **Calendar**: react-day-picker with full Russian localization
- **Backend**: Django 5.2.4, Django REST Framework 3.16.0, django-cors-headers, python-decouple
- **Database**: PostgreSQL (psycopg2-binary) 
- **Development Tools**: Concurrently for running multiple processes
- **Localization**: Russian language (ru-ru), Europe/Moscow timezone

### Application State Architecture

**Frontend State Management:**
- Local React state management in App.tsx (no external state library)
- Task management with local CRUD operations and animations
- Chat sessions with message history
- User settings (theme, language, AI model, subscription)
- AI usage tracking with daily limits per subscription tier
- Multi-page routing with conditional rendering

**Core Data Models:**
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  priority: "urgent" | "normal" | "low";
  completed: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface UserSettings {
  language: "ru" | "en";
  theme: "light" | "dark";
  aiPersonality: string;
  aiModel: "chatgpt" | "claude" | "perplexity";
  plan: "free" | "plus" | "pro";
  aiUsage: {
    descriptionsUsed: number;  
    chatRequestsUsed: number;
    lastResetDate: string;
  };
}
```

**Backend Architecture:**
- JSON-only API design (DRF configured with JSONRenderer/JSONParser only)
- Environment-based configuration using python-decouple
- CORS-enabled for React frontend integration
- Russian localization and Moscow timezone
- No custom Django apps yet - ready for API integration

## CORS Configuration

Frontend development server (localhost:5173) is configured in Django CORS settings. Additional allowed origins include localhost:3000 for compatibility. CORS credentials are enabled for authentication support.

## Project Status

**Current State**: The frontend is a complete, fully functional todo application with AI assistant features. All UI components, state management, and user interactions are implemented. The backend remains a minimal Django setup ready for API development to replace current local state with persistent data storage.

**Git Branch**: Development occurs on `develop` branch, not main.

### Frontend Implementation Status
✅ **Complete Features:**
- Task CRUD operations (create, read, update, delete, complete)
- Task filtering by time periods (today, week, month)
- Task priority system (urgent, normal, low) with color coding  
- AI assistant with chat interface and conversation history
- AI-powered task description generation with usage limits
- Multi-page navigation (Home, AI Assistant, Archive, Settings)
- Theme switching (light/dark mode) with CSS custom properties
- User settings management (language, AI model, subscription)
- Subscription tiers with usage limits (Free: 3/3, Plus: 10/20, Pro: 20/100)
- Calendar integration with task visualization
- Task completion animations and state transitions
- Responsive design with mobile-first approach
- Russian localization throughout the interface

### Backend Integration Opportunities
The frontend is ready for backend integration. Key areas for API development:

1. **Authentication & User Management**:
   - User registration, login, profile management
   - Session management and JWT token handling
   - Password reset and email verification

2. **Task Management API**:
   - Replace local task state with persistent database storage
   - Task CRUD endpoints with filtering, sorting, pagination
   - Task sharing and collaboration features

3. **AI Integration**:
   - Real AI model integration (currently simulated)
   - Usage tracking and subscription enforcement
   - Chat history persistence and AI conversation management

4. **Subscription & Billing**:
   - Payment processing integration  
   - Subscription management and upgrade flows
   - Usage analytics and reporting

## Styling Architecture

### Custom CSS Configuration
- **Approach**: Custom CSS with CSS custom properties
- **Dark Mode**: Class-based dark mode using CSS custom properties
- **Color System**: HSL-based custom properties for theme switching
- **Component Styling**: Direct CSS classes with design system consistency

### Theme Implementation
- **CSS Custom Properties**: Defined in `frontend/src/index.css` with HSL values
- **Theme Toggle**: Managed via React state, applies `.dark` class to `document.documentElement`
- **Color Variables**: All colors use `hsl(var(--variable-name))` format for proper CSS custom property integration

### UI Component System
- **Base Library**: Complete Radix UI primitives for accessibility
- **Styling Approach**: Custom CSS classes with design system consistency
- **Component Location**: `frontend/src/components/ui/` - pre-built, styled components
- **Utility Functions**: `cn()` function in `utils.ts` for conditional class merging

### Common Styling Patterns
```typescript
// Theme-aware conditional styling
className={`${
  userSettings.theme === "dark"
    ? "dark-theme-class"
    : "light-theme-class"
}`}

// Using design system colors through CSS custom properties
className="card-background card-text card-border"

// Custom CSS classes for component variants
className="button-primary button-medium"
```

## Development Guidelines

### State Management Patterns
- **No External State Library**: All state managed with React hooks in App.tsx
- **State Organization**: Separate useState hooks for different domains (tasks, chat, settings)
- **Data Flow**: Props drilling for component communication (consider Context if complexity grows)

### Animation & UX
- **Task Completion**: Slide-out animation with opacity/transform transitions
- **Loading States**: Toast notifications for user feedback (using Sonner)
- **Form Handling**: Immediate validation with user-friendly error messages

### Russian Localization
- **Date Formatting**: Uses `Intl.DateTimeFormat` with 'ru-RU' locale
- **Calendar**: Custom formatters for react-day-picker in Russian
- **Text Content**: All UI text in Russian, consider i18n for future English support

## Important Work Rules

**ОБЯЗАТЕЛЬНОЕ ПРАВИЛО**: После выполнения каждой задачи Claude Code должен делать коммит в git с осмысленным сообщением, описывающим выполненную работу.