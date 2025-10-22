from django.db import models
from django.utils import timezone 
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class CustomUser(AbstractUser):
    """Custom User model extending AbstractUser"""
    USER_TYPE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('COORDINATOR', 'Coordinator'),
        ('EMPLOYER', 'Employer'),
        ('LABORER', 'Laborer'),
    ]
    
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    user_type = models.CharField(max_length=12, choices=USER_TYPE_CHOICES, default='LABORER')
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"


class Administrator(models.Model):
    """Administrator profile model"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    department = models.CharField(max_length=100, blank=True)
    clearance_level = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"Administrator: {self.user.username}"


class Coordinator(models.Model):
    """Coordinator profile model"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    region = models.CharField(max_length=100, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Coordinator: {self.user.username}"


class Employer(models.Model):
    """Employer profile model"""
    VERIFICATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    company_name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=100)
    verification_status = models.CharField(max_length=10, choices=VERIFICATION_STATUS_CHOICES, default='PENDING')
    company_size = models.CharField(max_length=50, blank=True)
    established_year = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"Employer: {self.company_name} ({self.user.username})"


class SkilledLaborer(models.Model):
    """Skilled Laborer profile model"""
    EXPERIENCE_LEVEL_CHOICES = [
        ('JUNIOR', 'Junior'),
        ('MID', 'Mid-level'),
        ('SENIOR', 'Senior'),
        ('EXPERT', 'Expert'),
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
    experience_level = models.CharField(max_length=10, choices=EXPERIENCE_LEVEL_CHOICES, default='JUNIOR')
    is_available = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    years_experience = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(50)])
    bio = models.TextField(blank=True)
    preferred_latitude = models.FloatField(null=True, blank=True, help_text="Preferred location latitude")
    preferred_longitude = models.FloatField(null=True, blank=True, help_text="Preferred location longitude")
    max_travel_distance_km = models.PositiveIntegerField(default=25, help_text="Maximum travel distance in kilometers")

    has_avatar = models.BooleanField(default=False)
    profile_completeness = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    def __str__(self):
        return f"Laborer: {self.user.username}"


class Skill(models.Model):
    """Skill model"""
    skill_name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.skill_name} ({self.category})"


class LaborerSkills(models.Model):
    """Through table connecting SkilledLaborer and Skill"""
    PROFICIENCY_CHOICES = [
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
        ('EXPERT', 'Expert'),
    ]
    
    laborer = models.ForeignKey(SkilledLaborer, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    proficiency_level = models.CharField(max_length=12, choices=PROFICIENCY_CHOICES, default='BEGINNER')
    years_experience = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(50)])
    
    class Meta:
        unique_together = ['laborer', 'skill']
    
    def __str__(self):
        return f"{self.laborer.user.username} - {self.skill.skill_name}"


class JobPosting(models.Model):
    """Job Posting model"""
    WORK_TYPE_CHOICES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
        ('TEMPORARY', 'Temporary'),
    ]
    
    JOB_STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('IN_PROGRESS', 'In Progress'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE)
    job_title = models.CharField(max_length=200)
    job_description = models.TextField()
    work_type = models.CharField(max_length=10, choices=WORK_TYPE_CHOICES, default='CONTRACT')
    budget_min = models.DecimalField(max_digits=10, decimal_places=2)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=200)
    latitude = models.FloatField(null=True, blank=True, help_text="Location latitude for proximity matching")
    longitude = models.FloatField(null=True, blank=True, help_text="Location longitude for proximity matching")
    max_distance_km = models.PositiveIntegerField(default=50, help_text="Maximum distance in kilometers for job matching")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    job_status = models.CharField(max_length=12, choices=JOB_STATUS_CHOICES, default='OPEN')
    required_skills = models.ManyToManyField(Skill, related_name='job_postings', blank=True, 
                                           help_text="Skills required for this job")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.job_title} - {self.employer.company_name}"


class JobApplication(models.Model):
    """Job Application model"""
    APPLICATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    laborer = models.ForeignKey(SkilledLaborer, on_delete=models.CASCADE)
    proposed_rate = models.DecimalField(max_digits=10, decimal_places=2)
    application_status = models.CharField(max_length=10, choices=APPLICATION_STATUS_CHOICES, default='PENDING')
    cover_letter = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    _original_status = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Store the status when the object is first loaded
        self._original_status = self.application_status
    
    class Meta:
        unique_together = ['job_posting', 'laborer']
    
    def __str__(self):
        return f"{self.laborer.user.username} -> {self.job_posting.job_title}"

    def save(self, *args, **kwargs):
        # Check if this is an update or a new object
        is_new = self._state.adding
        
        # Save the object to the database first
        super().save(*args, **kwargs)

        # Only run this logic if the status has *changed*
        if not is_new and self.application_status != self._original_status:
            message = ""
            recipient = None
            
            # 1. Notification Logic (already here from before)
            if self.application_status == 'ACCEPTED':
                message = f"Congratulations! Your application for '{self.job_posting.job_title}' has been accepted."
                recipient = self.laborer.user
            elif self.application_status == 'REJECTED':
                message = f"Unfortunately, your application for '{self.job_posting.job_title}' was not successful this time."
                recipient = self.laborer.user
            elif self.application_status == 'WITHDRAWN':
                message = f"The applicant {self.laborer.user.username} has withdrawn their application for '{self.job_posting.job_title}'."
                recipient = self.job_posting.employer.user
            
            if message and recipient:
                Notification.objects.create(
                    recipient=recipient,
                    notification_type='APPLICATION_STATUS',
                    message=message
                )
            
            # --- 2. WORK HISTORY LOGIC (THIS IS THE FIX) ---
            # If the application is accepted, create/update its WorkHistory item
            if self.application_status == 'ACCEPTED':
                WorkHistory.objects.update_or_create(
                    job_posting=self.job_posting,
                    laborer=self.laborer,
                    defaults={
                        'employer': self.job_posting.employer,
                        'work_status': 'IN_PROGRESS',
                        'started_at': timezone.now()
                    }
                )
            # --- END OF FIX ---
        
        # Finally, update the original status in memory for next time
        self._original_status = self.application_status

class WorkHistory(models.Model):
    """Work History model"""
    WORK_STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('DISPUTED', 'Disputed'),
    ]
    
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    laborer = models.ForeignKey(SkilledLaborer, on_delete=models.CASCADE)
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE)
    work_status = models.CharField(max_length=12, choices=WORK_STATUS_CHOICES, default='IN_PROGRESS')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    employer_review = models.TextField(blank=True)
    employer_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, 
                                        validators=[MinValueValidator(1), MaxValueValidator(5)])
    laborer_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True,
                                       validators=[MinValueValidator(1), MaxValueValidator(5)])
    laborer_review = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.job_posting.job_title} - {self.laborer.user.username}"


class Notification(models.Model):
    """Notification model"""
    NOTIFICATION_TYPE_CHOICES = [
        ('JOB_APPLICATION', 'Job Application'),
        ('APPLICATION_STATUS', 'Application Status'),
        ('NEW_JOB_POSTING', 'New Job Posting'),
        ('WORK_REMINDER', 'Work Reminder'),
        ('RATING_REMINDER', 'Rating Reminder'),
        ('ACCOUNT_UPDATE', 'Account Update'),
    ]
    
    STATUS_CHOICES = [
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('FAILED', 'Failed'),
    ]
    
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='SENT')
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.notification_type} - {self.recipient.username}"