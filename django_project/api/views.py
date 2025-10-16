# django_project/api/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny, BasePermission
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from django.utils import timezone

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from .models import (
    Employer, SkilledLaborer, Administrator, Coordinator,
    Skill, LaborerSkills, JobPosting, JobApplication, 
    WorkHistory, Notification
)
from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserProfileSerializer,
    EmployerProfileSerializer, SkilledLaborerProfileSerializer,
    AdministratorProfileSerializer, CoordinatorProfileSerializer,
    SkillSerializer, LaborerSkillsSerializer, 
    JobPostingSerializer, JobPostingListSerializer,
    JobApplicationSerializer, JobApplicationListSerializer,
    WorkHistorySerializer, NotificationSerializer,
    CustomTokenObtainPairSerializer
)
from .permissions import (
    IsOwnerOrReadOnly, IsEmployerOrReadOnly, IsLaborerOrReadOnly,
    IsEmployerApplicantOwner, IsAdminOrOwner, IsEmployeeType
)

User = get_user_model()


class UserRegistrationView(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user_id': user.id,
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with additional user data"""
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user profiles (read-only)"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own profile
        if self.request.user.user_type == 'ADMIN':
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class EmployerProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for Employer profiles"""
    serializer_class = EmployerProfileSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        if self.request.user.user_type == 'ADMIN':
            return Employer.objects.all()
        elif self.request.user.user_type == 'EMPLOYER':
            return Employer.objects.filter(user=self.request.user)
        return Employer.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.user_type != 'EMPLOYER':
            serializer.save(user=self.request.user)


# UPDATED: We need a permission class that allows a user to edit their own profile
class IsSelf(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class SkilledLaborerProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for SkilledLaborer profiles"""
    serializer_class = SkilledLaborerProfileSerializer
    
    def get_permissions(self):
        # Admins can do anything. The user can update their own profile.
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSelf()]
        return [IsAuthenticated()]
        
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'ADMIN':
            return SkilledLaborer.objects.select_related('user').all()
        elif user.user_type == 'LABORER':
            return SkilledLaborer.objects.select_related('user').filter(user=user)
        return SkilledLaborer.objects.none()

    def get_object(self):
        # Override to allow PATCH by user ID for convenience from frontend
        queryset = self.get_queryset()
        obj = queryset.filter(user_id=self.kwargs['pk']).first()
        self.check_object_permissions(self.request, obj)
        return obj


class SkillViewSet(viewsets.ModelViewSet):
    """Admin-only ViewSet for Skills"""
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    # Allow read for any; restrict writes to admin
    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAdminUser()]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['skill_name', 'category']
    ordering_fields = ['skill_name', 'category']
    ordering = ['skill_name']


class LaborerSkillsViewSet(viewsets.ModelViewSet):
    """ViewSet for LaborerSkills"""
    serializer_class = LaborerSkillsSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        if self.request.user.user_type in ['ADMIN', 'COORDINATOR']:
            return LaborerSkills.objects.all()
        elif self.request.user.user_type == 'LABORER':
            return LaborerSkills.objects.filter(laborer__user=self.request.user)
        return LaborerSkills.objects.none()

    def perform_create(self, serializer):
        if self.request.user.user_type != 'LABORER':
            return Response({'error': 'Only laborers can add skills'}, status=status.HTTP_403_FORBIDDEN)
        try:
            laborer = self.request.user.skilledlaborer
        except AttributeError:
            # Auto-provision a minimal profile if missing (mirrors applications flow)
            laborer = SkilledLaborer.objects.create(user=self.request.user)
        serializer.save(laborer=laborer)


class JobPostingViewSet(viewsets.ModelViewSet):
    """ViewSet for Job Postings with employer restrictions"""
    # Allow read for any; writes restricted by custom permission
    permission_classes = [IsEmployerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['work_type', 'job_status', 'employer__business_type']
    search_fields = ['job_title', 'job_description', 'location']
    ordering_fields = ['created_at', 'start_date', 'budget_min', 'budget_max']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['list']:
            return JobPostingListSerializer
        return JobPostingSerializer
    
    def get_permissions(self):
        # Allow unauthenticated GET/HEAD/OPTIONS for public listings
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        return JobPosting.objects.select_related('employer', 'employer__user').all()
    
    def perform_create(self, serializer):
        # Ensure only employers can create job postings
        if self.request.user.user_type != 'EMPLOYER':
            raise PermissionError("Only employers can create job postings")
        serializer.save()
    
    def perform_update(self, serializer):
        # Only job owner can update
        employer_profile = self.get_object().employer
        if employer_profile.user != self.request.user:
            raise PermissionError("You can only edit your own job postings")
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        """Get applications for a specific job posting"""
        job_posting = self.get_object()
        
        if (request.user.user_type == 'EMPLOYER' and 
            job_posting.employer.user == request.user):
            applications = job_posting.jobapplication_set.select_related(
                'laborer', 'laborer__user'
            ).all()
            serializer = JobApplicationListSerializer(applications, many=True)
            return Response(serializer.data)
        elif request.user.user_type in ['ADMIN', 'COORDINATOR']:
            applications = job_posting.jobapplication_set.select_related(
                'laborer', 'laborer__user'
            ).all()
            serializer = JobApplicationListSerializer(applications, many=True)
            return Response(serializer.data)
        
        return Response({'error': 'Not authorized to view applications'}, 
                      status=status.HTTP_403_FORBIDDEN)


class JobApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for Job Applications with role-based permissions"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['application_status', 'job_posting__work_type']
    ordering_fields = ['applied_at']
    ordering = ['-applied_at']
    
    def get_serializer_class(self):
        if self.action in ['list']:
            return JobApplicationListSerializer
        return JobApplicationSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'LABORER':
            return JobApplication.objects.filter(
                laborer__user=user
            ).select_related('job_posting', 'laborer', 'laborer__user')
        
        elif user.user_type == 'EMPLOYER':
            return JobApplication.objects.filter(
                job_posting__employer__user=user
            ).select_related('job_posting', 'laborer', 'laborer__user')
        
        elif user.user_type in ['ADMIN', 'COORDINATOR']:
            return JobApplication.objects.select_related(
                'job_posting', 'laborer', 'laborer__user'
            ).all()
        
        return JobApplication.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.user_type != 'LABORER':
            raise PermissionError("Only skilled laborers can apply for jobs")
        serializer.save()

    def perform_update(self, serializer):
        # Get original status before saving
        original_status = serializer.instance.application_status
        updated_application = serializer.save()
        new_status = updated_application.application_status

        # If status changed to 'ACCEPTED', create a notification
        if new_status == 'ACCEPTED' and original_status != 'ACCEPTED':
            Notification.objects.create(
                recipient=updated_application.laborer.user,
                notification_type='APPLICATION_STATUS',
                message=f"Congratulations! Your application for '{updated_application.job_posting.job_title}' has been accepted."
            )

        # Also create or update WorkHistory record
        if new_status == 'ACCEPTED':
            WorkHistory.objects.update_or_create(
                job_posting=updated_application.job_posting,
                laborer=updated_application.laborer,
                defaults={
                    'employer': updated_application.job_posting.employer,
                    'work_status': 'IN_PROGRESS',
                    'started_at': timezone.now()
                }
            )


class WorkHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Work History"""
    serializer_class = WorkHistorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['work_status', 'laborer__experience_level']
    ordering_fields = ['started_at', 'completed_at']
    ordering = ['-started_at']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['ADMIN', 'COORDINATOR']:
            return WorkHistory.objects.select_related(
                'job_posting', 'laborer', 'laborer__user', 'employer'
            ).all()
        
        elif user.user_type == 'LABORER':
            return WorkHistory.objects.filter(
                laborer__user=user
            ).select_related('job_posting', 'laborer', 'laborer__user', 'employer')
        
        elif user.user_type == 'EMPLOYER':
            return WorkHistory.objects.filter(
                employer__user=user
            ).select_related('job_posting', 'laborer', 'laborer__user', 'employer')
        
        return WorkHistory.objects.none()


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'is_read', 'status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
        return Response({'message': 'Notification marked as read'})


# Additional utility views
class SearchView(APIView):
    """Generic search endpoint"""
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'all')
        
        results = {}
        
        if search_type in ['all', 'jobs']:
            jobs = JobPosting.objects.filter(
                Q(job_title__icontains=query) | 
                Q(job_description__icontains=query) |
                Q(location__icontains=query)
            )[:10]
            results['jobs'] = JobPostingListSerializer(jobs, many=True, context={'request': request}).data
        
        if search_type in ['all', 'skills']:
            skills = Skill.objects.filter(
                skill_name__icontains=query
            )[:10]
            results['skills'] = SkillSerializer(skills, many=True).data
        
        if (search_type in ['all', 'laborers'] and
            request.user.is_authenticated and
            request.user.user_type in ['EMPLOYER', 'ADMIN', 'COORDINATOR']):
            laborers = SkilledLaborer.objects.filter(
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(bio__icontains=query) |
                Q(skills__skill__skill_name__icontains=query)
            ).distinct()[:10]
            results['laborers'] = SkilledLaborerProfileSerializer(laborers, many=True).data
        
        return Response(results)


class DashboardView(APIView):
    """Dashboard data endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = {}
        
        if user.user_type == 'EMPLOYER':
            employer = user.employer
            data.update({
                'total_jobs': JobPosting.objects.filter(employer=employer).count(),
                'active_jobs': JobPosting.objects.filter(employer=employer, job_status='OPEN').count(),
                'total_applications': JobApplication.objects.filter(
                    job_posting__employer=employer
                ).count(),
                'pending_applications': JobApplication.objects.filter(
                    job_posting__employer=employer,
                    application_status='PENDING'
                ).count(),
            })
        
        elif user.user_type == 'LABORER' and hasattr(user, 'skilledlaborer'):
            laborer = user.skilledlaborer
            data.update({
                'total_applications': JobApplication.objects.filter(laborer=laborer).count(),
                'accepted_applications': JobApplication.objects.filter(
                    laborer=laborer,
                    application_status='ACCEPTED'
                ).count(),
                'completed_works': WorkHistory.objects.filter(
                    laborer=laborer,
                    work_status='COMPLETED'
                ).count(),
                'average_rating': WorkHistory.objects.filter(
                    laborer=laborer,
                    employer_rating__isnull=False
                ).aggregate(avg_rating=Avg('employer_rating'))['avg_rating'] or 0,
            })
        
        elif user.user_type in ['ADMIN', 'COORDINATOR']:
            data.update({
                'total_users': User.objects.count(),
                'total_jobs': JobPosting.objects.count(),
                'total_applications': JobApplication.objects.count(),
                'active_jobs': JobPosting.objects.filter(job_status='OPEN').count(),
            })
        
        data['unread_notifications'] = Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()
        
        return Response(data)