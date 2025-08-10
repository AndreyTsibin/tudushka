from rest_framework import serializers
from .models import ChatSession, ChatMessage
from .ai_service import ai_service
import asyncio
import logging

logger = logging.getLogger(__name__)


class ChatMessageSerializer(serializers.ModelSerializer):
    """Сериализатор для сообщений чата"""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'text', 'sender', 'created_at']
        read_only_fields = ['id', 'created_at']
        
    def create(self, validated_data):
        """Автоматически устанавливаем сессию из контекста"""
        validated_data['session'] = self.context['session']
        return super().create(validated_data)


class ChatSessionSerializer(serializers.ModelSerializer):
    """Сериализатор для сессий чата"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def get_message_count(self, obj):
        """Получаем количество сообщений в сессии"""
        return obj.messages.count()
        
    def create(self, validated_data):
        """Автоматически устанавливаем пользователя из запроса"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ChatSessionListSerializer(serializers.ModelSerializer):
    """Облегченный сериализатор для списка сессий чата (без сообщений)"""
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'message_count', 'last_message']
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def get_message_count(self, obj):
        """Получаем количество сообщений в сессии"""
        return obj.messages.count()
        
    def get_last_message(self, obj):
        """Получаем последнее сообщение в сессии"""
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'text': last_msg.text[:100] + '...' if len(last_msg.text) > 100 else last_msg.text,
                'sender': last_msg.sender,
                'created_at': last_msg.created_at
            }
        return None


class CreateChatMessageSerializer(serializers.ModelSerializer):
    """Специальный сериализатор для создания сообщений с автоматической генерацией AI ответа"""
    
    class Meta:
        model = ChatMessage
        fields = ['text']
        
    def create(self, validated_data):
        """Создаем пользовательское сообщение и генерируем AI ответ"""
        session = self.context['session']
        request = self.context['request']
        
        # Создаем сообщение пользователя
        user_message = ChatMessage.objects.create(
            session=session,
            text=validated_data['text'],
            sender='user'
        )
        
        # Генерируем AI ответ с использованием реального AI сервиса
        ai_response = self._generate_ai_response(
            request.user, 
            session, 
            validated_data['text']
        )
        
        ChatMessage.objects.create(
            session=session,
            text=ai_response,
            sender='ai'
        )
        
        return user_message
        
    def _generate_ai_response(self, user, session, user_text):
        """Генерация AI ответа с использованием настроек пользователя"""
        try:
            # Получаем профиль пользователя
            user_profile = getattr(user, 'profile', None)
            if not user_profile:
                return "❌ Не удалось найти настройки профиля пользователя."
            
            # Получаем историю сообщений для контекста (последние 10)
            conversation_history = []
            for msg in session.messages.all().order_by('created_at')[-10:]:
                conversation_history.append({
                    'sender': msg.sender,
                    'text': msg.text
                })
            
            # Генерируем ответ асинхронно
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                ai_response = loop.run_until_complete(
                    ai_service.generate_response(
                        user_profile=user_profile,
                        message=user_text,
                        conversation_history=conversation_history
                    )
                )
                return ai_response
            finally:
                loop.close()
                
        except Exception as e:
            logger.error(f"Ошибка генерации AI ответа: {e}")
            return f"❌ Произошла ошибка при генерации ответа: {str(e)}"