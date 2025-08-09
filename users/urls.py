from django.urls import path
from .views import ProfileView, UserProfileView, update_ai_usage, increment_ai_descriptions, increment_ai_chat_requests

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('profile/settings/', UserProfileView.as_view(), name='user-profile-settings'),
    path('profile/ai-usage/', update_ai_usage, name='update-ai-usage'),
    path('profile/ai-descriptions/increment/', increment_ai_descriptions, name='increment-ai-descriptions'),
    path('profile/ai-chat-requests/increment/', increment_ai_chat_requests, name='increment-ai-chat-requests'),
]