from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

router = DefaultRouter()
router.register(r'users/profile', views.UserProfileViewSet, basename='user-profile')
router.register(r'employers', views.EmployerProfileViewSet, basename='employer')
router.register(r'laborers', views.SkilledLaborerProfileViewSet, basename='laborer')
router.register(r'skills', views.SkillViewSet, basename='skill')
router.register(r'laborer-skills', views.LaborerSkillsViewSet, basename='laborer-skills')
router.register(r'jobs', views.JobPostingViewSet, basename='job-posting')
router.register(r'applications', views.JobApplicationViewSet, basename='job-application')
router.register(r'work-history', views.WorkHistoryViewSet, basename='work-history')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Utility endpoints
    path('search/', views.SearchView.as_view(), name='search'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    
    # Include router URLs
    path('', include(router.urls)),
]






