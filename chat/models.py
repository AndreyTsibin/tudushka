import uuid
from django.db import models
from django.contrib.auth.models import User


class ChatSession(models.Model):
    """Модель сессии чата с AI"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="Название сессии")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_sessions", verbose_name="Пользователь")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Сессия чата"
        verbose_name_plural = "Сессии чата"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class ChatMessage(models.Model):
    """Модель сообщения в чате"""
    
    SENDER_CHOICES = [
        ('user', 'Пользователь'),
        ('ai', 'AI'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages", verbose_name="Сессия")
    text = models.TextField(verbose_name="Текст сообщения")
    sender = models.CharField(max_length=4, choices=SENDER_CHOICES, verbose_name="Отправитель")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Время отправки")

    class Meta:
        verbose_name = "Сообщение чата"
        verbose_name_plural = "Сообщения чата"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.text[:50]}..." if len(self.text) > 50 else f"{self.sender}: {self.text}"
