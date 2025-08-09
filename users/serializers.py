from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserSerializer(serializers.ModelSerializer):
    """Базовый сериализатор для пользователя"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    """Сериализатор для профиля пользователя"""
    
    # Включаем computed properties
    ai_descriptions_limit = serializers.ReadOnlyField()
    ai_chat_requests_limit = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = [
            'language', 'theme', 'ai_personality', 'ai_model', 'plan',
            'ai_descriptions_used', 'ai_chat_requests_used', 'ai_usage_last_reset',
            'ai_descriptions_limit', 'ai_chat_requests_limit',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'ai_descriptions_limit', 'ai_chat_requests_limit']


class UserWithProfileSerializer(serializers.ModelSerializer):
    """Полный сериализатор пользователя с профилем"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'profile']
        read_only_fields = ['id', 'date_joined']


class AIUsageUpdateSerializer(serializers.ModelSerializer):
    """Специальный сериализатор для обновления AI usage"""
    
    class Meta:
        model = UserProfile
        fields = ['ai_descriptions_used', 'ai_chat_requests_used', 'ai_usage_last_reset']
        read_only_fields = ['ai_usage_last_reset']
        
    def validate_ai_descriptions_used(self, value):
        """Валидация лимита описаний"""
        profile = self.instance
        if value > profile.ai_descriptions_limit:
            raise serializers.ValidationError(
                f"Превышен лимит описаний AI: {profile.ai_descriptions_limit}"
            )
        return value
        
    def validate_ai_chat_requests_used(self, value):
        """Валидация лимита чат-запросов"""
        profile = self.instance  
        if value > profile.ai_chat_requests_limit:
            raise serializers.ValidationError(
                f"Превышен лимит чат-запросов AI: {profile.ai_chat_requests_limit}"
            )
        return value