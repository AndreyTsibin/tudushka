# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Settings

**ВАЖНО**: Всегда отвечай на русском языке в чате с пользователем. Все объяснения, комментарии и взаимодействие с пользователем должны происходить исключительно на русском языке. Все комментарии в коде должны быть на Английском языке.

## Project Overview

**Тудушка** is a Telegram Mini App with ToDo functionality and AI assistant for task planning. The project uses unified server architecture with Express.js backend and vanilla JavaScript frontend.

## Current Development Status
- **Unified Server Architecture**: Single server.js serves both API (port 3001) and static files (port 3000)
- **Backend API**: Complete Express.js structure with routes, middleware, models, and services
- **Frontend**: Modular JavaScript architecture with feature-based modules
- **Database**: PostgreSQL with 9 migration files for complete schema
- **Testing**: Universal testing system with stage-based approach
- **Documentation**: Comprehensive architecture documentation in docs/

## Architecture & Tech Stack

### Backend Stack
- **Node.js 18 LTS** with Express.js
- **PostgreSQL 14** as primary database
- **Redis** for caching and session management
- **PM2** for process management in production
- **Telegram Bot API** for file storage
- **Perplexity API** for AI assistant

### Frontend Stack
- **Vanilla JavaScript (ES6+)** with modular architecture
- **HTML5** with semantic markup
- **CSS3** with Apple-inspired design system
- **Telegram Web Apps API** for authentication and integration

### Production Environment
- **Ubuntu 22.04** on timeweb.cloud VPS
- **Nginx** as reverse proxy
- **Let's Encrypt** SSL certificates
- **Docker** containerization support

## Project Structure

```
tudushka/
├── frontend/                    # Client-side application
│   ├── index.html              # Main entry point
│   ├── css/                    # Styles (main.css, components.css, animations.css)
│   ├── js/                     # JavaScript modules
│   │   ├── app.js              # Main application logic
│   │   ├── router.js           # Client-side routing
│   │   ├── api.js              # Backend communication
│   │   ├── onboarding.js       # User onboarding flow
│   │   ├── telegram-sdk.js     # Telegram Web Apps integration
│   │   ├── translations.js     # Localization support
│   │   └── modules/            # Feature modules (tasks, ai-chat, calendar, etc.)
│   └── assets/                 # Static assets (icons, images)
├── backend/                     # Server-side application
│   ├── server.js               # Express server entry point
│   ├── config/                 # Configuration (database.js, telegram.js)
│   ├── routes/                 # API route handlers (auth, tasks, ai, files, users)
│   ├── models/                 # Data models (User, Task, Attachment, Chat)
│   ├── services/               # Business logic (telegram-auth, perplexity-api, subscription)
│   ├── middleware/             # Express middleware (auth, rateLimit, validation)
│   └── database/               # Migrations directory
├── docs/                       # Architecture and planning documentation
└── package.json               # Dependencies and scripts
```

## Development Commands

```bash
# Core Development Commands
npm install                     # Install all dependencies
npm start                       # Start production server (unified server - API on 3001, static on 3000)
npm run dev                     # Start development server with nodemon auto-restart
npm run migrate                 # Run database migrations (executes backend/database/migrate.js)
npm test                        # Run universal testing system (test-universal.js)

# Server & Health Checks
curl http://localhost:3001/api/health    # Check API server status
curl http://localhost:3000                # Check static file server

# Database Operations
node backend/database/migrate.js         # Manual migration execution
psql $DATABASE_URL                       # Connect to PostgreSQL directly

# Development Workflow
npm run dev                              # Primary development command
npm test                                 # Verify setup and run tests
```

## Database Schema

PostgreSQL database with the following core tables:
- **users** - User profiles and Telegram authentication
- **tasks** - Todo items with due dates and repeat intervals
- **task_attachments** - Files stored via Telegram Bot API
- **ai_chats** & **ai_messages** - AI assistant conversation history
- **usage_stats** - Subscription usage tracking for rate limiting

## API Structure

API routes are organized in separate files:

### Authentication (routes/auth.js)
- `POST /api/auth/telegram` - Telegram Web Apps authentication
- `GET /api/auth/user` - Get current user info
- `PUT /api/auth/user` - Update user profile

### Tasks (routes/tasks.js)
- `GET /api/tasks` - Get user tasks with date filters
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Mark task as completed

### AI Chat (routes/ai.js)
- AI assistant functionality with Perplexity API integration

### File Attachments (routes/files.js)
- File upload/download via Telegram Bot API

### Users (routes/users.js)
- User management endpoints

## Subscription Model

**Free Plan**: 3 AI messages/day, 3 files per task (10MB each)
**Plus Plan**: 30 AI messages/day, 10 files per task (20MB each) - 149₽/month
**Pro Plan**: Unlimited usage, files up to 50MB - 299₽/month

## Design System

Apple-inspired UI with:
- **Color palette**: Primary blue (#007AFF), light theme with clean typography
- **Typography**: Inter font family
- **Animations**: Smooth 0.3s ease-in-out transitions
- **Components**: Card-based layout with 12px border-radius

## Important Development Notes

1. **Authentication**: Uses Telegram Web Apps API for user authentication - no traditional login system
2. **File Storage**: Files are stored via Telegram Bot API, not on local filesystem
3. **AI Integration**: Uses Perplexity API for the AI assistant functionality
4. **Localization**: Supports Russian and English languages
5. **Mobile-First**: Designed specifically for Telegram Web Apps on mobile devices
6. **Rate Limiting**: Built-in usage tracking and subscription-based limits

## Architecture Notes

### Frontend Architecture
- **Modular Design**: Feature-based modules in `js/modules/` directory
- **Router**: Client-side routing with `router.js`
- **API Layer**: Centralized backend communication via `api.js`
- **Telegram Integration**: `telegram-sdk.js` handles Web Apps API integration
- **Localization**: `translations.js` supports Russian/English languages

### Backend Architecture
- **Express.js**: RESTful API with middleware for auth, validation, and rate limiting
- **Services Layer**: Business logic separated into services (telegram-auth, perplexity-api, subscription)
- **Models**: Database models for User, Task, Attachment, Chat entities
- **Configuration**: Modular config files for database and Telegram settings

### Key Integrations
- **Telegram Bot API**: File storage and user authentication
- **Perplexity API**: AI assistant functionality
- **PostgreSQL**: Primary data storage with planned Redis caching

## Development Principles

- **Apple-inspired design** - clean, minimal UI with smooth transitions
- **Security-first** - proper validation, authentication, and error handling
- **Mobile-first** - optimized for Telegram Web Apps on mobile devices
- **Subscription-based rate limiting** - usage tracking and tier restrictions

## Environment Variables Required

Key environment variables needed in `.env` file:
- `PORT` - Server port (default: 3001)
- `FRONTEND_PORT` - Frontend port (default: 3000)  
- `FRONTEND_URL` - Frontend URL for CORS
- `DATABASE_URL` - PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` - Telegram Bot API token
- `PERPLEXITY_API_KEY` - Perplexity API key for AI assistant
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment (development/production)

## Server Configuration

- **Unified Server Architecture**: Single server.js handles both API (port 3001) and static files (port 3000)
- **CORS**: Configured for localhost development with credentials support
- **Request Limits**: 50MB for JSON/form data to support file uploads
- **Logging**: Automatic request logging with timestamps and IP addresses
- **Health Check**: Available at `/api/health` endpoint

## Testing System

Comprehensive universal testing system (`test-universal.js`) with three stages:
- **Early Stage (Stages 1-3)**: Infrastructure setup, basic functionality
- **Feature Stage (Stages 4-6)**: Core features, API endpoints, database integration
- **Production Stage (Stages 7-9)**: Performance, security, deployment readiness

Current project status: **Feature Stage** - focusing on API implementation and database setup.

### Testing Features
- **Auto-detection** of project stage based on available files and configurations
- **Smart recommendations** for next development steps
- **Performance metrics** tracking (server start time, DB response time, API response time)
- **Security checks** including CORS configuration and sensitive file protection
- **Load testing** for production readiness
- **Progress tracking** with visual indicators in Russian

## Critical Architectural Details

### Unified Server Architecture
The project uses a single `backend/server.js` file that serves both:
- **API endpoints** on port 3001 (Express.js routes with middleware)
- **Static files** on port 3000 (custom HTTP server with security features)

Key features:
- **CORS support** with credentials for localhost development
- **Request logging** with timestamps and IP addresses
- **Error handling** middleware with environment-aware disclosure
- **Security headers** and directory traversal protection
- **Graceful shutdown** handling (SIGTERM, SIGINT)

### Database Migrations
Complete PostgreSQL schema with 9 migration files in `backend/database/migrations/`:
- `001_create_users_table.sql` - User profiles and Telegram auth
- `002_create_tasks_table.sql` - Todo items with due dates and repeat
- `003_create_task_attachments_table.sql` - File attachments via Telegram Bot API
- `004_create_ai_chats_table.sql` & `005_create_ai_messages_table.sql` - AI assistant
- `006_create_usage_stats_table.sql` - Subscription usage tracking
- `007_create_user_sessions_table.sql` - Session management
- `008_add_missing_fields.sql` & `009_update_field_sizes.sql` - Schema updates

**Migration System**: Automated via `backend/database/migrate.js` with execution tracking.

### Security & Performance Features
- **File Upload Limits**: 50MB JSON/form data support
- **Static File Caching**: Proper cache headers by file type
- **SPA Routing Support**: Fallback to index.html for client-side routes
- **Sensitive File Protection**: Blocks .env, config files, dotfiles
- **Health Check Endpoint**: `/api/health` with server status and uptime
- **Request Rate Logging**: All API requests logged with method, path, IP

## Critical Development Notes

### Server Architecture Insights
- **Single Entry Point**: `backend/server.js` handles both API and static file serving
- **Port Configuration**: API on 3001, static files on 3000 (configurable via env vars)
- **Development Flow**: Use `npm run dev` for auto-restart during development
- **Production Ready**: Includes error handling, logging, and graceful shutdown

### Database Requirements
- **PostgreSQL 14+** required with proper DATABASE_URL configuration
- **Migration System**: Tracks executed migrations to prevent duplicates
- **Schema Complete**: All 9 migrations create full application schema

### API Structure
Routes organized by feature in `backend/routes/`:
- `auth.js` - Telegram Web Apps authentication
- `tasks.js` - CRUD operations for todo items
- `ai.js` - AI assistant integration (Perplexity API)
- `files.js` - File upload/download via Telegram Bot API
- `users.js` - User profile management

### Frontend Architecture
Modular JavaScript in `frontend/js/modules/`:
- `tasks.js` - Task management interface
- `ai-chat.js` - AI assistant chat interface
- `calendar.js` - Calendar view for tasks
- `settings.js` - User settings and preferences
- `file-upload.js` - File attachment functionality

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.