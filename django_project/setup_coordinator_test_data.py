#!/usr/bin/env python
"""
Quick script to set up test data for Coordinator Dashboard testing
Run: python manage.py shell < setup_coordinator_test_data.py
Or: python setup_coordinator_test_data.py (if Django is set up)
"""

import os
import sys
import django
from datetime import date, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skilled_labor_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import (
    Employer, SkilledLaborer, Coordinator,
    JobPosting, JobApplication, WorkHistory,
    Skill, LaborerSkills
)

User = get_user_model()

def setup_test_data():
    print("🚀 Setting up Coordinator Dashboard Test Data")
    print("=" * 60)
    
    # 1. Create Coordinator User (if doesn't exist)
    print("\n1️⃣ Creating Coordinator User...")
    coordinator_user, created = User.objects.get_or_create(
        username='coordinator_test',
        defaults={
            'email': 'coordinator@test.com',
            'user_type': 'COORDINATOR',
            'first_name': 'Test',
            'last_name': 'Coordinator',
            'is_active': True
        }
    )
    if created:
        coordinator_user.set_password('test123')
        coordinator_user.save()
        Coordinator.objects.create(user=coordinator_user, region='Test Region')
        print(f"✅ Created coordinator: {coordinator_user.username} (password: test123)")
    else:
        print(f"📝 Coordinator already exists: {coordinator_user.username}")
    
    # 2. Create Pending Employer
    print("\n2️⃣ Creating Pending Employer...")
    pending_employer_user, created = User.objects.get_or_create(
        username='employer_pending_test',
        defaults={
            'email': 'employer_pending@test.com',
            'user_type': 'EMPLOYER',
            'first_name': 'Pending',
            'last_name': 'Employer',
            'is_active': True
        }
    )
    if created:
        pending_employer_user.set_password('test123')
        pending_employer_user.save()
    
    pending_employer, created = Employer.objects.get_or_create(
        user=pending_employer_user,
        defaults={
            'company_name': 'Pending Construction Co.',
            'business_type': 'Construction',
            'verification_status': 'PENDING',
            'company_size': 'Small',
            'established_year': 2020
        }
    )
    if created:
        print(f"✅ Created pending employer: {pending_employer.company_name}")
    else:
        pending_employer.verification_status = 'PENDING'
        pending_employer.save()
        print(f"📝 Updated employer to PENDING: {pending_employer.company_name}")
    
    # 3. Create Verified Employer
    print("\n3️⃣ Creating Verified Employer...")
    verified_employer_user, created = User.objects.get_or_create(
        username='employer_verified_test',
        defaults={
            'email': 'employer_verified@test.com',
            'user_type': 'EMPLOYER',
            'first_name': 'Verified',
            'last_name': 'Employer',
            'is_active': True
        }
    )
    if created:
        verified_employer_user.set_password('test123')
        verified_employer_user.save()
    
    verified_employer, created = Employer.objects.get_or_create(
        user=verified_employer_user,
        defaults={
            'company_name': 'Verified Builders Inc.',
            'business_type': 'Construction',
            'verification_status': 'VERIFIED',
            'company_size': 'Medium',
            'established_year': 2015
        }
    )
    if created:
        print(f"✅ Created verified employer: {verified_employer.company_name}")
    else:
        print(f"📝 Verified employer already exists: {verified_employer.company_name}")
    
    # 4. Create Laborer
    print("\n4️⃣ Creating Laborer...")
    laborer_user, created = User.objects.get_or_create(
        username='laborer_test',
        defaults={
            'email': 'laborer@test.com',
            'user_type': 'LABORER',
            'first_name': 'Test',
            'last_name': 'Laborer',
            'is_active': True
        }
    )
    if created:
        laborer_user.set_password('test123')
        laborer_user.save()
    
    laborer, created = SkilledLaborer.objects.get_or_create(
        user=laborer_user,
        defaults={
            'experience_level': 'SENIOR',
            'is_available': True,
            'hourly_rate': 30.00,
            'years_experience': 5,
            'bio': 'Experienced construction worker'
        }
    )
    if created:
        print(f"✅ Created laborer: {laborer.user.username}")
    else:
        print(f"📝 Laborer already exists: {laborer.user.username}")
    
    # 5. Create Job Posting
    print("\n5️⃣ Creating Job Posting...")
    job, created = JobPosting.objects.get_or_create(
        employer=verified_employer,
        job_title='Test Construction Job',
        defaults={
            'job_description': 'A test job for coordinator testing',
            'work_type': 'CONTRACT',
            'budget_min': 1000,
            'budget_max': 2000,
            'location': 'Test City',
            'start_date': date.today() + timedelta(days=7),
            'job_status': 'OPEN'
        }
    )
    if created:
        print(f"✅ Created job: {job.job_title}")
    else:
        print(f"📝 Job already exists: {job.job_title}")
    
    # 6. Create Long Pending Application
    print("\n6️⃣ Creating Long Pending Application...")
    old_date = timezone.now() - timedelta(days=10)
    application, created = JobApplication.objects.get_or_create(
        job_posting=job,
        laborer=laborer,
        defaults={
            'proposed_rate': 25.00,
            'application_status': 'PENDING',
            'cover_letter': 'Test application',
            'applied_at': old_date
        }
    )
    if not created:
        application.applied_at = old_date
        application.application_status = 'PENDING'
        application.save()
        print(f"📝 Updated application to be long-pending")
    else:
        print(f"✅ Created long-pending application")
    
    # 7. Create Disputed Work History
    print("\n7️⃣ Creating Disputed Work History...")
    disputed_work, created = WorkHistory.objects.get_or_create(
        job_posting=job,
        laborer=laborer,
        employer=verified_employer,
        defaults={
            'work_status': 'DISPUTED',
            'started_at': timezone.now() - timedelta(days=5),
            'employer_review': 'Work quality was not as expected',
            'laborer_review': 'Payment was delayed'
        }
    )
    if created:
        print(f"✅ Created disputed work history")
    else:
        disputed_work.work_status = 'DISPUTED'
        disputed_work.save()
        print(f"📝 Updated work history to DISPUTED")
    
    print("\n" + "=" * 60)
    print("✅ Test Data Setup Complete!")
    print("=" * 60)
    print("\n📋 Test Credentials:")
    print("   Coordinator: coordinator_test / test123")
    print("   Pending Employer: employer_pending_test / test123")
    print("   Verified Employer: employer_verified_test / test123")
    print("   Laborer: laborer_test / test123")
    print("\n🌐 Login at: http://localhost:8080/login")
    print("📊 Coordinator Dashboard: http://localhost:8080/dashboard/coordinator")

if __name__ == '__main__':
    setup_test_data()
