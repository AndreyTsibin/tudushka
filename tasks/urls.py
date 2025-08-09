from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CustomPriorityViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'priorities', CustomPriorityViewSet, basename='priority')

urlpatterns = router.urls