from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserWithProfileSerializer, UserProfileSerializer, AIUsageUpdateSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """Просмотр и редактирование профиля пользователя"""
    serializer_class = UserWithProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Просмотр и редактирование настроек профиля"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Получаем или создаем профиль для пользователя
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_ai_usage(request):
    """Обновление статистики использования AI"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    serializer = AIUsageUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])  
def increment_ai_descriptions(request):
    """Увеличить счетчик использованных AI описаний"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    if profile.ai_descriptions_used >= profile.ai_descriptions_limit:
        return Response(
            {'error': f'Превышен лимит AI описаний: {profile.ai_descriptions_limit}'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    profile.ai_descriptions_used += 1
    profile.save()
    
    return Response({
        'ai_descriptions_used': profile.ai_descriptions_used,
        'ai_descriptions_limit': profile.ai_descriptions_limit
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def increment_ai_chat_requests(request):
    """Увеличить счетчик использованных AI чат-запросов"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    if profile.ai_chat_requests_used >= profile.ai_chat_requests_limit:
        return Response(
            {'error': f'Превышен лимит AI чат-запросов: {profile.ai_chat_requests_limit}'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    profile.ai_chat_requests_used += 1
    profile.save()
    
    return Response({
        'ai_chat_requests_used': profile.ai_chat_requests_used,
        'ai_chat_requests_limit': profile.ai_chat_requests_limit
    })
