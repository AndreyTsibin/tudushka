from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import ChatSession, ChatMessage
from .serializers import (
    ChatSessionSerializer, ChatSessionListSerializer, 
    ChatMessageSerializer, CreateChatMessageSerializer
)


class ChatSessionViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сессиями чата"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Возвращаем разные сериализаторы для разных действий"""
        if self.action == 'list':
            return ChatSessionListSerializer
        return ChatSessionSerializer
    
    def get_queryset(self):
        """Возвращаем только сессии текущего пользователя"""
        return ChatSession.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Получить все сообщения сессии"""
        session = self.get_object()
        messages = session.messages.all()
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Отправить сообщение в сессию (с автоматическим AI ответом)"""
        session = self.get_object()
        serializer = CreateChatMessageSerializer(
            data=request.data,
            context={'session': session, 'request': request}
        )
        
        if serializer.is_valid():
            # Проверяем лимиты AI запросов
            try:
                profile = request.user.profile
                if profile.ai_chat_requests_used >= profile.ai_chat_requests_limit:
                    return Response(
                        {'error': f'Превышен лимит AI чат-запросов: {profile.ai_chat_requests_limit}'},
                        status=status.HTTP_429_TOO_MANY_REQUESTS
                    )
                
                # Увеличиваем счетчик
                profile.ai_chat_requests_used += 1
                profile.save()
                
            except Exception:
                # Если профиля нет, создаем его
                from users.models import UserProfile
                profile = UserProfile.objects.create(user=request.user)
                profile.ai_chat_requests_used = 1
                profile.save()
            
            user_message = serializer.save()
            
            # Возвращаем все сообщения сессии после добавления
            messages = session.messages.all()
            message_serializer = ChatMessageSerializer(messages, many=True)
            return Response(message_serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatMessageViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сообщениями чата"""
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Возвращаем только сообщения из сессий текущего пользователя"""
        return ChatMessage.objects.filter(session__user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Переопределяем создание для установки сессии"""
        session_id = request.data.get('session_id')
        if not session_id:
            return Response(
                {'error': 'session_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        
        serializer = self.get_serializer(
            data=request.data,
            context={'session': session, 'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
