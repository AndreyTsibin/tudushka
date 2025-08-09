from rest_framework import serializers
from .models import ChatSession, ChatMessage


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
        
        # Создаем сообщение пользователя
        user_message = ChatMessage.objects.create(
            session=session,
            text=validated_data['text'],
            sender='user'
        )
        
        # Здесь можно добавить логику генерации AI ответа
        # Пока создаем заглушку
        ai_response = self._generate_ai_response(validated_data['text'])
        
        ChatMessage.objects.create(
            session=session,
            text=ai_response,
            sender='ai'
        )
        
        return user_message
        
    def _generate_ai_response(self, user_text):
        """Заглушка для генерации AI ответа"""
        # TODO: Интеграция с реальным AI API
        responses = [
            "Это интересный вопрос! Давайте разберем его подробнее.",
            "Я понимаю вашу задачу. Вот что я могу предложить:",
            "Отличная идея! Могу помочь вам с планированием.",
            "Рассмотрим несколько вариантов решения:",
            "Это важная тема. Позвольте мне поделиться некоторыми мыслями."
        ]
        
        # Простая логика выбора ответа на основе длины текста
        import random
        return random.choice(responses)