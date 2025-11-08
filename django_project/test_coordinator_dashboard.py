#!/usr/bin/env python
"""
Automated Test Script for Coordinator Dashboard Functionality
This script tests all coordinator features and generates a test report
"""

import os
import sys
import django
import requests
import json
from datetime import date, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skilled_labor_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import (
    Employer, SkilledLaborer, Coordinator,
    JobPosting, JobApplication, WorkHistory,
    Notification
)

User = get_user_model()

class CoordinatorDashboardTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.coordinator_token = None
        self.test_results = []
        
    def log_test(self, test_name, passed, message=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = {
            'test': test_name,
            'passed': passed,
            'message': message
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if message:
            print(f"   → {message}")
        return passed
    
    def authenticate_coordinator(self):
        """Login as coordinator and get token"""
        print("\n🔐 Authenticating as Coordinator...")
        try:
            # Get or create coordinator
            coordinator_user, created = User.objects.get_or_create(
                username='coordinator_test',
                defaults={
                    'email': 'coordinator@test.com',
                    'user_type': 'COORDINATOR',
                    'is_active': True
                }
            )
            if created:
                coordinator_user.set_password('test123')
                coordinator_user.save()
                Coordinator.objects.create(user=coordinator_user, region='Test Region')
            
            # Login via API
            response = requests.post(
                f"{self.api_url}/auth/login/",
                json={'username': 'coordinator_test', 'password': 'test123'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.coordinator_token = data.get('access')
                return self.log_test("Coordinator Authentication", True, "Token obtained")
            else:
                return self.log_test("Coordinator Authentication", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Coordinator Authentication", False, str(e))
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        print("\n📊 Testing Dashboard Stats...")
        try:
            headers = {'Authorization': f'Bearer {self.coordinator_token}'}
            response = requests.get(f"{self.api_url}/dashboard/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = [
                    'total_users', 'total_jobs', 'total_applications',
                    'total_laborers', 'total_employers', 'total_coordinators',
                    'disputed_projects', 'pending_employer_verification',
                    'long_pending_applications', 'unread_notifications'
                ]
                
                missing = [f for f in required_fields if f not in data]
                if missing:
                    return self.log_test("Dashboard Stats", False, f"Missing fields: {missing}")
                
                return self.log_test("Dashboard Stats", True, f"All fields present. Pending: {data.get('pending_employer_verification', 0)}")
            else:
                return self.log_test("Dashboard Stats", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Dashboard Stats", False, str(e))
    
    def test_employer_verification(self):
        """Test employer verification features"""
        print("\n🛡️ Testing Employer Verification...")
        
        # Test 1: Get pending employers
        try:
            headers = {'Authorization': f'Bearer {self.coordinator_token}'}
            response = requests.get(f"{self.api_url}/employers/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                employers = data if isinstance(data, list) else data.get('results', [])
                pending = [e for e in employers if e.get('verification_status') == 'PENDING']
                
                self.log_test("Get Pending Employers", True, f"Found {len(pending)} pending employers")
                
                # Test 2: Approve employer (if any pending)
                if pending:
                    employer = pending[0]
                    user_id = employer.get('user') if isinstance(employer.get('user'), (int, str)) else employer.get('user', {}).get('id')
                    
                    if user_id:
                        patch_response = requests.patch(
                            f"{self.api_url}/employers/{user_id}/",
                            headers={**headers, 'Content-Type': 'application/json'},
                            json={'verification_status': 'VERIFIED'}
                        )
                        
                        if patch_response.status_code in [200, 201]:
                            self.log_test("Approve Employer", True, "Employer verified successfully")
                        else:
                            self.log_test("Approve Employer", False, f"Status: {patch_response.status_code}")
                    else:
                        self.log_test("Approve Employer", False, "Could not find employer user ID")
                else:
                    self.log_test("Approve Employer", True, "No pending employers to approve (skipped)")
                
                return True
            else:
                return self.log_test("Get Pending Employers", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Employer Verification", False, str(e))
    
    def test_disputed_projects(self):
        """Test disputed projects features"""
        print("\n⚖️ Testing Disputed Projects...")
        try:
            headers = {'Authorization': f'Bearer {self.coordinator_token}'}
            response = requests.get(
                f"{self.api_url}/work-history/?work_status=DISPUTED",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                disputes = data if isinstance(data, list) else data.get('results', [])
                self.log_test("Get Disputed Projects", True, f"Found {len(disputes)} disputed projects")
                return True
            else:
                return self.log_test("Get Disputed Projects", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Disputed Projects", False, str(e))
    
    def test_long_pending_applications(self):
        """Test long pending applications"""
        print("\n⏰ Testing Long Pending Applications...")
        try:
            headers = {'Authorization': f'Bearer {self.coordinator_token}'}
            response = requests.get(
                f"{self.api_url}/applications/?application_status=PENDING",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                applications = data if isinstance(data, list) else data.get('results', [])
                
                # Filter for applications older than 7 days
                seven_days_ago = timezone.now() - timedelta(days=7)
                long_pending = [
                    app for app in applications
                    if app.get('applied_at') and 
                    timezone.datetime.fromisoformat(app['applied_at'].replace('Z', '+00:00')) < seven_days_ago
                ]
                
                self.log_test("Get Long Pending Applications", True, f"Found {len(long_pending)} long-pending applications")
                return True
            else:
                return self.log_test("Get Long Pending Applications", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Long Pending Applications", False, str(e))
    
    def test_user_search(self):
        """Test user search functionality"""
        print("\n🔍 Testing User Search...")
        try:
            headers = {'Authorization': f'Bearer {self.coordinator_token}'}
            response = requests.get(
                f"{self.api_url}/search/?q=test&type=all",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                users = data.get('users', [])
                self.log_test("User Search", True, f"Found {len(users)} users matching 'test'")
                return True
            else:
                return self.log_test("User Search", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("User Search", False, str(e))
    
    def test_notifications(self):
        """Test notifications functionality"""
        print("\n🔔 Testing Notifications...")
        try:
            headers = {'Authorization': f'Bearer {self.coordinator_token}'}
            
            # Get notifications
            response = requests.get(f"{self.api_url}/notifications/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                notifications = data if isinstance(data, list) else data.get('results', [])
                unread = [n for n in notifications if not n.get('is_read', False)]
                
                self.log_test("Get Notifications", True, f"Found {len(notifications)} notifications ({len(unread)} unread)")
                
                # Test mark all read
                if unread:
                    mark_read_response = requests.post(
                        f"{self.api_url}/notifications/mark_all_read/",
                        headers=headers
                    )
                    if mark_read_response.status_code == 200:
                        self.log_test("Mark All Read", True, "All notifications marked as read")
                    else:
                        self.log_test("Mark All Read", False, f"Status: {mark_read_response.status_code}")
                
                return True
            else:
                return self.log_test("Get Notifications", False, f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Notifications", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("🧪 COORDINATOR DASHBOARD AUTOMATED TEST SUITE")
        print("=" * 60)
        
        # Setup test data first
        print("\n📦 Setting up test data...")
        try:
            from setup_coordinator_test_data import setup_test_data
            setup_test_data()
            print("✅ Test data setup complete")
        except Exception as e:
            print(f"⚠️  Could not run setup script: {e}")
            print("   Continuing with existing data...")
        
        # Run tests
        self.authenticate_coordinator()
        
        if not self.coordinator_token:
            print("\n❌ Cannot proceed without authentication token")
            return
        
        self.test_dashboard_stats()
        self.test_employer_verification()
        self.test_disputed_projects()
        self.test_long_pending_applications()
        self.test_user_search()
        self.test_notifications()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r['passed'])
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"   - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        print("✅ Testing Complete!")
        print("=" * 60)
        print("\n🌐 View Dashboard: http://localhost:8080/dashboard/coordinator")
        print("📋 Login: coordinator_test / test123")

if __name__ == '__main__':
    tester = CoordinatorDashboardTester()
    tester.run_all_tests()

