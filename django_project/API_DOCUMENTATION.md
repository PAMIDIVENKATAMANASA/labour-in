# Skilled Labor Platform - API Documentation

## Authentication
The API uses JWT (JSON Web Token) authentication.

### Register User
```http
POST /api/auth/register/
Content-Type: application/json

{
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "address": "123 Main St",
    "user_type": "LABORER",  // ADMIN, COORDINATOR, EMPLOYER, LABORER
    "password": "testpassword123",
    "password_confirm": "testpassword123"
}
```

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
    "username": "testuser",
    "password": "testpassword123"
}
```

Response includes JWT tokens and user info:
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "user_type": "LABORER",
        "is_active": true
    }
}
```

### Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## API Endpoints

All API requests require JWT authentication except registration and login. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### User Profiles
- `GET /api/users/profile/` - Get user profiles (own profile)
- `GET /api/users/profile/{id}/` - Get specific user profile (if admin)

### Employer Profiles
- `GET /api/employers/` - List employers
- `GET /api/employers/{id}/` - Get employer details
- `POST /api/employers/` - Create employer profile (employers only)
- `PUT/PATCH /api/employers/{id}/` - Update employer profile (owner only)

### Laborer Profiles
- `GET /api/laborers/` - List laborers
- `GET /api/laborers/{id}/` - Get laborer details
- `POST /api/laborers/` - Create laborer profile (laborers only)
- `PUT/PATCH /api/laborers/{id}/` - Update laborer profile (owner only)

### Skills Management (Admin only)
- `GET /api/skills/` - List all skills
- `POST /api/skills/` - Create skill (admin only)
- `PUT/PATCH /api/skills/{id}/` - Update skill (admin only)
- `DELETE /api/skills/{id}/` - Delete skill (admin only)

### Laborer Skills
- `GET /api/laborer-skills/` - List laborer skills
- `POST /api/laborer-skills/` - Add skill to laborer
- `PUT/PATCH /api/laborer-skills/{id}/` - Update skill proficiency
- `DELETE /api/laborer-skills/{id}/` - Remove skill from laborer

### Job Postings
- `GET /api/jobs/` - List all job postings
- `GET /api/jobs/{id}/` - Get job details
- `POST /api/jobs/` - Create job posting (employers only)
- `PUT/PATCH /api/jobs/{id}/` - Update job posting (owner only)
- `DELETE /api/jobs/{id}/` - Delete job posting (owner only)

**Query Parameters:**
- `work_type` - Filter by job type
- `job_status` - Filter by status
- `search` - Search in title/description/location
- `ordering` - Sort by fields like `created_at`, `budget_min`

**Special Endpoint:**
- `GET /api/jobs/{id}/applications/` - Get applications for job (employer/admin only)

### Job Applications
- `GET /api/applications/` - List applications (role-based filtering)
- `GET /api/applications/{id}/` - Get application details
- `POST /api/applications/` - Apply for job (laborers only)
- `PATCH /api/applications/{id}/` - Update application status (job owner only)

**For Laborers:** See only your applications
**For Employers:** See only applications for your jobs
**For Admins:** See all applications

### Work History
- `GET /api/work-history/` - List work history (role-based filtering)
- `GET /api/work-history/{id}/` - Get work details
- `POST/PUT/PATCH /api/work-history/{id}/` - Manage work history

### Notifications
- `GET /api/notifications/` - List your notifications
- `GET /api/notifications/{id}/` - Get notification details
- `POST /api/notifications/{id}/mark_read/` - Mark as read
- `POST /api/notifications/mark_all_read/` - Mark all as read

### Utility Endpoints
- `GET /api/search/?q={query}&type={type}` - Search jobs, skills, laborers
- `GET /api/dashboard/` - Get dashboard data (role-based)

## Permissions Summary

### JobPostingViewSet
- **List/Retrieve:** All authenticated users
- **Create:** Employers only
- **Update/Delete:** Job owner only

### JobApplicationViewSet
- **Create:** Laborers only
- **List:** Role-based filtering
- **Update Application Status:** Job owner employers only

### SkillViewSet
- **All Actions:** Admin users only

### User/Profile ViewSets
- **Read:** Authenticated users (own profile or admin access)
- **Write:** Owner only (or admin for admins)

## Response Formats

### Success Response (201/200)
```json
{
    "field1": "value1",
    "field2": "value2"
}
```

### Error Response (400/403/404)
```json
{
    "field_name": ["Error message"],
    "non_field_errors": ["General error message"]
}
```

## Pagination
Most list endpoints support pagination with 20 items per page:
- `GET /api/jobs/?page=2`
- Response includes `count`, `next`, `previous`, `results`

## Filtering & Search
- Use Django REST framework filtering
- Search fields vary by endpoint
- Ordering available on timestamp and relevant fields

Example filtered request:
```http
GET /api/jobs/?work_type=FULL_TIME&job_status=OPEN&search=construction&ordering=-created_at
```






