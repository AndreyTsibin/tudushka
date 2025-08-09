from rest_framework import serializers
from .models import Task, CustomPriority


class CustomPrioritySerializer(serializers.ModelSerializer):
    """Сериализатор для пользовательских приоритетов"""
    
    class Meta:
        model = CustomPriority
        fields = ['id', 'name', 'display_name', 'color', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def create(self, validated_data):
        """Автоматически устанавливаем пользователя из запроса"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    """Сериализатор для задач"""
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'time', 'date', 'priority', 'completed', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def create(self, validated_data):
        """Автоматически устанавливаем пользователя из запроса"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
        
    def validate_priority(self, value):
        """Валидация приоритета"""
        # Проверяем, что приоритет существует в стандартных вариантах или у пользователя
        user = self.context['request'].user
        standard_priorities = ['urgent', 'normal', 'low']
        
        if value in standard_priorities:
            return value
            
        # Проверяем пользовательские приоритеты
        user_priorities = CustomPriority.objects.filter(user=user, name=value)
        if user_priorities.exists():
            return value
            
        raise serializers.ValidationError(f"Неверный приоритет: {value}")


class TaskCompletionSerializer(serializers.ModelSerializer):
    """Специальный сериализатор для отметки выполнения задач"""
    
    class Meta:
        model = Task
        fields = ['id', 'completed']
        read_only_fields = ['id']