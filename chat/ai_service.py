import openai
import anthropic
import httpx
import json
from typing import Dict, Optional, Any
from django.conf import settings
from cryptography.fernet import Fernet
import base64
import logging

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Базовое исключение для AI сервиса"""
    pass


class APIKeyError(AIServiceError):
    """Ошибка с API ключом"""
    pass


class AIService:
    """Сервис для работы с различными AI моделями"""
    
    def __init__(self):
        # Ключ шифрования для API ключей (должен быть в настройках Django)
        self._encryption_key = self._get_encryption_key()
    
    def _get_encryption_key(self) -> bytes:
        """Получить ключ шифрования из настроек Django"""
        secret_key = settings.SECRET_KEY.encode()
        # Создаем 32-байтовый ключ из SECRET_KEY Django
        key = base64.urlsafe_b64encode(secret_key[:32].ljust(32, b'0'))
        return key
    
    def _encrypt_api_key(self, api_key: str) -> str:
        """Зашифровать API ключ"""
        if not api_key:
            return ""
        f = Fernet(self._encryption_key)
        return f.encrypt(api_key.encode()).decode()
    
    def _decrypt_api_key(self, encrypted_key: str) -> str:
        """Расшифровать API ключ"""
        if not encrypted_key:
            return ""
        try:
            f = Fernet(self._encryption_key)
            return f.decrypt(encrypted_key.encode()).decode()
        except Exception as e:
            logger.error(f"Ошибка расшифровки API ключа: {e}")
            raise APIKeyError("Невозможно расшифровать API ключ")
    
    def encrypt_and_save_api_key(self, user_profile, model_name: str, api_key: str):
        """Зашифровать и сохранить API ключ в профиле пользователя"""
        if not api_key:
            return
        
        encrypted_key = self._encrypt_api_key(api_key)
        
        if model_name == "chatgpt":
            user_profile.openai_api_key = encrypted_key
        elif model_name == "claude":
            user_profile.anthropic_api_key = encrypted_key
        elif model_name == "perplexity":
            user_profile.perplexity_api_key = encrypted_key
        
        user_profile.save()
    
    def get_admin_api_key(self, model_name: str) -> str:
        """Получить административный API ключ для модели из настроек Django"""
        from django.conf import settings
        
        if model_name == "chatgpt":
            key = getattr(settings, 'ADMIN_OPENAI_API_KEY', None)
            if not key:
                raise APIKeyError("Административный OpenAI API ключ не настроен")
            return key
        elif model_name == "claude":
            key = getattr(settings, 'ADMIN_ANTHROPIC_API_KEY', None)
            if not key:
                raise APIKeyError("Административный Anthropic API ключ не настроен")
            return key
        elif model_name == "perplexity":
            key = getattr(settings, 'ADMIN_PERPLEXITY_API_KEY', None)
            if not key:
                raise APIKeyError("Административный Perplexity API ключ не настроен")
            return key
        else:
            raise APIKeyError(f"Неподдерживаемая модель: {model_name}")
    
    async def generate_response(
        self, 
        user_profile, 
        message: str, 
        conversation_history: list = None
    ) -> str:
        """Генерация ответа с использованием выбранной AI модели"""
        model = user_profile.ai_model
        personality = user_profile.ai_personality or "Ты полезный AI ассистент."
        
        try:
            if model == "chatgpt":
                return await self._generate_openai_response(
                    user_profile, message, personality, conversation_history
                )
            elif model == "claude":
                return await self._generate_anthropic_response(
                    user_profile, message, personality, conversation_history
                )
            elif model == "perplexity":
                return await self._generate_perplexity_response(
                    user_profile, message, personality, conversation_history
                )
            else:
                raise AIServiceError(f"Неподдерживаемая модель: {model}")
                
        except APIKeyError:
            return f"❌ Для использования {model.upper()} необходимо указать API ключ в настройках."
        except Exception as e:
            logger.error(f"Ошибка генерации ответа {model}: {e}")
            return f"❌ Ошибка при обращении к {model.upper()}: {str(e)}"
    
    async def _generate_openai_response(
        self, 
        user_profile, 
        message: str, 
        personality: str, 
        conversation_history: list = None
    ) -> str:
        """Генерация ответа через OpenAI GPT"""
        api_key = self.get_admin_api_key("chatgpt")
        
        client = openai.AsyncOpenAI(api_key=api_key)
        
        messages = [
            {"role": "system", "content": personality}
        ]
        
        # Добавляем историю разговора
        if conversation_history:
            for msg in conversation_history[-10:]:  # Последние 10 сообщений
                role = "user" if msg['sender'] == 'user' else "assistant"
                messages.append({"role": role, "content": msg['text']})
        
        messages.append({"role": "user", "content": message})
        
        try:
            response = await client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            return response.choices[0].message.content
            
        except openai.AuthenticationError:
            raise APIKeyError("Неверный OpenAI API ключ")
        except openai.RateLimitError:
            return "❌ Превышен лимит запросов OpenAI. Попробуйте позже."
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise AIServiceError(f"Ошибка OpenAI API: {str(e)}")
    
    async def _generate_anthropic_response(
        self, 
        user_profile, 
        message: str, 
        personality: str, 
        conversation_history: list = None
    ) -> str:
        """Генерация ответа через Anthropic Claude"""
        api_key = self.get_admin_api_key("claude")
        
        client = anthropic.AsyncAnthropic(api_key=api_key)
        
        # Формируем историю для Claude
        conversation = ""
        if conversation_history:
            for msg in conversation_history[-10:]:
                role = "Human" if msg['sender'] == 'user' else "Assistant"
                conversation += f"{role}: {msg['text']}\n\n"
        
        conversation += f"Human: {message}\n\nAssistant:"
        
        try:
            response = await client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                system=personality,
                messages=[
                    {"role": "user", "content": conversation}
                ]
            )
            return response.content[0].text
            
        except anthropic.AuthenticationError:
            raise APIKeyError("Неверный Anthropic API ключ")
        except anthropic.RateLimitError:
            return "❌ Превышен лимит запросов Anthropic. Попробуйте позже."
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise AIServiceError(f"Ошибка Anthropic API: {str(e)}")
    
    async def _generate_perplexity_response(
        self, 
        user_profile, 
        message: str, 
        personality: str, 
        conversation_history: list = None
    ) -> str:
        """Генерация ответа через Perplexity AI"""
        api_key = self.get_admin_api_key("perplexity")
        
        messages = [
            {"role": "system", "content": personality}
        ]
        
        # Добавляем историю разговора
        if conversation_history:
            for msg in conversation_history[-10:]:
                role = "user" if msg['sender'] == 'user' else "assistant"
                messages.append({"role": role, "content": msg['text']})
        
        messages.append({"role": "user", "content": message})
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 401:
                    raise APIKeyError("Неверный Perplexity API ключ")
                elif response.status_code == 429:
                    return "❌ Превышен лимит запросов Perplexity. Попробуйте позже."
                
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
                
        except httpx.HTTPError as e:
            logger.error(f"Perplexity API error: {e}")
            raise AIServiceError(f"Ошибка Perplexity API: {str(e)}")
    
    def validate_api_key(self, model_name: str, api_key: str) -> Dict[str, Any]:
        """Валидация API ключа для модели"""
        if not api_key or not api_key.strip():
            return {
                "valid": False,
                "error": "API ключ не может быть пустым"
            }
        
        # Базовая проверка формата ключей
        if model_name == "chatgpt" and not api_key.startswith("sk-"):
            return {
                "valid": False,
                "error": "OpenAI API ключ должен начинаться с 'sk-'"
            }
        elif model_name == "claude" and not api_key.startswith("sk-ant-"):
            return {
                "valid": False,
                "error": "Anthropic API ключ должен начинаться с 'sk-ant-'"
            }
        elif model_name == "perplexity" and not api_key.startswith("pplx-"):
            return {
                "valid": False,
                "error": "Perplexity API ключ должен начинаться с 'pplx-'"
            }
        
        return {"valid": True}


# Создаем глобальный экземпляр сервиса
ai_service = AIService()