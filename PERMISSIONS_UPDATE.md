# Permissions Update Summary

## Overview
This document summarizes all permission updates made to ensure admins and coordinators have full access to perform their required functions.

## Admin Permissions

### Job Posting
- ✅ **Create Jobs**: Admins can now create job postings (already implemented)
- ✅ **Update Jobs**: Admins can update any job posting (already implemented)
- ✅ **View All Jobs**: Admins can view all job postings in the system
- ✅ **View Applications**: Admins can view applications for any job

### Job Applications
- ✅ **Update Applications**: Admins can update any job application status
- ✅ **View All Applications**: Admins can view all applications in the system

### Work History
- ✅ **View All Work History**: Admins can view all work history records
- ✅ **Update Work History**: Admins can update any work history (for dispute resolution)
- ✅ **Create Work History**: Admins can create work history records manually if needed

### Users & Profiles
- ✅ **View All Users**: Admins can view all user profiles
- ✅ **Manage Users**: Admins can activate/deactivate users, update user information
- ✅ **View All Employers**: Admins can view all employer profiles
- ✅ **View All Laborers**: Admins can view all laborer profiles

### Notifications
- ✅ **View All Notifications**: Admins can view all notifications in the system
- ✅ **Send Reminders**: Admins can send reminder notifications for long-pending applications

## Coordinator Permissions

### Job Posting
- ✅ **View All Jobs**: Coordinators can view all job postings for oversight
- ✅ **View Applications**: Coordinators can view applications for any job

### Job Applications
- ✅ **Update Applications**: Coordinators can update any job application status
  - This allows coordinators to resolve long-pending applications
  - Coordinators can change application status (PENDING, ACCEPTED, REJECTED)
- ✅ **View All Applications**: Coordinators can view all applications in the system
- ✅ **Send Reminders**: Coordinators can send reminder notifications to employers and laborers for long-pending applications

### Work History (Dispute Resolution)
- ✅ **View All Work History**: Coordinators can view all work history records
- ✅ **Update Work History**: Coordinators can update any work history
  - **Key Feature**: This allows coordinators to resolve disputes by changing work_status
  - Coordinators can change status from DISPUTED to COMPLETED or CANCELLED
  - This is the primary mechanism for dispute resolution in the coordinator dashboard
- ✅ **Create Work History**: Coordinators can create work history records manually if needed

### Employer Verification
- ✅ **Verify Employers**: Coordinators can verify employer profiles (already implemented)
  - Can set verification_status to VERIFIED, REJECTED, or PENDING

### Notifications
- ✅ **View All Notifications**: Coordinators can view all notifications in the system
- ✅ **Send Reminders**: Coordinators can send reminder notifications via the new `/api/notifications/send_reminder/` endpoint

## Implementation Details

### Files Modified

1. **`django_project/api/views.py`**
   - **JobPostingViewSet**: Already allows admins to create/update jobs
   - **JobApplicationViewSet**: 
     - Updated `perform_update()` to allow coordinators to update any application
     - Updated `get_queryset()` to allow coordinators to see all applications
   - **WorkHistoryViewSet**: 
     - Updated `get_permissions()` to use `IsAuthenticated` only
     - Added `perform_update()` method to allow admins and coordinators to update any work history
     - Added `perform_create()` method to allow admins and coordinators to create work history
   - **NotificationViewSet**: 
     - Added `send_reminder()` action endpoint for sending reminders
     - Allows both admins and coordinators to send reminders

2. **`src/pages/CoordinatorDashboard.tsx`**
   - Updated `sendReminderMutation` to call the new `/api/notifications/send_reminder/` endpoint
   - The reminder functionality now properly sends notifications to both employer and laborer

### API Endpoints

#### New Endpoint: Send Reminder
- **URL**: `/api/notifications/send_reminder/`
- **Method**: `POST`
- **Authentication**: Required
- **Permissions**: Admin or Coordinator only
- **Request Body**:
  ```json
  {
    "application_id": 123
  }
  ```
- **Response**:
  ```json
  {
    "message": "Reminder notifications sent to both employer and laborer",
    "application_id": 123
  }
  ```
- **Behavior**: 
  - Creates a notification for the employer reminding them to review the application
  - Creates a notification for the laborer informing them the employer has been notified

## Testing Checklist

### Admin Dashboard
- [ ] Admin can post a new job
- [ ] Admin can view all job postings
- [ ] Admin can view all applications
- [ ] Admin can update application status
- [ ] Admin can view all work history
- [ ] Admin can update work history (resolve disputes)
- [ ] Admin can manage users (activate/deactivate)
- [ ] Admin can send reminders for long-pending applications

### Coordinator Dashboard
- [ ] Coordinator can view all job postings
- [ ] Coordinator can view all applications
- [ ] Coordinator can update application status (resolve long-pending)
- [ ] Coordinator can view all work history
- [ ] Coordinator can update work history (resolve disputes)
  - Change status from DISPUTED to COMPLETED
  - Change status from DISPUTED to CANCELLED
- [ ] Coordinator can send reminders for long-pending applications
- [ ] Coordinator can verify employers

## Quick Actions in Coordinator Dashboard

All quick actions should now work properly:
1. **Resolve Disputes**: Update work history status from DISPUTED to COMPLETED/CANCELLED
2. **Send Reminders**: Send notifications to employers and laborers for long-pending applications
3. **Verify Employers**: Update employer verification status

## Notes

- All permission checks are implemented at the ViewSet level using `perform_update()`, `perform_create()`, and `get_queryset()` methods
- Coordinators have the same level of access as admins for dispute resolution and application management
- The reminder system creates notifications for both parties involved in a long-pending application
- Work history updates by coordinators are the primary mechanism for dispute resolution

