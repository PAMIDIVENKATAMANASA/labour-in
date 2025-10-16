# Skilled Labor Platform - Local Development Setup

## 🚀 Quick Start Guide

This guide will help you run the Skilled Labor Platform locally and test all implemented features.

## 📋 Prerequisites

- Python 3.8+
- Virtual environment
- Redis (for real-time features)
- Git

## 🛠️ Step-by-Step Setup

### 1. Navigate to Project Directory
```bash
cd /home/manasa/laborlink-app/django_project
```

### 2. Activate Virtual Environment
```bash
source ../venv/bin/activate
```

### 3. Install Redis (Required for WebSocket and Celery)
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 4. Install Additional Dependencies
```bash
pip install redis psycopg2-binary  # For production database support
```

### 5. Run Database Migrations
```bash
python manage.py migrate
```

### 6. Create Superuser (Admin Account)
```bash
python manage.py createsuperuser
# Follow prompts to create admin account
```

### 7. Start the Development Server
```bash
# Terminal 1: Django Server
python manage.py runserver 0.0.0.0:8000
```

### 8. Start Celery Worker (Optional - for background tasks)
```bash
# Terminal 2: Celery Worker
celery -A skilled_labor_platform worker --loglevel=info
```

### 9. Start Celery Beat (Optional - for scheduled tasks)
```bash
# Terminal 3: Celery Beat
celery -A skilled_labor_platform beat --loglevel=info
```

## 🌐 Access Points

### Web Interfaces
- **Django Admin**: http://localhost:8000/admin/
- **API Root**: http://localhost:8000/api/
- **API Documentation**: http://localhost:8000/api/ (with browsable API)

### WebSocket Endpoints
- **Notifications**: ws://localhost:8000/ws/notifications/
- **Job Updates**: ws://localhost:8000/ws/job-updates/
- **Admin Updates**: ws://localhost:8000/ws/admin-updates/

## 🧪 Testing All Features

### 1. Test the Job Matching System
```bash
# Run the comprehensive test
python test_job_matching.py
```

### 2. Test API Endpoints

#### Authentication
```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "LABORER",
    "password": "testpass123",
    "password_confirm": "testpass123"
  }'

# Login and get JWT token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

#### Job Postings
```bash
# Get all jobs (requires authentication)
curl -X GET http://localhost:8000/api/jobs/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a job (employer only)
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Kitchen Renovation",
    "job_description": "Complete kitchen renovation project",
    "work_type": "CONTRACT",
    "budget_min": 2000,
    "budget_max": 3500,
    "location": "Brooklyn, NYC",
    "latitude": 40.6782,
    "longitude": -73.9442,
    "start_date": "2024-10-15"
  }'
```

### 3. Test Real-Time Features

#### WebSocket Connection (JavaScript)
```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test</title>
</head>
<body>
    <div id="notifications"></div>
    
    <script>
        // Connect to WebSocket
        const ws = new WebSocket('ws://localhost:8000/ws/notifications/');
        
        ws.onopen = function(event) {
            console.log('Connected to notifications WebSocket');
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log('Received notification:', data);
            
            // Display notification
            const div = document.getElementById('notifications');
            div.innerHTML += '<p>' + JSON.stringify(data) + '</p>';
        };
        
        ws.onclose = function(event) {
            console.log('WebSocket connection closed');
        };
    </script>
</body>
</html>
```

## 🔍 Feature Testing Checklist

### ✅ Core Models
- [ ] Custom User Model with user types
- [ ] Employer, Coordinator, Administrator, SkilledLaborer profiles
- [ ] Skills and LaborerSkills relationships
- [ ] JobPosting with required_skills
- [ ] JobApplication workflow
- [ ] WorkHistory tracking
- [ ] Notification system

### ✅ API Endpoints
- [ ] User registration and authentication
- [ ] JWT token-based auth
- [ ] CRUD operations for all models
- [ ] Role-based permissions
- [ ] Search and filtering
- [ ] Pagination

### ✅ Job Matching System
- [ ] Automatic signal triggering
- [ ] Skills-based matching
- [ ] Location-based filtering
- [ ] Dynamic notification generation
- [ ] Real-time delivery

### ✅ Real-Time Features
- [ ] WebSocket connections
- [ ] Live notifications
- [ ] Background task processing
- [ ] Multi-channel delivery

## 🐛 Troubleshooting

### Common Issues

#### 1. Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
sudo systemctl start redis-server
```

#### 2. Port Already in Use
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill the process
sudo kill -9 PID
```

#### 3. Database Issues
```bash
# Reset database
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

#### 4. Import Errors
```bash
# Ensure virtual environment is activated
source ../venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Debug Mode
```bash
# Enable debug logging
export DJANGO_LOG_LEVEL=DEBUG
python manage.py runserver --verbosity=2
```

## 📊 Monitoring

### Check System Status
```bash
# Check Django processes
ps aux | grep python

# Check Redis
redis-cli info

# Check Celery workers
celery -A skilled_labor_platform inspect active
```

### View Logs
```bash
# Django logs
tail -f logs/laborlink.log

# Celery logs
celery -A skilled_labor_platform events
```

## 🎯 Demo Scenarios

### Scenario 1: Complete Job Application Flow
1. **Create Employer**: Register as employer
2. **Create Job**: Post a job with required skills
3. **Create Laborer**: Register as skilled laborer
4. **Add Skills**: Assign skills to laborer
5. **Watch Matching**: Automatic notification creation
6. **Apply for Job**: Laborer applies via API
7. **Track Application**: Employer manages applications

### Scenario 2: Real-Time Notifications
1. **Open WebSocket**: Connect to notification endpoint
2. **Create Job**: Post new job as employer
3. **Watch Live**: See notifications appear in real-time
4. **Test Different Types**: Try various notification scenarios

### Scenario 3: Admin Management
1. **Login as Admin**: Use superuser account
2. **Manage Skills**: Add/edit skills via admin
3. **Monitor System**: View all users, jobs, applications
4. **Analytics**: Check dashboard data

## 🚀 Production Deployment

### Environment Variables
```bash
export DJANGO_SECRET_KEY="your-secret-key"
export DEBUG=False
export ALLOWED_HOSTS="your-domain.com"
export DATABASE_URL="postgresql://user:pass@host:port/db"
export REDIS_URL="redis://localhost:6379/0"
```

### Production Commands
```bash
# Collect static files
python manage.py collectstatic

# Run with production server
gunicorn skilled_labor_platform.wsgi:application

# Start Celery in production
celery -A skilled_labor_platform worker --detach
```

## 📱 Mobile Testing

### Test Push Notifications
1. Configure Firebase project
2. Add FCM server key to settings
3. Test push notification delivery
4. Verify mobile app integration

## 🔧 Development Tools

### Useful Commands
```bash
# Django shell
python manage.py shell

# Database shell
python manage.py dbshell

# Check migrations
python manage.py showmigrations

# Create new migration
python manage.py makemigrations

# Run specific test
python manage.py test api.tests.TestJobMatching
```

### API Testing Tools
- **Postman**: Import API collection
- **Insomnia**: REST client
- **curl**: Command line testing
- **Django REST Framework Browsable API**: Built-in interface

---

## 🎉 You're Ready!

The Skilled Labor Platform is now running locally with all features:
- ✅ **Django Admin Interface**
- ✅ **REST API with Authentication**
- ✅ **Real-Time WebSocket Notifications**
- ✅ **Automatic Job Matching**
- ✅ **Background Task Processing**
- ✅ **Comprehensive Testing Suite**

Start exploring the features and building your skilled labor marketplace!
