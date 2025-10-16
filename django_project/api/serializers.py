# django_project/api/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Administrator, Coordinator, Employer, SkilledLaborer,
    Skill, LaborerSkills, JobPosting, JobApplication, 
    WorkHistory, Notification
)

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 
                 'phone_number', 'address', 'user_type', 'password', 'password_confirm')
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'user_type': {'required': False},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        # Default user_type if not provided
        validated_data.setdefault('user_type', 'LABORER')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data (safe fields only)"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'phone_number', 'address', 'user_type', 'date_joined')
        read_only_fields = ('id', 'date_joined', 'user_type')


class EmployerProfileSerializer(serializers.ModelSerializer):
    """Serializer for Employer profile"""
    class Meta:
        model = Employer
        fields = ('id', 'company_name', 'business_type', 'verification_status', 
                 'company_size', 'established_year')
        read_only_fields = ('id', 'verification_status')


class CoordinatorProfileSerializer(serializers.ModelSerializer):
    """Serializer for Coordinator profile"""
    class Meta:
        model = Coordinator
        fields = ('id', 'region', 'specialization')
        read_only_fields = ('id',)


class AdministratorProfileSerializer(serializers.ModelSerializer):
    """Serializer for Administrator profile"""
    class Meta:
        model = Administrator
        fields = ('id', 'department', 'clearance_level')
        read_only_fields = ('id',)


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill model"""
    class Meta:
        model = Skill
        fields = ('id', 'skill_name', 'category')


class LaborerSkillsSerializer(serializers.ModelSerializer):
    """Serializer for LaborerSkills through table"""
    skill = SkillSerializer(read_only=True)
    skill_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = LaborerSkills
        fields = ('id', 'skill', 'skill_id', 'proficiency_level', 'years_experience')


# NEW: Writable nested serializer for updating user fields from the profile
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone_number', 'address')


class SkilledLaborerProfileSerializer(serializers.ModelSerializer):
    """Serializer for SkilledLaborer profile"""
    user = UserUpdateSerializer() # Use the new writable serializer
    skills = LaborerSkillsSerializer(many=True, read_only=True)
    
    class Meta:
        model = SkilledLaborer
        fields = (
            'user', 'experience_level', 'is_available', 'hourly_rate', 
            'years_experience', 'bio', 'skills', 'max_travel_distance_km'
        )
        # Note: We are no longer using read_only_fields here because we handle it in the update method.

    def update(self, instance, validated_data):
        # Handle nested user object update
        user_data = validated_data.pop('user', {})
        user_serializer = UserUpdateSerializer(instance.user, data=user_data, partial=True)
        if user_serializer.is_valid(raise_exception=True):
            user_serializer.save()

        # Handle SkilledLaborer object update
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class JobPostingSerializer(serializers.ModelSerializer):
    """Serializer for JobPosting with nested employer info"""
    employer_name = serializers.CharField(source='employer.company_name', read_only=True)
    employer_verified = serializers.BooleanField(source='employer.verification_status', read_only=True)
    employer_type = serializers.CharField(source='employer.business_type', read_only=True)
    creator_id = serializers.IntegerField(source='employer.user.id', read_only=True)
    
    class Meta:
        model = JobPosting
        fields = ('id', 'job_title', 'job_description', 'work_type', 
                 'budget_min', 'budget_max', 'location', 'start_date', 
                 'end_date', 'job_status', 'created_at', 'updated_at',
                 'employer_name', 'employer_verified', 'employer_type', 'creator_id',
                 'employer')
        read_only_fields = ('id', 'created_at', 'updated_at', 
                          'employer_name', 'employer_verified', 'employer_type', 'creator_id')
    
    def create(self, validated_data):
        user = self.context['request'].user
        try:
            employer = user.employer
        except AttributeError:
            raise serializers.ValidationError("Only employers can create job postings")
        
        validated_data['employer'] = employer
        return super().create(validated_data)


class JobApplicationSerializer(serializers.ModelSerializer):
    """Serializer forJobApplication with nested laborer info"""
    laborer_name = serializers.SerializerMethodField(read_only=True)
    laborer_email = serializers.EmailField(source='laborer.user.email', read_only=True)
    laborer_experience = serializers.CharField(source='laborer.experience_level', read_only=True)
    job_title = serializers.CharField(source='job_posting.job_title', read_only=True)
    employer_name = serializers.CharField(source='job_posting.employer.company_name', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = ('id', 'job_posting', 'proposed_rate', 'application_status', 
                 'cover_letter', 'applied_at', 'updated_at',
                 'laborer_name', 'laborer_email', 'laborer_experience',
                 'job_title', 'employer_name', 'laborer')
        read_only_fields = ('id', 'applied_at', 'updated_at', 
                          'laborer_name', 'laborer_email', 'laborer_experience',
                          'job_title', 'employer_name', 'laborer')
        extra_kwargs = {
            'laborer': {'required': False},
        }
    
    def get_laborer_name(self, obj):
        return f"{obj.laborer.user.first_name} {obj.laborer.user.last_name}".strip() or obj.laborer.user.username
    
    def create(self, validated_data):
        user = self.context['request'].user
        try:
            laborer = user.skilledlaborer
        except AttributeError:
            # If user is a LABORER but has no profile yet, create a basic one
            if getattr(user, "user_type", None) == "LABORER":
                laborer = SkilledLaborer.objects.create(user=user)  # defaults applied
            else:
                raise serializers.ValidationError("Only skilled laborers can apply for jobs")
        
        validated_data['laborer'] = laborer
        return super().create(validated_data)


class WorkHistorySerializer(serializers.ModelSerializer):
    """Serializer for WorkHistory"""
    laborer_name = serializers.SerializerMethodField(read_only=True)
    employer_name = serializers.CharField(source='employer.company_name', read_only=True)
    job_title = serializers.CharField(source='job_posting.job_title', read_only=True)
    
    class Meta:
        model = WorkHistory
        fields = ('id', 'job_posting', 'laborer', 'employer', 'work_status',
                 'amount_paid', 'employer_review', 'employer_rating',
                 'laborer_rating', 'laborer_review', 'started_at', 'completed_at',
                 'laborer_name', 'employer_name', 'job_title')
        read_only_fields = ('id', 'started_at', 'laborer_name', 'employer_name', 'job_title')
    
    def get_laborer_name(self, obj):
        return f"{obj.laborer.user.first_name} {obj.laborer.user.last_name}".strip() or obj.laborer.user.username


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification"""
    recipient_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Notification
        fields = ('id', 'recipient', 'notification_type', 'message', 
                 'is_read', 'status', 'created_at', 'read_at', 'recipient_name')
        read_only_fields = ('id', 'created_at', 'read_at', 'recipient_name')
    
    def get_recipient_name(self, obj):
        return f"{obj.recipient.first_name} {obj.recipient.last_name}".strip() or obj.recipient.username


class UserProfileSerializer(serializers.ModelSerializer):
    """Comprehensive user profile serializer"""
    employer_profile = EmployerProfileSerializer(source='employer', read_only=True)
    laborer_profile = SkilledLaborerProfileSerializer(source='skilledlaborer', read_only=True)
    coordinator_profile = CoordinatorProfileSerializer(source='coordinator', read_only=True)
    administrator_profile = AdministratorProfileSerializer(source='administrator', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'phone_number', 'address', 'user_type', 'date_joined',
                 'employer_profile', 'laborer_profile', 'coordinator_profile', 
                 'administrator_profile', 'is_active')
        read_only_fields = ('id', 'date_joined', 'user_type', 'is_active')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user data"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['user_type'] = user.user_type
        token['is_active'] = user.is_active
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user info to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'user_type': self.user.user_type,
            'is_active': self.user.is_active,
        }
        
        return data


# Compact serializers for list views
class JobPostingListSerializer(serializers.ModelSerializer):
    """Simplified serializer for job posting lists"""
    employer_name = serializers.CharField(source='employer.company_name', read_only=True)
    applications_count = serializers.SerializerMethodField(read_only=True)
    # NEW: Field to check if the current user has applied
    has_applied = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPosting
        fields = ('id', 'job_title', 'work_type', 'budget_min', 'budget_max', 
                 'location', 'start_date', 'job_status', 'created_at',
                 'employer_name', 'applications_count', 'has_applied')
        read_only_fields = ('id', 'created_at', 'employer_name', 'applications_count', 'has_applied')
    
    def get_applications_count(self, obj):
        return obj.jobapplication_set.count()

    def get_has_applied(self, obj):
        user = self.context['request'].user
        if user and user.is_authenticated and hasattr(user, 'skilledlaborer'):
            return JobApplication.objects.filter(job_posting=obj, laborer=user.skilledlaborer).exists()
        return False


class JobApplicationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for job application lists"""
    laborer_name = serializers.SerializerMethodField(read_only=True)
    job_title = serializers.CharField(source='job_posting.job_title', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = ('id', 'job_posting', 'proposed_rate', 'application_status', 
                 'cover_letter', 'applied_at', 'updated_at',
                 'laborer_name', 'job_title')
        read_only_fields = ('id', 'applied_at', 'updated_at', 
                          'laborer_name', 'job_title')
    
    def get_laborer_name(self, obj):
        return f"{obj.laborer.user.first_name} {obj.laborer.user.last_name}".strip() or obj.laborer.user.username