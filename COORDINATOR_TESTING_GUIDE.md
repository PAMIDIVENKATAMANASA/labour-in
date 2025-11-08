# Coordinator Dashboard Testing Guide

This guide will help you test all coordinator dashboard functionalities.

## Prerequisites

1. **Start Django Backend Server:**
   ```bash
   cd /home/manasa/labour-in/django_project
   python3 -m venv venv  # If venv doesn't exist
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Start React Frontend:**
   ```bash
   cd /home/manasa/labour-in
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000/api/

## Step 1: Create Test Users

### Option A: Using Django Admin (Recommended)

1. Go to http://localhost:8000/admin/
2. Login with admin credentials (or create superuser if needed):
   ```bash
   cd django_project
   python manage.py createsuperuser
   ```

3. Create test users:
   - **Coordinator User:**
     - Username: `coordinator1`
     - Email: `coordinator@test.com`
     - User Type: `COORDINATOR`
     - Password: `test123`
   
   - **Employer User (Pending Verification):**
     - Username: `employer_pending`
     - Email: `employer@test.com`
     - User Type: `EMPLOYER`
     - Password: `test123`
     - Create Employer profile with `verification_status = PENDING`
   
   - **Employer User (Verified):**
     - Username: `employer_verified`
     - Email: `employer2@test.com`
     - User Type: `EMPLOYER`
     - Password: `test123`
     - Create Employer profile with `verification_status = VERIFIED`
   
   - **Laborer User:**
     - Username: `laborer1`
     - Email: `laborer@test.com`
     - User Type: `LABORER`
     - Password: `test123`

### Option B: Using Signup Page

1. Go to http://localhost:8080/signup
2. Create users with different roles

## Step 2: Create Test Data

### Create Pending Employer Verification

1. Login as `employer_pending` (or create a new employer)
2. The employer should have `verification_status = PENDING`
3. This will appear in Coordinator Dashboard

### Create Disputed Projects

1. Login as an employer and create a job
2. Login as a laborer and apply for the job
3. Accept the application (this creates WorkHistory)
4. In Django Admin, go to Work History and set `work_status = DISPUTED`

### Create Long Pending Applications

1. Login as an employer and create a job
2. Login as a laborer and apply for the job
3. Don't accept/reject the application
4. In Django Admin, modify the `applied_at` date to be more than 7 days ago:
   ```python
   from api.models import JobApplication
   from django.utils import timezone
   from datetime import timedelta
   
   app = JobApplication.objects.first()
   app.applied_at = timezone.now() - timedelta(days=8)
   app.save()
   ```




## Step 3: Test Coordinator Dashboard Features

### Test 1: Login as Coordinator

1. Go to http://localhost:8080/login
2. Login with:
   - Username: `coordinator1`
   - Password: `test123`
3. You should be redirected to `/dashboard/coordinator`

### Test 2: Dashboard Overview

✅ **Check if dashboard loads:**
- Dashboard title "Coordinator Oversight Hub" should be visible
- Four stat cards should display:
  - Pending Employer Verifications
  - Disputed Projects
  - Long Pending Applications
  - Total Users

✅ **Check Platform Statistics sidebar:**
- Should show counts for:
  - Total Jobs
  - Total Applications
  - Laborers
  - Employers
  - Coordinators

### Test 3: Pending Employer Verification

✅ **View Pending Employers:**
1. Click on "Pending Employer Verifications" stat card OR
2. Click on "Verifications" tab
3. Should see list of employers with `PENDING` status

✅ **Review Employer:**
1. Click "Review" button on any pending employer
2. Dialog should open showing:
   - Company Name
   - Business Type
   - Company Size
   - Established Year

✅ **Approve Employer:**
1. In review dialog, click "Approve" button
2. Should see success toast: "Employer verified successfully"
3. Employer should disappear from pending list
4. Count should decrease

✅ **Reject Employer:**
1. Click "Review" on another pending employer
2. Enter rejection reason in textarea
3. Click "Reject" button
4. Should see success toast: "Employer verification rejected"
5. Employer should disappear from list

### Test 4: Disputed Projects

✅ **View Disputed Projects:**
1. Click on "Disputed Projects" stat card OR
2. Click on "Disputes" tab
3. Should see list of projects with `DISPUTED` status

✅ **Resolve Dispute:**
1. Click "Resolve" button on a disputed project
2. Dialog should show:
   - Job Title
   - Location
   - Employer name
   - Laborer name
   - Employer review (if exists)
   - Laborer review (if exists)
3. Enter resolution note
4. Click either:
   - "Mark as Completed" - should change status to COMPLETED
   - "Mark as Cancelled" - should change status to CANCELLED
5. Should see success toast
6. Project should disappear from disputed list

### Test 5: Long Pending Applications

✅ **View Long Pending Applications:**
1. Click on "Long Pending Applications" stat card OR
2. Click on "Long Pending Applications" tab
3. Should see applications pending > 7 days
4. Each should show:
   - Job title
   - Laborer → Employer
   - Days pending
   - Proposed rate

✅ **Search Applications:**
1. Use search box to filter by:
   - Job title
   - Laborer username
   - Employer company name

✅ **Send Reminder:**
1. Click "Send Reminder" button
2. Should see toast notification
3. (In production, this would send email/notification)

### Test 6: User Search

✅ **Search Users:**
1. In sidebar, find "User Search" card
2. Enter search query (username, email, name)
3. Click "Search" or press Enter
4. Should display matching users with:
   - Username
   - Email
   - User type badge

### Test 7: Notifications

✅ **View Notifications:**
1. Click bell icon in top right
2. Dialog should open showing notifications
3. Should display:
   - Notification message
   - Timestamp
   - Notification type

✅ **Mark All Read:**
1. Click "Mark All Read" button
2. Should see success toast
3. Red notification badge should disappear

### Test 8: Tab Navigation

✅ **Switch Tabs:**
1. Click on different tabs:
   - Overview
   - Verifications
   - Disputes
   - Long Pending Applications
2. Content should change accordingly
3. Active tab should be highlighted

### Test 9: Quick Actions

✅ **Quick Action Buttons:**
1. In sidebar, click:
   - "Manage Disputes" - should switch to Disputes tab
   - "Review Verifications" - should switch to Verifications tab
   - "Long Pending Apps" - should switch to Applications tab

### Test 10: Error Handling

✅ **Test with Backend Offline:**
1. Stop Django server
2. Refresh coordinator dashboard
3. Should show error message with "Refresh" button
4. Dashboard structure should still be visible

✅ **Test with Invalid Data:**
1. Dashboard should handle missing data gracefully
2. Should show "0" or empty states instead of crashing

## Step 4: Verify Data Updates

### Check Backend Changes

1. Go to Django Admin: http://localhost:8000/admin/
2. Verify changes:
   - **Employer Verification:** Check `api_employer` table - `verification_status` should be updated
   - **Disputed Projects:** Check `api_workhistory` table - `work_status` should be updated
   - **Applications:** Check `api_jobapplication` table

## Step 5: Browser Console Checks

1. Open Browser DevTools (F12)
2. Check Console tab:
   - Should see: "CoordinatorDashboard component mounted"
   - No red errors
   - API calls should be logged

3. Check Network tab:
   - `/api/dashboard/` - should return 200
   - `/api/employers/` - should return 200
   - `/api/work-history/?work_status=DISPUTED` - should return 200
   - `/api/applications/?application_status=PENDING` - should return 200

## Common Issues & Solutions

### Issue: Dashboard not appearing
**Solution:** 
- Check browser console for errors
- Verify backend is running on port 8000
- Verify you're logged in as COORDINATOR user

### Issue: No pending employers showing
**Solution:**
- Create employers with `verification_status = PENDING` in Django Admin
- Refresh the dashboard

### Issue: API errors
**Solution:**
- Check Django server logs
- Verify CORS settings in Django
- Check authentication token is valid

### Issue: Empty lists
**Solution:**
- Create test data as described in Step 2
- Check database has records
- Verify filters are correct

## Quick Test Checklist

- [ ] Login as coordinator works
- [ ] Dashboard loads with stats
- [ ] Pending employer verification list shows
- [ ] Approve employer works
- [ ] Reject employer works
- [ ] Disputed projects list shows
- [ ] Resolve dispute works
- [ ] Long pending applications list shows
- [ ] Search applications works
- [ ] User search works
- [ ] Notifications display
- [ ] Mark all read works
- [ ] Tab navigation works
- [ ] Quick actions work
- [ ] Error handling works
- [ ] No console errors

## Testing from Laborer Perspective

To test coordinator features from laborer view:

1. **Create a dispute:**
   - Login as laborer
   - Apply for a job
   - Get accepted
   - Contact coordinator about an issue
   - Coordinator can see it in Disputed Projects

2. **Check application status:**
   - Login as laborer
   - Apply for a job
   - Wait 7+ days without response
   - Coordinator can see it in Long Pending Applications

3. **Verify employer:**
   - As a laborer, you can see which employers are verified
   - Only verified employers should be trusted

## API Testing (Optional)

You can also test using curl or Postman:

```bash
# Get dashboard stats (as coordinator)
curl -X GET http://localhost:8000/api/dashboard/ \
  -H "Authorization: Bearer YOUR_COORDINATOR_TOKEN"

# Get pending employers
curl -X GET http://localhost:8000/api/employers/ \
  -H "Authorization: Bearer YOUR_COORDINATOR_TOKEN"

# Approve employer
curl -X PATCH http://localhost:8000/api/employers/EMPLOYER_USER_ID/ \
  -H "Authorization: Bearer YOUR_COORDINATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verification_status": "VERIFIED"}'
```

## Notes

- All coordinator actions require authentication
- Coordinator can view all employers, but only update verification_status
- Coordinator can view all work history, but only resolve disputes
- Coordinator can view all applications for oversight purposes

