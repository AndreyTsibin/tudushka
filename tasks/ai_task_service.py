import asyncio
import logging
from chat.ai_service import ai_service, AIServiceError

logger = logging.getLogger(__name__)


class TaskAIService:
    """Сервис для генерации описаний задач с помощью AI"""
    
    def generate_task_description(self, user_profile, task_title: str, language: str = "ru") -> str:
        """
        Генерация описания задачи на основе заголовка
        
        Args:
            user_profile: Профиль пользователя с AI настройками
            task_title: Заголовок задачи
            language: Язык для генерации ("ru" или "en")
            
        Returns:
            str: Сгенерированное описание задачи
        """
        try:
            if not task_title.strip():
                return "❌ Заголовок задачи не может быть пустым для генерации описания."
            
            # Формируем промпт в зависимости от языка
            if language == "ru":
                system_prompt = """Ты - полезный AI ассистент для планирования задач. 
                Твоя задача - создавать детальные, практичные описания для задач на основе их заголовков.
                
                Правила:
                1. Создавай конкретные, действенные описания
                2. Включай пошаговые инструкции, если это уместно
                3. Добавляй полезные советы и детали
                4. Для рецептов - указывай ингредиенты и способ приготовления
                5. Для покупок - составляй списки
                6. Для встреч - указывай что обсудить
                7. Описание должно быть 2-4 предложения
                
                Отвечай только текстом описания, без дополнительных фраз."""
                
                user_prompt = f"Создай подробное описание для задачи: {task_title}"
            else:
                system_prompt = """You are a helpful AI assistant for task planning.
                Your task is to create detailed, practical descriptions for tasks based on their titles.
                
                Rules:
                1. Create specific, actionable descriptions
                2. Include step-by-step instructions when appropriate  
                3. Add useful tips and details
                4. For recipes - specify ingredients and cooking method
                5. For shopping - make lists
                6. For meetings - specify what to discuss
                7. Description should be 2-4 sentences
                
                Reply only with the description text, no additional phrases."""
                
                user_prompt = f"Create a detailed description for the task: {task_title}"
            
            # Временно изменяем персонализацию для генерации описаний
            original_personality = user_profile.ai_personality
            user_profile.ai_personality = system_prompt
            
            # Генерируем ответ
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                description = loop.run_until_complete(
                    ai_service.generate_response(
                        user_profile=user_profile,
                        message=user_prompt,
                        conversation_history=[]
                    )
                )
                
                # Восстанавливаем оригинальную персонализацию
                user_profile.ai_personality = original_personality
                
                return description.strip()
                
            finally:
                loop.close()
                
        except AIServiceError as e:
            logger.error(f"AI service error for task description: {e}")
            return str(e)
        except Exception as e:
            logger.error(f"Unexpected error generating task description: {e}")
            
            # Возвращаем базовые описания в случае ошибки
            return self._get_fallback_description(task_title, language)
    
    def _get_fallback_description(self, task_title: str, language: str) -> str:
        """Резервные описания на случай ошибки AI"""
        title_lower = task_title.lower()
        
        if language == "ru":
            # Ключевые слова и соответствующие описания на русском
            keywords = {
                "борщ": "Приготовить наваристый борщ с мясом. Понадобится: свекла, капуста, морковь, лук, картофель, мясо, томатная паста. Варить 2-3 часа на медленном огне.",
                "покупки": "Составить список необходимых товаров и посетить магазин. Проверить акции и скидки.",
                "встреча": "Подготовиться к встрече: определить повестку дня, подготовить материалы, выбрать место и время.",
                "спорт": "Выполнить физические упражнения для поддержания формы. Подобрать подходящую программу тренировок.",
                "работа": "Выполнить рабочие задачи согласно плану. Проверить дедлайны и приоритеты.",
                "учеба": "Изучить учебный материал, сделать конспекты, подготовиться к экзаменам или зачетам."
            }
            
            for keyword, description in keywords.items():
                if keyword in title_lower:
                    return description
                    
            return "Выполнить поставленную задачу согласно плану. Проверить все детали и требования."
        else:
            # Ключевые слова на английском
            keywords = {
                "shopping": "Create a shopping list and visit the store. Check for deals and discounts.",
                "meeting": "Prepare for the meeting: set agenda, prepare materials, choose time and place.",
                "exercise": "Perform physical exercises to stay fit. Choose appropriate workout program.",
                "work": "Complete work tasks according to the plan. Check deadlines and priorities.",
                "study": "Study the material, make notes, prepare for exams or tests.",
                "cook": "Prepare the dish following recipe instructions. Gather all necessary ingredients."
            }
            
            for keyword, description in keywords.items():
                if keyword in title_lower:
                    return description
                    
            return "Complete the assigned task according to the plan. Check all details and requirements."


# Создаем глобальный экземпляр сервиса
task_ai_service = TaskAIService()