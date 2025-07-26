# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Тудушка** - новый проект на основе React + Django архитектуры.

## Project Structure

```
tudushka/
├── frontend/           # React + TypeScript frontend
├── backend/            # Django backend
├── requirements.txt    # Python dependencies
├── package.json        # Node.js dependencies
└── README.md          # Project documentation
```

## Development Commands

```bash
# Frontend (React)
npm install            # Install dependencies
npm start             # Start development server
npm run build         # Build for production

# Backend (Django)
pip install -r requirements.txt    # Install dependencies
python manage.py runserver         # Start development server
python manage.py migrate          # Run migrations
```

## Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Django + Python
- **Database**: PostgreSQL