import uuid
from django.db import models
from django.contrib.auth.models import User


class CustomPriority(models.Model):
    """Пользовательские приоритеты для задач"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, verbose_name="Название")
    display_name = models.CharField(max_length=100, verbose_name="Отображаемое название")  
    color = models.CharField(max_length=7, default="#3b82f6", verbose_name="Цвет")
    is_default = models.BooleanField(default=False, verbose_name="По умолчанию")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="custom_priorities", verbose_name="Пользователь")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Пользовательский приоритет"
        verbose_name_plural = "Пользовательские приоритеты"
        ordering = ["display_name"]

    def __str__(self):
        return f"{self.display_name} ({self.user.username})"


class Task(models.Model):
    """Модель задачи"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    time = models.TimeField(verbose_name="Время")
    date = models.DateField(verbose_name="Дата")
    priority = models.CharField(max_length=50, default="normal", verbose_name="Приоритет")
    completed = models.BooleanField(default=False, verbose_name="Выполнено")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks", verbose_name="Пользователь")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Задача"
        verbose_name_plural = "Задачи"
        ordering = ["date", "time"]

    def __str__(self):
        return f"{self.title} ({self.date} {self.time})"
