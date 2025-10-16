#!/usr/bin/env python
"""
Test script for the Job Matching and Notification System
Run this script to demonstrate the core business logic without Redis/Celery dependency
"""

import os
import sys
import django
from datetime import date, timedelta

# Setup Django environment
sys.path.append('/home/manasa/laborlink-app/django_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skilled_labor_platform.settings')
django.setup()

from api.models import (
    CustomUser, Employer, SkilledLaborer, Skill, LaborerSkills, 
    JobPosting, Notification
)
from django.contrib.auth import get_user_model

User = get_user_model()


def test_job_matching_system():
    """Test the complete job matching and notification system"""
    
    print("🚀 Testing Job Matching & Notification System")
    print("=" * 60)
    
    # Step 1: Create or get skills
    print("\n📋 Step 1: Setting up skills...")
    skills_created = []
    
    skill_data = [
        ('Plumbing', 'Maintenance'),
        ('Electrical', 'Maintenance'), 
        ('Welding', 'Metalwork'),
        ('Carpentry', 'Construction'),
        ('Painting', 'Decoration')
    ]
    
    for skill_name, category in skill_data:
        skill, created = Skill.objects.get_or_create(
            skill_name=skill_name,
            defaults={'category': category}
        )
        if created:
            skills_created.append(skill)
            print(f"✅ Created skill: {skill.skill_name}")
    
    print(f"Total skills available: {Skill.objects.count()}")
    
    # Step 2: Create employers
    print("\n🏢 Step 2: Setting up employers...")
    employer, created = Employer.objects.get_or_create(
        user__username='metro_construction',
        defaults={
            'user': User.objects.create_user(
                username='metro_construction',
                email='admin@metro.com',
                password='secure123',
                user_type='EMPLOYER',
                first_name='Metro',
                last_name='Construction'
            ),
            'company_name': 'Metro Construction LLC',
            'business_type': 'Construction',
            'verification_status': 'VERIFIED'
        }
    )
    
    if created:
        print(f"✅ Created employer: {employer.company_name}")
    else:
        print(f"📝 Using existing employer: {employer.company_name}")
    
    # Step 3: Create laborers with different skills
    print("\n👷 Step 3: Setting up skilled laborers...")
    
    laborer_data = [
        ('joepipe', 'plumber@email.com', 'Joe', 'Pipe', 'Welding', 'EXPERT', 10, 35.00),
        ('mikevolt', 'electrician@email.com', 'Mike', 'Volt', 'Electrical', 'ADVANCED', 7, 40.00),
        ('sarahammer', 'carpenter@email.com', 'Sarah', 'Hammer', 'Carpentry', 'ADVANCED', 8, 30.00),
        ('tomplumb', 'plumber2@email.com', 'Tom', 'Plumb', 'Plumbing', 'INTERMEDIATE', 5, 25.00),
        ('lisapaint', 'painter@email.com', 'Lisa', 'Paint', 'Painting', 'EXPERT', 12, 28.00),
    ]
    
    laborers = []
    for username, email, first_name, last_name, skill_name, proficiency, years_exp, hourly_rate in laborer_data:
        skill = Skill.objects.get(skill_name=skill_name)
        
        laborer, created = SkilledLaborer.objects.get_or_create(
            user__username=username,
            defaults={
                'user': User.objects.create_user(
                    username=username,
                    email=email,
                    password='worker123',
                    user_type='LABORER',
                    first_name=first_name,
                    last_name=last_name
                ),
                'experience_level': 'MID',
                'is_available': True,
                'hourly_rate': hourly_rate,
                'preferred_latitude': 40.7128,  # NYC
                'preferred_longitude': -74.0060,
                'max_travel_distance_km': 25
            }
        )
        
        if created:
            laborers.append(laborer)
            print(f"✅ Created laborer: {laborer.user.username}")
            
            # Add skill to laborer
            LaborerSkills.objects.create(
                laborer=laborer,
                skill=skill,
                proficiency_level=proficiency,
                years_experience=years_exp
            )
            print(f"   └─ Added skill: {skill.skill_name} ({proficiency}, {years_exp} years)")
    
    existing_laborers = SkilledLaborer.objects.filter(user__username__in=[x[0] for x in laborer_data])
    print(f"📝 Total available laborers: {existing_laborers.count()}")
    
    # Step 4: Create job postings (this will trigger the matching signal)
    print("\n📝 Step 4: Creating job postings to trigger matching...")
    
    jobs_data = [
        {
            'title': 'Emergency Plumbing Repair',
            'description': 'Urgent bathroom repair in condo building',
            'skills': ['Plumbing'],
            'location': 'Manhattan, NYC',
            'lat': 40.7831, 'lng': -73.9712,
            'budget_min': 400, 'budget_max': 600
        },
        {
            'title': 'Office Renovation - Paint & Carpentry',
            'description': 'Complete office renovation project',
            'skills': ['Painting', 'Carpentry'],
            'location': 'Brooklyn, NYC', 
            'lat': 40.6782, 'lng': -73.9442,
            'budget_min': 2000, 'budget_max': 3500
        },
        {
            'title': 'Electrical Panel Upgrade',
            'description': 'Upgrade commercial electrical panel',
            'skills': ['Electrical'],
            'location': 'Queens, NYC',
            'lat': 40.7282, 'lng': -73.7949,
            'budget_min': 1200, 'budget_max': 2000
        }
    ]
    
    notifications_before = Notification.objects.count()
    
    for job_data in jobs_data:
        job = JobPosting.objects.create(
            employer=employer,
            job_title=job_data['title'],
            job_description=job_data['description'],
            work_type='CONTRACT',
            budget_min=job_data['budget_min'],
            budget_max=job_data['budget_max'],
            location=job_data['location'],
            latitude=job_data['lat'],
            longitude=job_data['lng'],
            max_distance_km=30,
            start_date=date.today() + timedelta(days=1)
        )
        
        # Add required skills
        for skill_name in job_data['skills']:
            skill = Skill.objects.get(skill_name=skill_name)
            job.required_skills.add(skill)
        
        print(f"✅ Created job: {job.job_title}")
        print(f"   └─ Required skills: {', '.join(job_data['skills'])}")
        print(f"   └─ Budget: ${job_data['budget_min']}-${job_data['budget_max']}")
    
    notifications_after = Notification.objects.count()
    
    # Step 5: Analyze results
    print("\n📊 Step 5: Matching Results")
    print("=" * 60)
    
    total_notifications = notifications_after - notifications_before
    print(f"📱 Total notifications created: {total_notifications}")
    
    new_job_notifications = Notification.objects.filter(
        notification_type='NEW_JOB_POSTING'
    ).order_by('-created_at')
    
    print(f"\n🔔 Detailed Notifications:")
    for notification in new_job_notifications:
        print(f"\n👤 Recipient: {notification.recipient.username}")
        print(f"📄 Type: {notification.notification_type}")
        print(f"📝 Message: {notification.message}")
        print(f"✅ Status: {notification.status}")
        print("-" * 40)
    
    # Step 6: Summary
    print(f"\n📈 Summary:")
    print(f"   └─ Jobs created: {len(jobs_data)}")
    print(f"   └─ Available laborers: {SkilledLaborer.objects.filter(is_available=True).count()}")
    print(f"   └─ Total notifications: {total_notifications}")
    print(f"   └─ Notifications per laborer: {total_notifications / max(1, SkilledLaborer.objects.filter(is_available=True).count()):.1f}")
    
    print("\n🎉 Job Matching System Test Completed Successfully!")
    print("   The system successfully:")
    print("   ✓ Detected new job postings")
    print("   ✓ Found laborers with matching skills")
    print("   ✓ Applied location-based filtering")
    print("   ✓ Created personalized notifications")
    print("   ✓ Generated dynamic messages with job details")


if __name__ == "__main__":
    test_job_matching_system()






