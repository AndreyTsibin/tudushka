#!/usr/bin/env python3
"""
Быстрый тест Telegram бота
"""

import asyncio
from telegram import Bot
from decouple import config

async def test_bot():
    """Тестируем базовую функциональность бота"""
    
    bot_token = config('TELEGRAM_BOT_TOKEN', default='')
    
    if not bot_token:
        print("❌ TELEGRAM_BOT_TOKEN не найден")
        return
    
    bot = Bot(token=bot_token)
    
    try:
        # Получаем информацию о боте
        bot_info = await bot.get_me()
        print("✅ Бот успешно подключен!")
        print(f"🤖 Имя: {bot_info.first_name}")
        print(f"📛 Username: @{bot_info.username}")
        print(f"🆔 ID: {bot_info.id}")
        
        # Устанавливаем команды бота
        commands = [
            ("start", "🚀 Запустить приложение"),
            ("help", "📚 Помощь и команды"),
            ("about", "ℹ️ О приложении")
        ]
        
        await bot.set_my_commands(commands)
        print("✅ Команды бота настроены")
        
        # Устанавливаем описание бота
        description = """Tudushka — умный планировщик задач с AI ассистентом! 🤖

🎯 Создавайте задачи с AI описаниями
💬 Общайтесь с персонализированным ассистентом  
🧠 Выбирайте между ChatGPT, Claude, Perplexity
📊 Управляйте приоритетами и дедлайнами

Нажмите /start чтобы начать! 🚀"""
        
        await bot.set_my_description(description)
        print("✅ Описание бота установлено")
        
        # Короткое описание
        short_description = "🤖 Умный планировщик задач с AI ассистентом"
        await bot.set_my_short_description(short_description)
        print("✅ Краткое описание установлено")
        
        print("\n🎉 Бот полностью настроен!")
        print("📱 Теперь пользователи могут:")
        print("   • Написать боту /start")
        print("   • Увидеть приветственное сообщение") 
        print("   • Запустить WebApp приложение")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(test_bot())