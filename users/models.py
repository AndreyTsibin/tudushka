from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """Расширение модели User с настройками приложения"""
    
    LANGUAGE_CHOICES = [
        ('ru', 'Русский'),
        ('en', 'English'),
    ]
    
    THEME_CHOICES = [
        ('light', 'Светлая'),
        ('dark', 'Темная'),
    ]
    
    AI_MODEL_CHOICES = [
        ('chatgpt', 'ChatGPT'),
        ('claude', 'Claude'),
        ('perplexity', 'Perplexity'),
    ]
    
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('plus', 'Plus'),
        ('pro', 'Pro'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile", verbose_name="Пользователь")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='ru', verbose_name="Язык")
    theme = models.CharField(max_length=5, choices=THEME_CHOICES, default='light', verbose_name="Тема")
    ai_personality = models.TextField(blank=True, verbose_name="Личность AI")
    ai_model = models.CharField(max_length=10, choices=AI_MODEL_CHOICES, default='chatgpt', verbose_name="Модель AI")
    plan = models.CharField(max_length=4, choices=PLAN_CHOICES, default='free', verbose_name="Тарифный план")
    
    # AI Usage данные
    ai_descriptions_used = models.IntegerField(default=0, verbose_name="Использовано описаний AI")
    ai_chat_requests_used = models.IntegerField(default=0, verbose_name="Использовано запросов чата AI")
    ai_usage_last_reset = models.DateField(auto_now_add=True, verbose_name="Последний сброс лимитов AI")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"

    def __str__(self):
        return f"Профиль {self.user.username}"
    
    @property
    def ai_descriptions_limit(self):
        """Лимит AI описаний в зависимости от плана"""
        limits = {'free': 3, 'plus': 10, 'pro': 20}
        return limits.get(self.plan, 3)
    
    @property
    def ai_chat_requests_limit(self):
        """Лимит AI чат запросов в зависимости от плана"""  
        limits = {'free': 3, 'plus': 20, 'pro': 100}
        return limits.get(self.plan, 3)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Автоматическое создание профиля при регистрации пользователя"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User) 
def save_user_profile(sender, instance, **kwargs):
    """Автоматическое сохранение профиля при сохранении пользователя"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
