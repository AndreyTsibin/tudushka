from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Task, CustomPriority
from .serializers import TaskSerializer, TaskCompletionSerializer, CustomPrioritySerializer


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet для управления задачами"""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['completed', 'priority', 'date']
    
    def get_queryset(self):
        """Возвращаем только задачи текущего пользователя"""
        return Task.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Отметить задачу как выполненную"""
        task = self.get_object()
        serializer = TaskCompletionSerializer(task, data={'completed': True}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def uncomplete(self, request, pk=None):
        """Отменить выполнение задачи"""
        task = self.get_object()
        serializer = TaskCompletionSerializer(task, data={'completed': False}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Получить задачи на сегодня"""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def week(self, request):
        """Получить задачи на текущую неделю"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        tasks = self.get_queryset().filter(date__range=[week_start, week_end])
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def month(self, request):
        """Получить задачи на текущий месяц"""
        today = timezone.now().date()
        month_start = today.replace(day=1)
        next_month = month_start.replace(month=month_start.month + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
        month_end = next_month - timedelta(days=1)
        
        tasks = self.get_queryset().filter(date__range=[month_start, month_end])
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def completed(self, request):
        """Получить завершенные задачи"""
        tasks = self.get_queryset().filter(completed=True)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)


class CustomPriorityViewSet(viewsets.ModelViewSet):
    """ViewSet для управления пользовательскими приоритетами"""
    serializer_class = CustomPrioritySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Возвращаем только приоритеты текущего пользователя"""
        return CustomPriority.objects.filter(user=self.request.user)
