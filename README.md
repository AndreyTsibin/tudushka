# Тудушка (Tudushka)

Telegram Mini App - Todo with AI Assistant

## Overview

Тудушка is a Telegram Mini App that provides todo functionality with an integrated AI assistant for task planning. Built with vanilla JavaScript frontend and Node.js backend.

## Tech Stack

### Frontend
- Vanilla HTML/CSS/JavaScript (ES6+)
- Telegram Web Apps API
- Apple-inspired design system

### Backend
- Node.js + Express.js
- PostgreSQL database
- Redis for caching
- Telegram Bot API for file storage
- Perplexity API for AI assistant

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your `.env` file with:
   - Database connection details
   - Telegram Bot token
   - Perplexity API key
   - JWT secrets

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Features

- ✅ Todo management with due dates
- 🔄 Recurring tasks
- 📎 File attachments via Telegram Bot API
- 🤖 AI assistant for task planning
- 📱 Telegram Mini App integration
- 🌍 Russian/English localization

## Subscription Plans

- **Free**: 3 AI messages/day, 3 files per task (10MB each)
- **Plus**: 30 AI messages/day, 10 files per task (20MB each) - 149₽/month
- **Pro**: Unlimited usage, files up to 50MB - 299₽/month

## Development Commands

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations

## Project Structure

```
tudushka/
├── frontend/           # Client-side application
├── backend/           # Server-side application
├── docs/             # Documentation
└── package.json      # Dependencies and scripts
```