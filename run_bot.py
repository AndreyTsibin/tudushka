#!/usr/bin/env python3
"""
Запуск Telegram бота Tudushka
"""

import os
import sys
from pathlib import Path

# Добавляем корневую директорию проекта в PYTHONPATH
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Настраиваем Django окружение
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    import django
    django.setup()
except ImportError:
    print("❌ Django не найден. Убедитесь что виртуальное окружение активировано.")
    sys.exit(1)

# Импортируем и запускаем бота
from telegram_bot import main

if __name__ == "__main__":
    print("🚀 Запуск Telegram бота Tudushka...")
    print("💡 Для остановки нажмите Ctrl+C")
    main()