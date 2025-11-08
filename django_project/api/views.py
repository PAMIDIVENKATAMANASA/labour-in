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
    WorkHistory, Notification, ContactSubmission
)
from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserProfileSerializer,
    EmployerProfileSerializer, SkilledLaborerProfileSerializer,
    AdministratorProfileSerializer, CoordinatorProfileSerializer,
    SkillSerializer, LaborerSkillsSerializer, 
    JobPostingSerializer, JobPostingListSerializer,
    JobApplicationSerializer, JobApplicationListSerializer,
    WorkHistorySerializer, NotificationSerializer,
    CustomTokenObtainPairSerializer,
    AdminUserUpdateSerializer,
    ContactSubmissionSerializer
)
from .permissions import (
    IsOwnerOrReadOnly, IsEmployerOrReadOnly, IsLaborerOrReadOnly,
    IsEmployerApplicantOwner, IsAdminOrOwner, IsEmployeeType,
    IsCoordinatorOrOwnerOrReadOnly
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


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for user profiles (read-only)"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use a special serializer for admin updates."""
        # For updates (PUT/PATCH), use the serializer that allows 'user_type' modification
        if self.request.user.user_type == 'ADMIN' and self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        
        # For all other actions (list, retrieve, non-admin updates), use the standard one
        return UserProfileSerializer
    def get_queryset(self):
        # Admins can see all users, others only their own
        if self.request.user.user_type == 'ADMIN':
            return User.objects.all().order_by('-date_joined')
        return User.objects.filter(id=self.request.user.id)
    
    def get_permissions(self):
        """Allows only ADMIN to modify/delete other users."""
        if self.action in ['update', 'partial_update', 'destroy']:
            # For POST, PUT, PATCH, DELETE: Require IsAdminUser
            return [IsAdminUser()] 
        # For GET (list, retrieve): Admins can see all, others only their own
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['patch'])
    def activate_deactivate(self, request, pk=None):
        """Allows admin to toggle the is_active status of any user."""
        user = self.get_object()
        
        # Expecting the new status in the request body, e.g., {"is_active": false}
        is_active_new = request.data.get('is_active')
        
        if is_active_new is None or not isinstance(is_active_new, bool):
            return Response({'error': 'The field "is_active" with a boolean value is required.'}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Skip status change if the user is attempting to deactivate themselves
        if user == request.user and not is_active_new:
             return Response({'error': 'You cannot deactivate your own administrative account via this endpoint.'}, 
                            status=status.HTTP_403_FORBIDDEN)
            
        user.is_active = is_active_new
        user.save(update_fields=['is_active'])
        
        # Serialize and return the updated user data
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    # --- END OF FIX ---


class EmployerProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for Employer profiles"""
    serializer_class = EmployerProfileSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrOwnerOrReadOnly]
    
    def get_queryset(self):
        # Admins and coordinators can see all employers
        if self.request.user.user_type in ['ADMIN', 'COORDINATOR']:
            return Employer.objects.select_related('user').all()
        elif self.request.user.user_type == 'EMPLOYER':
            return Employer.objects.select_related('user').filter(user=self.request.user)
        return Employer.objects.none()
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        if self.request.user.user_type != 'EMPLOYER':
            serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def verify(self, request, pk=None):
        """Custom action for coordinators to verify employers"""
        if request.user.user_type not in ['ADMIN', 'COORDINATOR']:
            return Response({'error': 'Only coordinators and admins can verify employers'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        employer = self.get_object()
        verification_status = request.data.get('verification_status')
        
        if verification_status not in ['VERIFIED', 'REJECTED', 'PENDING']:
            return Response({'error': 'Invalid verification_status'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        employer.verification_status = verification_status
        employer.save(update_fields=['verification_status'])
        
        serializer = self.get_serializer(employer)
        return Response(serializer.data)


class IsSelf(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class SkilledLaborerProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for SkilledLaborer profiles"""
    serializer_class = SkilledLaborerProfileSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSelf()]
        return [IsAuthenticated()]
        
    def get_queryset(self):
        user = self.request.user
        
        # Admins and coordinators can see all laborers
        if user.user_type in ['ADMIN', 'COORDINATOR']:
            return SkilledLaborer.objects.select_related('user').prefetch_related(
                'laborerskills_set', 'laborerskills_set__skill'
            ).all().order_by('user__username')
        elif user.user_type == 'LABORER':
            return SkilledLaborer.objects.select_related('user').prefetch_related(
                'laborerskills_set', 'laborerskills_set__skill'
            ).filter(user=user).order_by('user__username')
        # Employers can see available laborers for job matching
        elif user.user_type == 'EMPLOYER':
            return SkilledLaborer.objects.select_related('user').prefetch_related(
                'laborerskills_set', 'laborerskills_set__skill'
            ).filter(is_available=True).order_by('user__username')
            
        return SkilledLaborer.objects.none()

    def get_object(self):
        queryset = self.get_queryset()
        pk = self.kwargs.get('pk')
        if pk:
            obj = queryset.filter(user_id=pk).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        
        return super().get_object()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if not instance:
                return Response(
                    {'error': 'Laborer profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            updated_instance = serializer.save() 
            
            fresh_serializer = self.get_serializer(updated_instance)

            return Response(fresh_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(f"Error updating laborer profile: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Failed to update profile: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        laborer = self.get_object()
        laborer.profile_completeness = SkilledLaborerProfileSerializer.recalculate_completeness(laborer)
        laborer.save(update_fields=['profile_completeness'])
        return Response({'profile_completeness': laborer.profile_completeness})

class SkillViewSet(viewsets.ModelViewSet):
    """Admin-only ViewSet for Skills"""
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
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
        # Admins and coordinators can see all laborer skills
        if self.request.user.user_type in ['ADMIN', 'COORDINATOR']:
            return LaborerSkills.objects.select_related('laborer', 'laborer__user', 'skill').all()
        elif self.request.user.user_type == 'LABORER':
            return LaborerSkills.objects.filter(laborer__user=self.request.user).select_related('laborer', 'skill')
        return LaborerSkills.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.user_type != 'LABORER':
            return Response({'error': 'Only laborers can add skills'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            laborer = request.user.skilledlaborer
        except AttributeError:
            laborer = SkilledLaborer.objects.create(user=request.user)

        if LaborerSkills.objects.filter(laborer=laborer, skill_id=serializer.validated_data['skill_id']).exists():
            return Response({'error': 'This skill has already been added.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(laborer=laborer) 
        
        laborer.profile_completeness = SkilledLaborerProfileSerializer.recalculate_completeness(laborer)
        laborer.save(update_fields=['profile_completeness'])
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        laborer = instance.laborer
        self.perform_destroy(instance)
        
        laborer.refresh_from_db() 
        laborer.profile_completeness = SkilledLaborerProfileSerializer.recalculate_completeness(laborer)
        laborer.save(update_fields=['profile_completeness'])
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class JobPostingViewSet(viewsets.ModelViewSet):
    """ViewSet for Job Postings with employer restrictions"""
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
        """Allow anyone to read, but require authentication for write operations"""
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        # For POST, PUT, PATCH, DELETE - use IsEmployerOrReadOnly which allows employers and admins
        # IsEmployerOrReadOnly already checks authentication internally
        return [IsEmployerOrReadOnly()]

    def get_queryset(self):
        queryset = JobPosting.objects.select_related('employer', 'employer__user').all()
        user = self.request.user
        
        # Admins can see all jobs
        if user.is_authenticated and user.user_type == 'ADMIN':
            my_jobs = self.request.query_params.get('my_jobs', 'false').lower() == 'true'
            if my_jobs:
                # For admin, my_jobs could mean jobs they posted (as admin)
                return queryset
            return queryset
        
        my_jobs = self.request.query_params.get('my_jobs', 'false').lower() == 'true'
        
        if (self.action == 'list' and 
            user.is_authenticated and 
            user.user_type == 'EMPLOYER' and 
            my_jobs):
            
            if hasattr(user, 'employer'):
                return queryset.filter(employer=user.employer)
            else:
                return queryset.none() 
        
        return queryset
    
    def perform_create(self, serializer):
        # Ensure user is authenticated
        if not self.request.user.is_authenticated:
            raise PermissionError("Authentication required to create job postings")
        
        # Allow both employers and admins to create job postings
        user_type = getattr(self.request.user, 'user_type', None)
        if user_type not in ['EMPLOYER', 'ADMIN']:
            # Provide a more helpful error message
            raise PermissionError(
                f"Only employers and admins can create job postings. "
                f"Your user type is: {user_type or 'not set'}. "
                f"Please contact support if you believe this is an error."
            )
        
        # For admins, we need to handle employer assignment differently
        if user_type == 'ADMIN':
            # Admins can post jobs, but we need an employer
            # Use the first available employer or create a default one
            employer = Employer.objects.first()
            if not employer:
                # Create a default admin employer if none exists
                from django.contrib.auth import get_user_model
                User = get_user_model()
                admin_user = User.objects.filter(user_type='EMPLOYER').first()
                if admin_user and hasattr(admin_user, 'employer'):
                    employer = admin_user.employer
                else:
                    # Create a system employer for admin posts
                    system_user = User.objects.filter(username='system').first()
                    if not system_user:
                        system_user = User.objects.create_user(
                            username='system',
                            email='system@skilledlabor.com',
                            user_type='EMPLOYER'
                        )
                    if not hasattr(system_user, 'employer'):
                        employer = Employer.objects.create(
                            user=system_user,
                            company_name='System Admin',
                            business_type='ADMIN',
                            verification_status='VERIFIED'
                        )
                    else:
                        employer = system_user.employer
            serializer.save(employer=employer)
        else:
            # For regular employers
            if not hasattr(self.request.user, 'employer'):
                Employer.objects.create(user=self.request.user, company_name=f"{self.request.user.username}'s Company")
            serializer.save()
    
    def perform_update(self, serializer):
        # Admins can edit any job, employers can only edit their own
        if self.request.user.user_type != 'ADMIN':
            employer_profile = self.get_object().employer
            if employer_profile.user != self.request.user:
                raise PermissionError("You can only edit your own job postings")
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        """Get applications for a specific job posting"""
        job_posting = self.get_object()
        
        # --- THIS IS THE FIX ---
        # We check for authentication *before* checking user_type
        # This stops the 'AnonymousUser' crash.
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'},
                            status=status.HTTP_401_UNAUTHORIZED)
        # --- END FIX ---
            
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
        
        # Admins and coordinators can see all applications
        if user.user_type in ['ADMIN', 'COORDINATOR']:
            return JobApplication.objects.select_related(
                'job_posting', 'laborer', 'laborer__user', 'job_posting__employer', 'job_posting__employer__user'
            ).all()
        elif user.user_type == 'EMPLOYER':
            if hasattr(user, 'employer'):
                return JobApplication.objects.filter(
                    job_posting__employer=user.employer
                ).select_related('job_posting', 'laborer', 'laborer__user', 'job_posting__employer')
            return JobApplication.objects.none()
        elif user.user_type == 'LABORER':
            if hasattr(user, 'skilledlaborer'):
                return JobApplication.objects.filter(
                    laborer=user.skilledlaborer
                ).select_related('job_posting', 'laborer', 'laborer__user', 'job_posting__employer')
            return JobApplication.objects.none()
        
        return JobApplication.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.user_type != 'LABORER':
            raise PermissionError("Only skilled laborers can apply for jobs")
        
        if not hasattr(self.request.user, 'skilledlaborer'):
            SkilledLaborer.objects.create(user=self.request.user)
            
        serializer.save()
    
    def perform_update(self, serializer):
        # Admins and coordinators can update any application
        if self.request.user.user_type in ['ADMIN', 'COORDINATOR']:
            serializer.save()
        else:
            # For employers, check if it's their job
            if self.request.user.user_type == 'EMPLOYER':
                app = self.get_object()
                if app.job_posting.employer.user != self.request.user:
                    raise PermissionError("You can only update applications for your own jobs")
            serializer.save()
    

class WorkHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Work History"""
    serializer_class = WorkHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['work_status', 'laborer__experience_level']
    ordering_fields = ['started_at', 'completed_at']
    ordering = ['-started_at']
    
    def get_permissions(self):
        """Admins and coordinators have full access, others follow owner rules"""
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admins can see all work history
        if user.user_type == 'ADMIN':
            return WorkHistory.objects.select_related(
                'job_posting', 'laborer', 'laborer__user', 'employer', 'employer__user'
            ).all()
        elif user.user_type == 'COORDINATOR':
            # Coordinators can see all work history for oversight
            return WorkHistory.objects.select_related(
                'job_posting', 'laborer', 'laborer__user', 'employer', 'employer__user'
            ).all()
        elif user.user_type == 'LABORER':
            if hasattr(user, 'skilledlaborer'):
                return WorkHistory.objects.filter(
                    laborer=user.skilledlaborer
                ).select_related('job_posting', 'laborer', 'laborer__user', 'employer', 'employer__user')
            return WorkHistory.objects.none()
        elif user.user_type == 'EMPLOYER':
            if hasattr(user, 'employer'):
                return WorkHistory.objects.filter(
                    employer=user.employer
                ).select_related('job_posting', 'laborer', 'laborer__user', 'employer', 'employer__user')
            return WorkHistory.objects.none()
        
        return WorkHistory.objects.none()
    
    def perform_update(self, serializer):
        """Allow admins and coordinators to update any work history, others only their own"""
        user = self.request.user
        instance = self.get_object()
        
        # Admins and coordinators can update any work history
        if user.user_type in ['ADMIN', 'COORDINATOR']:
            serializer.save()
        # Laborers can only update their own work history
        elif user.user_type == 'LABORER':
            if hasattr(user, 'skilledlaborer') and instance.laborer == user.skilledlaborer:
                serializer.save()
            else:
                raise PermissionError("You can only update your own work history")
        # Employers can only update work history for their jobs
        elif user.user_type == 'EMPLOYER':
            if hasattr(user, 'employer') and instance.employer == user.employer:
                serializer.save()
            else:
                raise PermissionError("You can only update work history for your own jobs")
        else:
            raise PermissionError("You do not have permission to update work history")
    
    def perform_create(self, serializer):
        """Only allow creating work history through job application acceptance"""
        # Work history is typically created automatically when application is accepted
        # Admins and coordinators can create work history manually if needed
        if self.request.user.user_type not in ['ADMIN', 'COORDINATOR']:
            raise PermissionError("Only admins and coordinators can create work history manually")
        serializer.save()


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'is_read', 'status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Admins can see all notifications, others only their own
        if self.request.user.user_type == 'ADMIN':
            return Notification.objects.all()
        return Notification.objects.filter(recipient=self.request.user)
    
    def get_permissions(self):
        """Allow creation for authenticated users, but restrict other operations"""
        if self.action == 'create':
            return [IsAuthenticated()]
        # For other operations, use owner or admin check
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Override create to handle special notification types"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_type = serializer.validated_data.get('notification_type', '')
        message = serializer.validated_data.get('message', '')
        
        # Special handling for laborer-coordinator messages
        if notification_type == 'LABORER_COORDINATOR_MESSAGE':
            try:
                # Find all coordinators and create notifications for them
                coordinators = User.objects.filter(user_type='COORDINATOR', is_active=True)
                
                if not coordinators.exists():
                    return Response(
                        {'error': 'No active coordinators found. Please contact support.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                notifications_created = 0
                coordinator_notifications = []
                for coordinator in coordinators:
                    notif = Notification.objects.create(
                        recipient=coordinator,
                        sender=request.user,  # Store the laborer who sent the message
                        notification_type='LABORER_COORDINATOR_MESSAGE',
                        message=message
                    )
                    coordinator_notifications.append(notif)
                    notifications_created += 1
                
                # Also notify the laborer that message was sent
                laborer_notif = Notification.objects.create(
                    recipient=request.user,
                    notification_type='MESSAGE_SENT',
                    message='Your message has been sent to the coordinator. You will be notified when they respond.'
                )
                
                # Return the first coordinator notification as the main response
                response_serializer = self.get_serializer(coordinator_notifications[0] if coordinator_notifications else laborer_notif)
                headers = self.get_success_headers(response_serializer.data)
                return Response({
                    'message': f'Message sent to {notifications_created} coordinator(s)',
                    'notifications_created': notifications_created,
                    **response_serializer.data
                }, status=status.HTTP_201_CREATED, headers=headers)
            except Exception as e:
                import traceback
                print(f"Error creating coordinator notification: {str(e)}")
                print(traceback.format_exc())
                return Response(
                    {'error': f'Failed to send message: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Default behavior: create notification for the current user
        # If recipient is not provided, use the current user
        recipient = serializer.validated_data.get('recipient', request.user)
        try:
            notification = serializer.save(recipient=recipient)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            import traceback
            print(f"Error creating notification: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Failed to create notification: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def send_reminder(self, request):
        """Send reminder notification for long pending applications"""
        if request.user.user_type not in ['ADMIN', 'COORDINATOR']:
            return Response(
                {'error': 'Only admins and coordinators can send reminders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        application_id = request.data.get('application_id')
        if not application_id:
            return Response(
                {'error': 'application_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            application = JobApplication.objects.select_related(
                'job_posting', 'laborer', 'laborer__user', 'job_posting__employer', 'job_posting__employer__user'
            ).get(id=application_id)
            
            # Send notification to employer
            Notification.objects.create(
                recipient=application.job_posting.employer.user,
                notification_type='WORK_REMINDER',
                message=f'Reminder: Application from {application.laborer.user.username} for job "{application.job_posting.job_title}" is still pending. Please review and respond.'
            )
            
            # Send notification to laborer
            Notification.objects.create(
                recipient=application.laborer.user,
                notification_type='WORK_REMINDER',
                message=f'Reminder: Your application for "{application.job_posting.job_title}" is still pending. The employer has been notified.'
            )
            
            return Response({
                'message': 'Reminder notifications sent to both employer and laborer',
                'application_id': application_id
            }, status=status.HTTP_200_OK)
        except JobApplication.DoesNotExist:
            return Response(
                {'error': 'Application not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to send reminder: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Coordinator reply to a laborer message"""
        if request.user.user_type not in ['ADMIN', 'COORDINATOR']:
            return Response(
                {'error': 'Only coordinators and admins can reply to messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            original_notification = self.get_object()
            
            # Check if this is a LABORER_COORDINATOR_MESSAGE
            if original_notification.notification_type != 'LABORER_COORDINATOR_MESSAGE':
                return Response(
                    {'error': 'This notification is not a message from a laborer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the reply message from request
            reply_message = request.data.get('reply_message', '').strip()
            if not reply_message:
                return Response(
                    {'error': 'Reply message is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the original sender (laborer)
            if not original_notification.sender:
                return Response(
                    {'error': 'Original sender not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            laborer = original_notification.sender
            
            # Create reply notification for the laborer
            reply_notification = Notification.objects.create(
                recipient=laborer,
                sender=request.user,
                notification_type='COORDINATOR_RESPONSE',
                message=f"Coordinator Response: {reply_message}"
            )
            
            # Mark original notification as read
            original_notification.is_read = True
            original_notification.read_at = timezone.now()
            original_notification.save()
            
            serializer = self.get_serializer(reply_notification)
            return Response({
                'message': 'Reply sent successfully',
                'notification': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print(f"Error replying to notification: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Failed to send reply: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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


class ContactSubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for Contact Form Submissions"""
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [AllowAny]  # Allow anyone to submit contact form
    
    def get_permissions(self):
        """Only allow POST for public, require admin for other operations"""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]
    
    def create(self, request, *args, **kwargs):
        """Create a new contact submission"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {'message': 'Your request has been submitted successfully. We will get back to you soon.'},
            status=status.HTTP_201_CREATED,
            headers=headers
        )


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
        try:
            user = request.user
            data = {}
            
            if user.user_type not in ['ADMIN', 'COORDINATOR', 'EMPLOYER', 'LABORER']:
                return Response({'detail': 'You do not have permission to access a dashboard.'},
                                status=status.HTTP_403_FORBIDDEN)
            
            if user.user_type == 'EMPLOYER':
                if hasattr(user, 'employer'):
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
                        'completed_projects': JobPosting.objects.filter(
                            employer=employer, 
                            job_status__in=['COMPLETED', 'CLOSED']
                        ).count(),
                    })
                else:
                    data.update({
                        'total_jobs': 0,
                        'active_jobs': 0,
                        'total_applications': 0,
                        'pending_applications': 0,
                        'completed_projects': 0,
                    })
            
            elif user.user_type == 'LABORER':
                if hasattr(user, 'skilledlaborer'):
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
                else:
                    data.update({
                        'total_applications': 0,
                        'accepted_applications': 0,
                        'completed_works': 0,
                        'average_rating': 0,
                    })
            
            # --- COORDINATOR LOGIC: Focus on Support/Oversight ---
            elif user.user_type == 'COORDINATOR':
                # 1. Disputes: WorkHistory flagged for review
                disputed_projects_count = WorkHistory.objects.filter(
                    work_status='DISPUTED'
                ).count()
                
                # 2. Employer Verification: Profiles awaiting approval (important for support role)
                pending_employer_verification_count = Employer.objects.filter(
                    verification_status='PENDING'
                ).count()
                
                # 3. Long-Pending Applications: Applications stuck in PENDING for over 7 days 
                # (Requires coordinator intervention to nudge employer/laborer)
                seven_days_ago = timezone.now() - timezone.timedelta(days=7)
                long_pending_applications_count = JobApplication.objects.filter(
                    application_status='PENDING',
                    applied_at__lt=seven_days_ago 
                ).count()
                
                data.update({
                    'total_users': User.objects.count(),
                    'total_jobs': JobPosting.objects.count(),
                    'total_laborers': SkilledLaborer.objects.count(),
                    'total_employers': Employer.objects.count(),

                    # NEW COORDINATOR-SPECIFIC STATS
                    'disputed_projects': disputed_projects_count,
                    'pending_employer_verification': pending_employer_verification_count,
                    'long_pending_applications': long_pending_applications_count,
                })

            # --- ADMIN LOGIC: Focus on System Management/Overall Health ---
            elif user.user_type == 'ADMIN':
                pending_laborers_count = SkilledLaborer.objects.filter(
                    user__is_active=False, 
                    user__user_type='LABORER'
                ).count()
                
                data.update({
                    'total_users': User.objects.count(),
                    'total_jobs': JobPosting.objects.count(),
                    'total_applications': JobApplication.objects.count(),
                    'active_jobs': JobPosting.objects.filter(job_status='OPEN').count(),
                    
                    'total_laborers': SkilledLaborer.objects.count(),
                    'total_employers': Employer.objects.count(),
                    'total_coordinators': Coordinator.objects.count(),
                    
                    'pending_approvals': pending_laborers_count, # Pending Laborer Approvals
                })
            # --- END ADMIN/COORDINATOR SEPARATION ---

            data['unread_notifications'] = Notification.objects.filter(
                recipient=user,
                is_read=False
            ).count()
            
            return Response(data)
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"DashboardView error: {str(e)}")
            print(f"Traceback: {error_details}")
            return Response(
                {'error': f'Failed to load dashboard data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )