from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Administrator, Coordinator, Employer, SkilledLaborer,
    Skill, LaborerSkills, JobPosting, JobApplication, WorkHistory, Notification
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Admin for Custom User model"""
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_active')
    list_filter = ('user_type', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone_number')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'address', 'user_type')}),
    )


@admin.register(Administrator)
class AdministratorAdmin(admin.ModelAdmin):
    """Admin for Administrator model"""
    list_display = ('user', 'department', 'clearance_level')
    search_fields = ('user__username', 'department', 'clearance_level')


@admin.register(Coordinator)
class CoordinatorAdmin(admin.ModelAdmin):
    """Admin for Coordinator model"""
    list_display = ('user', 'region', 'specialization')
    search_fields = ('user__username', 'region', 'specialization')


@admin.register(Employer)
class EmployerAdmin(admin.ModelAdmin):
    """Admin for Employer model"""
    list_display = ('user', 'company_name', 'business_type', 'verification_status')
    list_filter = ('verification_status', 'business_type')
    search_fields = ('user__username', 'company_name', 'business_type')


@admin.register(SkilledLaborer)
class SkilledLaborerAdmin(admin.ModelAdmin):
    """Admin for Skilled Laborer model"""
    list_display = ('user', 'experience_level', 'is_available', 'hourly_rate', 'years_experience')
    list_filter = ('experience_level', 'is_available')
    search_fields = ('user__username', 'bio')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    """Admin for Skill model"""
    list_display = ('skill_name', 'category')
    list_filter = ('category',)
    search_fields = ('skill_name', 'category')


@admin.register(LaborerSkills)
class LaborerSkillsAdmin(admin.ModelAdmin):
    """Admin for LaborerSkills model"""
    list_display = ('laborer', 'skill', 'proficiency_level', 'years_experience')
    list_filter = ('proficiency_level', 'skill__category')
    search_fields = ('laborer__user__username', 'skill__skill_name')


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    """Admin for Job Posting model"""
    list_display = ('job_title', 'employer', 'work_type', 'job_status', 'budget_min', 'budget_max', 'start_date')
    list_filter = ('work_type', 'job_status', 'created_at', 'employer__company_name')
    search_fields = ('job_title', 'job_description', 'location', 'employer__company_name')
    date_hierarchy = 'created_at'


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    """Admin for Job Application model"""
    list_display = ('job_posting', 'laborer', 'proposed_rate', 'application_status', 'applied_at')
    list_filter = ('application_status', 'applied_at', 'job_posting__employer__company_name')
    search_fields = ('job_posting__job_title', 'laborer__user__username')


@admin.register(WorkHistory)
class WorkHistoryAdmin(admin.ModelAdmin):
    """Admin for Work History model"""
    list_display = ('job_posting', 'laborer', 'employer', 'work_status', 'amount_paid', 'started_at')
    list_filter = ('work_status', 'started_at', 'completed_at')
    search_fields = ('job_posting__job_title', 'laborer__user__username', 'employer__company_name')
    date_hierarchy = 'started_at'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin for Notification model"""
    list_display = ('recipient', 'notification_type', 'is_read', 'status', 'created_at')
    list_filter = ('notification_type', 'is_read', 'status', 'created_at')
    search_fields = ('recipient__username', 'message')
    date_hierarchy = 'created_at'