# Тудушка

Todo приложение с AI ассистентом.

## Технологии

- **Frontend**: React + TypeScript
- **Backend**: Django + Python  
- **Database**: PostgreSQL

## Установка

```bash
# Frontend
npm install
npm start

# Backend
pip install -r requirements.txt
python manage.py runserver
```

## Telegram

Приложение поддерживает авторизацию через Telegram WebApp и платежи через Telegram Stars. Укажите переменную `TELEGRAM_BOT_TOKEN` в `.env`.

## Docker

Для запуска приложения на удаленном сервере используйте Docker:

```bash
docker-compose up --build
```
