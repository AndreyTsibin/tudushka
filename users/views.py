from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.conf import settings
from urllib import request as urlrequest
import json
import time
from .telegram import verify_telegram_init_data
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


@api_view(['POST'])
@permission_classes([AllowAny])
def telegram_auth(request):
    """Authenticate user via Telegram WebApp init data."""
    if not settings.TELEGRAM_BOT_TOKEN:
        return Response({'detail': 'Telegram bot not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    init_data = request.data.get('init_data')
    if not init_data:
        return Response({'detail': 'Init data is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    data = verify_telegram_init_data(init_data, settings.TELEGRAM_BOT_TOKEN)
    if not data or 'user' not in data:
        return Response({'detail': 'Invalid auth data'}, status=status.HTTP_400_BAD_REQUEST)
    tg_user = data['user']
    username = tg_user.get('username') or f"tg_{tg_user['id']}"
    user, _ = User.objects.get_or_create(
        username=username,
        defaults={'first_name': tg_user.get('first_name', ''), 'last_name': tg_user.get('last_name', '')}
    )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_star_invoice(request):
    """Create Telegram Stars invoice link."""
    if not settings.TELEGRAM_BOT_TOKEN:
        return Response({'detail': 'Telegram bot not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    amount = request.data.get('amount')
    if amount is None:
        return Response({'detail': 'amount required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        amount = int(amount)
        if amount <= 0:
            return Response({'detail': 'amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'detail': 'invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
    payload = f"stars_{request.user.id}_{int(time.time())}"
    data = {
        'title': 'Stars purchase',
        'description': 'Purchase stars',
        'payload': payload,
        'currency': 'XTR',
        'prices': [{'label': 'Stars', 'amount': int(amount)}],
    }
    req = urlrequest.Request(
        f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/createInvoiceLink",
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urlrequest.urlopen(req, timeout=10) as resp:
        return Response(json.load(resp))
