# Vercel Environment Variable Setup - FIX API 405/404 ERRORS

## 🚨 The Problem

You're seeing these errors:
- `405 Method Not Allowed` on `/auth/register/`
- `404 Not Found` on API endpoints

**Root Cause:** Your frontend is deployed on Vercel, but it's trying to call `/api/` which doesn't exist. You need to point it to your deployed Django backend.

---

## ✅ The Solution

You need to set the `VITE_API_BASE` environment variable in Vercel to point to your Django backend URL.

### Step 1: Deploy Your Django Backend

First, you need to deploy your Django backend somewhere. Options:

1. **Railway** (Recommended - Easy)
   - Go to https://railway.app
   - Sign up/login
   - Create new project → Deploy from GitHub
   - Select your repo → Deploy Django
   - Railway will auto-detect Django and deploy it
   - Get your backend URL (e.g., `https://your-app.railway.app`)

2. **Render** (Free tier available)
   - Go to https://render.com
   - Create new Web Service
   - Connect your GitHub repo
   - Set build command: `cd django_project && pip install -r requirements.txt`
   - Set start command: `cd django_project && gunicorn skilled_labor_platform.wsgi:application`
   - Get your backend URL (e.g., `https://your-app.onrender.com`)

3. **Heroku** (Paid, but reliable)
4. **DigitalOcean App Platform**
5. **AWS/GCP/Azure** (More complex)

### Step 2: Update Django CORS Settings

Once your backend is deployed, update `django_project/skilled_labor_platform/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://labour-in.vercel.app",
    "https://your-production-domain.com",  # Add your custom domain if you have one
]

CSRF_TRUSTED_ORIGINS = [
    "https://labour-in.vercel.app",
    "https://your-production-domain.com",
]
```

**Important:** Make sure `DEBUG = False` in production!

### Step 3: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Select your `labour-in` project

2. **Navigate to Settings:**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add the Variable:**
   - **Key:** `VITE_API_BASE`
   - **Value:** `https://your-backend-url.railway.app/api/` (replace with your actual backend URL)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   **Example:**
   ```
   Key: VITE_API_BASE
   Value: https://labour-in-backend.railway.app/api/
   ```

4. **Redeploy:**
   - After adding the variable, go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger redeploy

### Step 4: Verify It Works

1. Open your Vercel site: `https://labour-in.vercel.app`
2. Open browser DevTools (F12) → Console tab
3. You should see: `[API] Using Production API Base from env: https://your-backend-url.railway.app/api/`
4. Try signing up - it should work now!

---

## 🔍 Quick Check: Is Your Backend Deployed?

Test your backend directly:

```bash
# Replace with your actual backend URL
curl https://your-backend-url.railway.app/api/auth/register/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","password_confirm":"test123","user_type":"LABORER","first_name":"Test","last_name":"User"}'
```

If you get a response (even an error about missing fields), your backend is working!

---

## 🛠️ Alternative: Use Vercel API Routes (Not Recommended for Django)

If you want to keep everything on Vercel, you'd need to:
1. Convert Django API to serverless functions
2. Use Vercel's API routes
3. This is a major refactor and not recommended

**Better approach:** Deploy Django separately and connect via environment variable.

---

## 📝 Summary Checklist

- [ ] Deploy Django backend (Railway/Render/etc.)
- [ ] Update Django CORS settings with Vercel frontend URL
- [ ] Set `VITE_API_BASE` in Vercel environment variables
- [ ] Redeploy Vercel frontend
- [ ] Test API calls work
- [ ] Verify signup/login works

---

## 🆘 Still Having Issues?

1. **Check browser console** - Look for the `[API]` logs to see what URL is being used
2. **Check Vercel build logs** - Make sure the environment variable is being read
3. **Test backend directly** - Use curl/Postman to verify backend works
4. **Check CORS** - Make sure Django allows your Vercel domain
5. **Check network tab** - See the actual request URL and response

---

**After setting the environment variable, your API calls should work!** 🎉

