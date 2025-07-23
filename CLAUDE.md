# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Тудушка** is a Telegram Mini App with ToDo functionality and AI assistant for task planning. This is a greenfield project currently in the planning/documentation stage with comprehensive architecture documentation but no implementation code yet.

## Development Workflow

This project follows a **10-stage iterative development approach** as outlined in `docs/PLANNING.md`. Each stage must be completed with working functionality before proceeding to the next.

### Current Status: Pre-Implementation
- Only documentation exists (`docs/ARCHITECTURE.md`, `docs/PLANNING.md`)
- No package.json, dependencies, or code implementation yet
- Next step: Begin Stage 1 (Project Foundation Setup)

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

## Project Structure (Planned)

```
tudushka/
├── frontend/                    # Client-side application
│   ├── index.html              # Main entry point
│   ├── css/                    # Styles (main.css, components.css, animations.css)
│   ├── js/                     # JavaScript modules
│   │   ├── app.js              # Main application logic
│   │   ├── router.js           # Client-side routing
│   │   ├── api.js              # Backend communication
│   │   └── modules/            # Feature modules (tasks, calendar, ai-chat, etc.)
│   └── assets/                 # Static assets
├── backend/                     # Server-side application
│   ├── server.js               # Express server entry point
│   ├── config/                 # Configuration files
│   ├── routes/                 # API route handlers
│   ├── models/                 # Data models (User, Task, Attachment, Chat)
│   ├── services/               # Business logic services
│   ├── middleware/             # Express middleware
│   ├── utils/                  # Utility functions
│   └── database/               # Migrations and seeds
├── .env.example                # Environment variables template
└── docs/                       # Documentation
```

## Key Development Commands

**Note: No development commands are available yet** - the project needs initial setup. Based on the architecture, the following commands should be implemented during Stage 1:

### Planned Commands (to be implemented):
```bash
# Development
npm start                       # Start development server
npm run dev                     # Development mode with hot reload
npm run build                   # Build for production
npm test                        # Run tests
npm run lint                    # Lint code
npm run typecheck              # Type checking (if TypeScript added)

# Database
npm run db:migrate             # Run database migrations
npm run db:seed                # Seed database with initial data
npm run db:reset               # Reset database

# Docker (planned)
docker-compose up              # Start local development environment
docker-compose down            # Stop local environment
```

## Database Schema

PostgreSQL database with the following core tables:
- **users** - User profiles and Telegram authentication
- **tasks** - Todo items with due dates and repeat intervals
- **task_attachments** - Files stored via Telegram Bot API
- **ai_chats** & **ai_messages** - AI assistant conversation history
- **usage_stats** - Subscription usage tracking for rate limiting

## API Structure (Planned)

### Authentication
- `POST /api/auth/telegram` - Telegram Web Apps authentication
- `GET /api/auth/user` - Get current user info
- `PUT /api/auth/user` - Update user profile

### Tasks
- `GET /api/tasks` - Get user tasks with date filters
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Mark task as completed

### AI Chat
- `GET /api/ai/chats` - Get user's chat list
- `POST /api/ai/chats/:id/messages` - Send message to AI assistant

### File Attachments
- `POST /api/tasks/:id/attachments` - Upload file via Telegram Bot API
- `GET /api/tasks/:id/attachments` - Get task attachments

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

## Development Principles

- **Iterative development** with working functionality at each stage
- **Test locally** before proceeding to next development stage
- **Apple-inspired design** - prioritize functionality first, then aesthetics
- **Security-first** approach with proper validation and error handling
- **Performance optimization** with Redis caching and database indexing

## Next Steps

To begin development, start with Stage 1 tasks from `docs/PLANNING.md`:
1. Create `package.json` with dependencies
2. Set up Git repository and `.gitignore`
3. Create `.env` files based on architecture specifications
4. Initialize basic Express server
5. Set up PostgreSQL database connection