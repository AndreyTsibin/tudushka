# Database Migrations

This directory contains the PostgreSQL database migrations for the Tudushka project.

## Usage

### Run Migrations
```bash
npm run migrate run
# or
node backend/database/migrate.js run
```

### Check Migration Status
```bash
npm run migrate status
# or  
node backend/database/migrate.js status
```

### Rollback Last Migration
```bash
npm run migrate rollback
# or
node backend/database/migrate.js rollback
```

### Rollback to Specific Migration
```bash
node backend/database/migrate.js rollback 003_create_task_attachments_table.sql
```

## Environment Setup

Make sure you have the following environment variable set in your `.env` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/tudushka_db
```

## Migration Files

1. **001_create_users_table.sql** - Users table with Telegram authentication
2. **002_create_tasks_table.sql** - Tasks table with AI integration and repeat functionality  
3. **003_create_task_attachments_table.sql** - File attachments stored via Telegram Bot API
4. **004_create_ai_chats_table.sql** - AI chat sessions
5. **005_create_ai_messages_table.sql** - AI chat messages
6. **006_create_usage_stats_table.sql** - Usage tracking for subscription limits
7. **007_create_user_sessions_table.sql** - Session storage for rate limiting
8. **008_add_missing_fields.sql** - Additional fields to match documentation
9. **009_update_field_sizes.sql** - Field size updates and documentation compliance

## Database Schema Overview

### Core Tables
- **users** - User profiles and subscription data
- **tasks** - Todo items with due dates and AI context
- **task_attachments** - Files linked to tasks (with mime_type support)
- **ai_chats** - AI conversation sessions
- **ai_messages** - Individual messages in AI chats (with tokens tracking)
- **usage_stats** - Daily usage tracking per user (AI messages + file uploads)
- **user_sessions** - Session storage for rate limiting and authentication

### Key Features
- **Automatic timestamps** with updated_at triggers
- **Cascading deletes** to maintain referential integrity
- **Performance indexes** on frequently queried columns
- **Subscription-based limits** with usage tracking
- **Rollback support** for safe schema changes

## Performance Indexes

The following indexes are created for optimal query performance:

- User lookups by telegram_id
- Task filtering by user_id, due_date, and completion status
- File attachments by task_id
- AI chat messages by chat_id and timestamp
- Usage stats by user_id and date

## Functions and Views

### Utility Functions
- `update_updated_at_column()` - Automatically updates timestamp fields
- `set_completed_at()` - Sets completion timestamp when task is marked done
- `get_or_create_usage_stats()` - Gets or creates daily usage record
- `increment_ai_messages()` - Safely increments AI message count with token tracking
- `increment_file_uploads()` - Tracks daily file upload count per user
- `cleanup_expired_sessions()` - Removes expired user sessions

### Views  
- `current_usage_stats` - Combined view of user limits, current usage, and file limits