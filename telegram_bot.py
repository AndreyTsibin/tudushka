#!/usr/bin/env python3
"""
Telegram Bot для Tudushka
Обрабатывает команды и показывает приветственное сообщение
"""

import logging
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
from decouple import config

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class TudushkaBot:
    def __init__(self):
        self.bot_token = config('TELEGRAM_BOT_TOKEN', default='')
        self.webapp_url = config('WEBAPP_URL', default='https://yourdomain.com')
        
        if not self.bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN не найден в .env файле")
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start - приветственное сообщение"""
        user = update.effective_user
        
        # Приветственный текст
        welcome_text = f"""
🤖 <b>Привет, {user.first_name}!</b>

Добро пожаловать в <b>Тудушка</b> — умный планировщик задач с AI ассистентом! 

<b>🎯 Что умеет приложение:</b>
• 📝 Создание и управление задачами
• 🤖 AI генерация описаний задач (например: "приготовить борщ" → полный рецепт)
• 💬 Чат с AI ассистентом для планирования
• 🎨 Персонализация ассистента под ваш стиль
• 📊 Приоритеты и календарь задач
• 🌙 Темная и светлая темы

<b>🧠 AI модели на выбор:</b>
• ChatGPT — универсальный помощник
• Perplexity — с поиском в интернете

<b>💎 Тарифы:</b>
• Free — 3 AI описания в день
• Plus — 20 AI описаний + больше чата
• Pro — безлимитное использование

Готовы начать планировать с умом? 🚀
        """
        
        # Кнопка для запуска WebApp
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "🚀 Запустить Тудушка",
                web_app=WebAppInfo(url=self.webapp_url)
            )],
            [InlineKeyboardButton(
                "ℹ️ О приложении",
                callback_data="about"
            )]
        ])
        
        await update.message.reply_text(
            welcome_text,
            parse_mode='HTML',
            reply_markup=keyboard
        )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /help"""
        help_text = """
<b>📚 Команды бота:</b>

/start — Главное меню и запуск приложения
/help — Показать это сообщение
/about — Подробная информация о приложении

<b>🎯 Основные функции:</b>
• Создавайте задачи с AI описаниями
• Общайтесь с персонализированным ассистентом
• Выбирайте между ChatGPT, Claude, Perplexity
• Управляйте приоритетами и дедлайнами

Нажмите кнопку ниже, чтобы открыть приложение! 👇
        """
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "🚀 Открыть приложение",
                web_app=WebAppInfo(url=self.webapp_url)
            )]
        ])
        
        await update.message.reply_text(
            help_text,
            parse_mode='HTML',
            reply_markup=keyboard
        )
    
    async def about_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /about"""
        about_text = """
<b>🤖 Tudushka — AI-powered планировщик</b>

<b>Разработчик:</b> Tudushka Team
<b>Версия:</b> 1.0.0
<b>Технологии:</b> React + Django + PostgreSQL

<b>🎨 Особенности:</b>
• Полная интеграция с Telegram WebApp
• Безопасная авторизация через Telegram
• Оплата подписок через Telegram Stars
• Синхронизация данных в реальном времени

<b>🔒 Конфиденциальность:</b>
• Все данные зашифрованы
• AI ключи хранятся безопасно
• Персонализация остается приватной

<b>💰 Оплата:</b>
Используем Telegram Stars для удобной оплаты подписок прямо в мессенджере.

<b>📞 Поддержка:</b>
По вопросам пишите @support_tudushka
        """
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "🚀 Попробовать приложение",
                web_app=WebAppInfo(url=self.webapp_url)
            )],
            [InlineKeyboardButton(
                "🔙 Вернуться в меню",
                callback_data="back_to_start"
            )]
        ])
        
        await update.message.reply_text(
            about_text,
            parse_mode='HTML',
            reply_markup=keyboard
        )
    
    async def button_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик нажатий на кнопки"""
        query = update.callback_query
        await query.answer()
        
        if query.data == "about":
            await self.about_callback(query)
        elif query.data == "back_to_start":
            await self.start_callback(query)
    
    async def about_callback(self, query):
        """Показать информацию о приложении"""
        about_text = """
<b>🤖 Tudushka — AI-powered планировщик</b>

<b>🎯 Ключевые возможности:</b>
• <b>AI описания:</b> Умная генерация детальных описаний для любых задач
• <b>Персонализация:</b> Настройте стиль общения ассистента под себя  
• <b>Выбор AI:</b> ChatGPT, Claude или Perplexity — что вам больше нравится
• <b>Календарь:</b> Планируйте задачи на день, неделю, месяц
• <b>Приоритеты:</b> Создавайте свои категории важности

<b>💡 Примеры AI описаний:</b>
• "Купить продукты" → Список с учетом акций и полезных советов
• "Приготовить ужин" → Рецепт с ингредиентами и пошаговой инструкцией
• "Подготовиться к встрече" → План подготовки и список вопросов

Готовы повысить продуктивность? 🚀
        """
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "🚀 Запустить приложение",
                web_app=WebAppInfo(url=self.webapp_url)
            )],
            [InlineKeyboardButton(
                "🔙 Назад",
                callback_data="back_to_start"
            )]
        ])
        
        await query.edit_message_text(
            about_text,
            parse_mode='HTML',
            reply_markup=keyboard
        )
    
    async def start_callback(self, query):
        """Вернуться к стартовому сообщению"""
        user = query.from_user
        
        welcome_text = f"""
🤖 <b>Привет, {user.first_name}!</b>

Добро пожаловать в <b>Тудушка</b> — умный планировщик задач с AI ассистентом! 

<b>🎯 Что умеет приложение:</b>
• 📝 Создание и управление задачами
• 🤖 AI генерация описаний задач 
• 💬 Чат с AI ассистентом для планирования
• 🎨 Персонализация ассистента под ваш стиль
• 📊 Приоритеты и календарь задач

<b>🧠 AI модели на выбор:</b>
• ChatGPT — универсальный помощник
• Perplexity — с поиском в интернете

Готовы начать планировать с умом? 🚀
        """
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "🚀 Запустить Тудушка",
                web_app=WebAppInfo(url=self.webapp_url)
            )],
            [InlineKeyboardButton(
                "ℹ️ О приложении",
                callback_data="about"
            )]
        ])
        
        await query.edit_message_text(
            welcome_text,
            parse_mode='HTML',
            reply_markup=keyboard
        )
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик обычных сообщений"""
        await update.message.reply_text(
            "👋 Привет! Используйте команду /start чтобы открыть приложение, или /help для получения помощи."
        )
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик ошибок"""
        logger.error(f"Update {update} caused error {context.error}")
    
    def setup_handlers(self, app: Application):
        """Настройка обработчиков команд"""
        # Команды
        app.add_handler(CommandHandler("start", self.start_command))
        app.add_handler(CommandHandler("help", self.help_command))
        app.add_handler(CommandHandler("about", self.about_command))
        
        # Кнопки
        app.add_handler(CallbackQueryHandler(self.button_handler))
        
        # Обычные сообщения
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        # Ошибки
        app.add_error_handler(self.error_handler)
    
    async def run(self):
        """Запуск бота"""
        app = Application.builder().token(self.bot_token).build()
        self.setup_handlers(app)
        
        logger.info("🤖 Tudushka Bot запущен!")
        await app.run_polling()

async def main_async():
    """Асинхронная главная функция"""
    bot = TudushkaBot()
    await bot.run()

def main():
    """Основная функция"""
    try:
        # Проверяем, есть ли уже запущенный event loop
        try:
            loop = asyncio.get_running_loop()
            # Если есть запущенный loop, создаем task
            loop.create_task(main_async())
        except RuntimeError:
            # Если нет активного loop, создаем новый
            asyncio.run(main_async())
    except ValueError as e:
        print(f"❌ Ошибка конфигурации: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Бот остановлен")
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")

if __name__ == "__main__":
    main()