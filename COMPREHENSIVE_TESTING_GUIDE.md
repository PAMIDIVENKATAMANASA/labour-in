# Comprehensive Testing Guide for All Dashboards

This guide provides step-by-step instructions for testing all dashboards and features in the Skilled Labor Platform.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Admin Dashboard Testing](#admin-dashboard-testing)
3. [Laborer Dashboard Testing](#laborer-dashboard-testing)
4. [Employer Dashboard Testing](#employer-dashboard-testing)
5. [Coordinator Dashboard Testing](#coordinator-dashboard-testing)
6. [Landing Page Testing](#landing-page-testing)
7. [Responsiveness Testing](#responsiveness-testing)
8. [Common Issues & Solutions](#common-issues--solutions)

---

## Prerequisites

### 1. Start Django Backend Server
```bash
cd /home/manasa/labour-in/django_project
source venv/bin/activate  # or python3 -m venv venv if needed
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
```

### 2. Start React Frontend
```bash
cd /home/manasa/labour-in
npm run dev
```

### 3. Access the Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

### 4. Create Test Users
You can create users via:
- **Django Admin**: http://localhost:8000/admin/
- **Signup Page**: http://localhost:8080/signup

**Required Test Users:**
- Admin user (user_type: ADMIN)
- Coordinator user (user_type: COORDINATOR)
- Employer user (user_type: EMPLOYER)
- Laborer user (user_type: LABORER)

---

## Admin Dashboard Testing

### Test 1: Login and Access
1. Go to http://localhost:8080/login
2. Login with admin credentials
3. Should redirect to `/admin` (Admin Dashboard)
4. Verify dashboard title: "System Admin Hub"

### Test 2: Dashboard Overview Stats
✅ **Check Statistics Cards:**
- Total Users count displays correctly
- Active Jobs count displays correctly
- Total Jobs Posted count displays correctly
- Pending Approvals count displays correctly

✅ **Check User Breakdown:**
- Laborers count
- Employers count
- Coordinators count

### Test 3: Navigation Links
✅ **Test Header Navigation:**
- Click "Users" → Should navigate to `/admin/users`
- Click "Skills" → Should navigate to `/admin/skills`
- Click "Jobs" → Should navigate to `/find-work`

### Test 4: Post Job Functionality
✅ **Post a Job:**
1. Click "Post a Job" button in System Management card
2. Fill in the form:
   - Job Title (min 5 characters)
   - Job Description (min 20 characters)
   - Work Type (FULL_TIME, PART_TIME, CONTRACT, TEMPORARY)
   - Location
   - Budget Min/Max
   - Start Date (required)
   - End Date (optional)
3. Click "Post Job"
4. Should see success toast
5. Job should appear in "Recent Job Postings" section

### Test 5: View Recent Jobs
✅ **Check Recent Jobs Card:**
- Should display up to 5 most recent jobs
- Each job shows: title, employer name, location, applicant count
- "View All" link navigates to `/find-work`

### Test 6: View Recent Applications
✅ **Check Recent Applications Card:**
- Should display up to 5 most recent applications
- Each application shows: laborer name, job title, proposed rate, status
- "View All" link navigates to `/dashboard/employer/applicants`

### Test 7: System Management
✅ **Test Management Buttons:**
- "Manage All Users" → Navigates to `/admin/users`
- "Manage Skills" → Navigates to `/admin/skills`
- "Post a Job" → Opens job posting modal

### Test 8: Notifications
✅ **Check Notification Bell:**
- Red dot appears if unread notifications > 0
- Click bell icon to view notifications (if implemented)

---

## Laborer Dashboard Testing

### Test 1: Login and Access
1. Go to http://localhost:8080/login
2. Login with laborer credentials
3. Should redirect to `/dashboard/laborer`
4. Verify dashboard title: "Laborer Dashboard"

### Test 2: Navigation Links
✅ **Test Header Navigation:**
- "Home" → Navigates to `/`
- "Find Work" → Navigates to `/find-work`
- "Contact Coordinator" button visible
- Notification bell icon visible

### Test 3: Profile Completeness Progress Bar
✅ **Check Progress Bar:**
1. View sidebar "Profile" card
2. Progress bar should display percentage (0-100%)
3. Progress updates when:
   - Adding profile information (name, bio, etc.)
   - Adding skills
   - Uploading avatar
   - Setting experience level
   - Setting hourly rate

### Test 4: Profile Management
✅ **Edit Profile:**
1. Click "Edit Profile" in Quick Actions
2. Update fields:
   - First Name, Last Name
   - Phone Number
   - Bio
   - Experience Level (JUNIOR, MID, SENIOR, EXPERT)
   - Years Experience
   - Hourly Rate
   - Max Travel Distance
3. Click "Save Changes"
4. Should see success toast
5. Progress bar should update

✅ **Upload Avatar:**
1. Click on avatar image in Profile card
2. Select image file
3. Avatar should update immediately
4. Progress bar should increase

### Test 5: Skills Management
✅ **Add Skill:**
1. Click "Manage Skills" in Quick Actions
2. Select a skill from dropdown
3. Select proficiency level (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
4. Enter years of experience
5. Click "Add Skill"
6. Should see success toast
7. Skill appears in list
8. Progress bar should update

✅ **Remove Skill:**
1. In Manage Skills dialog, click "Remove" on any skill
2. Skill should disappear
3. Progress bar should update

### Test 6: Availability Toggle
✅ **Test Availability Switch:**
1. In sidebar, find "Availability" card
2. Toggle switch ON/OFF
3. Should see toast: "Availability set to: Available/Not Available"
4. Status updates in real-time

### Test 7: New Jobs Tab
✅ **View Available Jobs:**
1. Click "New Jobs" tab
2. Should see list of open jobs
3. Each job card shows:
   - Job title
   - Employer name and location
   - Budget (hourly rate)
   - Job status badge
   - "Apply Now" button (if not already applied)

✅ **Apply for Job:**
1. Click "Apply Now" on any open job
2. Should navigate to `/jobs/{id}/apply`
3. Fill application form
4. Submit application
5. Job should show "Already Applied" status

### Test 8: Applied Jobs Tab
✅ **View Applications:**
1. Click "Applied Jobs" tab
2. Should see list of jobs you've applied to
3. Each application shows:
   - Job title
   - Applied date
   - Application status (PENDING, ACCEPTED, REJECTED)

### Test 9: Work History Tab
✅ **View Work History:**
1. Click "Work History" tab
2. Should see completed/ongoing jobs
3. Each entry shows:
   - Job title
   - Employer name
   - Work status (IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED)

### Test 10: Contact Coordinator
✅ **Send Message to Coordinator:**
1. Click "Contact Coordinator" button (header or Quick Actions)
2. Enter message in textarea
3. Click "Send Message"
4. Should see success toast: "Message sent to coordinator. You will be notified when they respond."
5. Message should appear in notifications

### Test 11: Notifications
✅ **View Notifications:**
1. Click notification bell icon
2. Should see dialog with all notifications
3. Unread notifications have "New" badge
4. Click on notification to mark as read
5. "Mark all read" button marks all as read
6. Red dot disappears when all read

✅ **Notification Types:**
- Application status updates
- Coordinator responses
- Job matches
- Work history updates

---

## Employer Dashboard Testing

### Test 1: Login and Access
1. Go to http://localhost:8080/login
2. Login with employer credentials
3. Should redirect to `/dashboard/employer`
4. Verify dashboard title: "Employer Dashboard"

### Test 2: Navigation Links
✅ **Test Header Navigation:**
- "Home" → Navigates to `/`
- "Browse Jobs" → Navigates to `/find-work`
- "Applicants" → Navigates to `/dashboard/employer/applicants`
- Notification bell icon visible

### Test 3: Dashboard Overview Stats
✅ **Check Statistics:**
- Active Jobs count
- Total Applicants count
- Completed Projects count

### Test 4: Post New Job
✅ **Post Job:**
1. Click "Post New Job" button (header or sidebar)
2. Fill in job details:
   - Job Title
   - Job Description
   - Work Type
   - Location
   - Budget Min/Max
   - Start Date
   - End Date (optional)
3. Click "Post Job"
4. Should see success toast
5. Job appears in "My Job Postings" table

### Test 5: View Job Postings
✅ **Check Jobs Table:**
- Lists all jobs posted by employer
- Shows: Job Title, Status, Applicants count, Actions
- Status badges: OPEN (green), CLOSED (gray), COMPLETED, DRAFT

✅ **View Job Details:**
1. Click "View" button on any job
2. Should navigate to `/dashboard/employer/jobs/{id}`
3. Job details page shows:
   - Full job description
   - Job status dropdown
   - List of applicants
   - Job details sidebar (budget, location, dates)

### Test 6: Manage Job Status
✅ **Update Job Status:**
1. On job details page, use status dropdown
2. Options: OPEN, CLOSED, COMPLETED
3. Select new status
4. Should see success toast
5. Status updates in real-time

### Test 7: View Applicants
✅ **View All Applicants:**
1. Click "Applicants" in header or navigate to `/dashboard/employer/applicants`
2. Should see table of all applications
3. Filter by:
   - Job title (search box)
   - Status (ALL, PENDING, ACCEPTED, REJECTED)

✅ **Approve/Reject Application:**
1. Find a PENDING application
2. Click "Approve" (green checkmark) or "Reject" (red X)
3. Should see success toast
4. Status updates immediately
5. Application moves to appropriate filter

### Test 8: View Job Applicants
✅ **View Applicants for Specific Job:**
1. On job details page, view "Applicants" section
2. Table shows:
   - Applicant name
   - Status badge
   - Action buttons (for pending applications)
3. Can approve/reject directly from job page

### Test 9: Delete Job
✅ **Delete Job Post:**
1. On job details page, click "Delete Job" button
2. Confirm deletion in alert dialog
3. Should see success toast
4. Redirected back to employer dashboard
5. Job removed from list

### Test 10: Notifications
✅ **Check Notifications:**
- Notification bell shows red dot if unread > 0
- Click to view notifications (if implemented)

---

## Coordinator Dashboard Testing

Refer to the existing `COORDINATOR_TESTING_GUIDE.md` for detailed coordinator testing instructions.

### Quick Checklist:
- ✅ Login as coordinator
- ✅ View dashboard stats (pending verifications, disputes, long pending apps)
- ✅ Approve/Reject employer verifications
- ✅ Resolve disputed projects
- ✅ View long pending applications
- ✅ Send reminders
- ✅ Search users
- ✅ View notifications
- ✅ Navigation links work

---

## Landing Page Testing

### Test 1: Page Load
1. Go to http://localhost:8080/
2. Should see:
   - Navbar with logo and navigation
   - Hero section with title and buttons
   - How It Works section
   - Featured Skills section
   - Footer

### Test 2: Navbar Links
✅ **Test Navigation:**
- Logo → Navigates to `/`
- "Find Work" → Navigates to `/find-work`
- "Hire Talent" → Navigates to `/hire-talent`
- "About Us" → Navigates to `/about`
- "Login" → Navigates to `/login` (if not logged in)
- "Sign Up" → Navigates to `/signup` (if not logged in)
- User menu → Shows dashboard link (if logged in)
- "Logout" → Logs out and redirects to `/`

### Test 3: Hero Section Buttons
✅ **Test CTA Buttons:**
- "I'm a Laborer, Find a Job" → Navigates to `/find-work`
- "I'm an Employer, Post a Job" → Navigates to `/hire-talent`
- Both buttons should be fully clickable
- Hover effects work

### Test 4: Footer Links
✅ **Test Footer Links:**

**For Workers:**
- "Find Work" → `/find-work`
- "Laborer Dashboard" → `/dashboard/laborer` (requires login)

**For Employers:**
- "Hire Talent" → `/hire-talent`
- "Employer Dashboard" → `/dashboard/employer` (requires login)

**Company:**
- "About Us" → `/about`
- "Contact" → `/contact`
- "Terms of Service" → `/terms`

**Social Media:**
- Facebook icon → Opens Facebook in new tab
- Twitter icon → Opens Twitter in new tab
- LinkedIn icon → Opens LinkedIn in new tab
- Instagram icon → Opens Instagram in new tab

### Test 5: Contact Page
1. Click "Contact" in footer
2. Should navigate to `/contact`
3. Page shows:
   - Contact form
   - Contact information (email, phone, address)
   - Business hours

### Test 6: Terms Page
1. Click "Terms of Service" in footer
2. Should navigate to `/terms`
3. Page shows terms of service content

### Test 7: About Page
1. Click "About Us" in navbar or footer
2. Should navigate to `/about`
3. Page shows about content

---

## Responsiveness Testing

### Test on Different Screen Sizes

#### Mobile (320px - 640px)
✅ **Check All Pages:**
- Navbar collapses appropriately
- Navigation links hide/show correctly
- Cards stack vertically
- Tables scroll horizontally or stack
- Buttons are full-width or appropriately sized
- Text is readable
- Images scale properly
- Forms are usable

#### Tablet (641px - 1024px)
✅ **Check All Pages:**
- Layout adapts to medium screens
- Grids show 2 columns where appropriate
- Navigation is accessible
- Sidebars stack or remain visible

#### Desktop (1025px+)
✅ **Check All Pages:**
- Full layout displays
- Sidebars visible
- Multi-column grids work
- Hover effects work
- All features accessible

### Specific Responsive Checks

#### Admin Dashboard
- ✅ Stats grid: 1 col (mobile) → 2 cols (tablet) → 4 cols (desktop)
- ✅ Management cards stack on mobile
- ✅ Navigation links hide on mobile, show on desktop

#### Laborer Dashboard
- ✅ Main content and sidebar stack on mobile
- ✅ Tabs are scrollable on mobile
- ✅ Profile card adapts to screen size
- ✅ Contact Coordinator button text hides on small screens

#### Employer Dashboard
- ✅ Jobs table scrolls horizontally on mobile
- ✅ Sidebar stacks below main content
- ✅ Post job modal is full-width on mobile

#### Landing Page
- ✅ Hero buttons stack on mobile
- ✅ Stats grid: 2 cols (mobile) → 4 cols (desktop)
- ✅ Footer columns stack on mobile

---

## Common Issues & Solutions

### Issue: Dashboard not loading
**Solution:**
- Check backend is running on port 8000
- Check frontend is running on port 8080
- Verify authentication token is valid
- Check browser console for errors
- Verify CORS settings in Django

### Issue: Progress bar not updating
**Solution:**
- Refresh the page after making changes
- Check that profile completeness API endpoint is working
- Verify skills are being saved correctly
- Check browser console for API errors

### Issue: Notifications not showing
**Solution:**
- Verify notification API endpoint is accessible
- Check that notifications are being created in database
- Refresh notifications list
- Check unread count is being fetched correctly

### Issue: Navigation links not working
**Solution:**
- Verify routes are defined in App.tsx
- Check that Link components are used (not anchor tags)
- Ensure paths match route definitions
- Check for authentication requirements

### Issue: Forms not submitting
**Solution:**
- Check form validation errors
- Verify API endpoints are correct
- Check network tab for API errors
- Verify required fields are filled

### Issue: Responsive layout broken
**Solution:**
- Check Tailwind classes are correct
- Verify breakpoint classes (sm:, md:, lg:)
- Test in browser dev tools responsive mode
- Check for CSS conflicts

---

## Quick Test Checklist

### Admin Dashboard
- [ ] Login works
- [ ] Stats display correctly
- [ ] Navigation links work
- [ ] Can post a job
- [ ] Recent jobs/applications display
- [ ] System management buttons work

### Laborer Dashboard
- [ ] Login works
- [ ] Navigation links work
- [ ] Progress bar displays and updates
- [ ] Can edit profile
- [ ] Can manage skills
- [ ] Can toggle availability
- [ ] Can view and apply to jobs
- [ ] Can view applications
- [ ] Can view work history
- [ ] Can contact coordinator
- [ ] Notifications work

### Employer Dashboard
- [ ] Login works
- [ ] Navigation links work
- [ ] Can post a job
- [ ] Can view job postings
- [ ] Can view job details
- [ ] Can update job status
- [ ] Can view applicants
- [ ] Can approve/reject applications
- [ ] Can delete jobs

### Coordinator Dashboard
- [ ] Login works
- [ ] Navigation links work
- [ ] Can view pending verifications
- [ ] Can approve/reject employers
- [ ] Can resolve disputes
- [ ] Can view long pending applications
- [ ] Can send reminders

### Landing Page
- [ ] All buttons work
- [ ] All footer links work
- [ ] Navigation works
- [ ] Responsive on all screen sizes

---

## Notes

- All dashboards require authentication
- Some features may require specific user types
- Test with different user roles to verify permissions
- Check browser console for errors during testing
- Use browser dev tools to test responsiveness
- Clear browser cache if seeing stale data

---

## Additional Resources

- Coordinator Testing Guide: `COORDINATOR_TESTING_GUIDE.md`
- API Documentation: `django_project/API_DOCUMENTATION.md`
- Business Logic: `django_project/BUSINESS_LOGIC_DOCUMENTATION.md`

