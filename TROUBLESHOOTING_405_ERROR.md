# 🔧 Troubleshooting 405 Error - Step by Step

## Current Issue
You're seeing `405 Method Not Allowed` errors even after setting `VITE_API_BASE` in Vercel.

## Why This Happens

The 405 error means the frontend is still calling `/api/auth/login/` (relative path) instead of your backend URL. This happens when:

1. **Environment variable not set correctly** in Vercel
2. **Build was done BEFORE setting the env var** (needs redeploy)
3. **Backend not deployed** or not accessible
4. **Environment variable name is wrong** (must be `VITE_API_BASE`)

## Step-by-Step Fix

### Step 1: Verify Environment Variable in Vercel

1. Go to https://vercel.com/dashboard
2. Select your `labour-in` project
3. Go to **Settings** → **Environment Variables**
4. Look for `VITE_API_BASE`
5. **Check:**
   - ✅ Key is exactly `VITE_API_BASE` (case-sensitive)
   - ✅ Value is your backend URL ending with `/api/` (e.g., `https://your-backend.railway.app/api/`)
   - ✅ All environments are selected (Production, Preview, Development)

### Step 2: Check Browser Console

Open your site and check the console. You should see:

```
[API] API_BASE resolved: {
  envVar: "https://your-backend.railway.app/api/",
  detected: "/api/",
  final: "https://your-backend.railway.app/api/",
  fullUrl: "https://your-backend.railway.app/api/auth/login/"
}
```

**If you see `envVar: "(not set)"`** → The environment variable is not being read.

### Step 3: Force Redeploy

**IMPORTANT:** After setting/changing environment variables, you MUST redeploy:

1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Wait for deployment to complete
6. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
7. Test again

### Step 4: Verify Backend is Deployed

**Do you have a backend deployed?** If not, that's the problem!

Test your backend directly:
```bash
# Replace with your actual backend URL
curl https://your-backend-url.railway.app/api/

# Should return: {"status":"ok","message":"Django API is running"}
```

**If backend is not deployed:**
- Deploy to Railway: https://railway.app
- Deploy to Render: https://render.com
- Get the backend URL
- Update `VITE_API_BASE` in Vercel with that URL

### Step 5: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login/signup
4. Look at the failed request
5. Check the **Request URL** - it should be your backend URL, not `https://labour-in.vercel.app/api/...`

**If URL is still `labour-in.vercel.app/api/...`:**
- Environment variable is not being used
- Need to redeploy Vercel
- Or environment variable name/value is wrong

## Common Mistakes

### ❌ Wrong Environment Variable Name
- `API_BASE` → Wrong! Must be `VITE_API_BASE`
- `VITE_API_URL` → Wrong! Must be `VITE_API_BASE`

### ❌ Wrong Value Format
- `https://backend.railway.app` → Wrong! Missing `/api/`
- `https://backend.railway.app/api` → Wrong! Missing trailing `/`
- `https://backend.railway.app/api/` → ✅ Correct!

### ❌ Forgot to Redeploy
- Setting env var alone is not enough
- Must redeploy after setting/changing env vars

### ❌ Backend Not Deployed
- Frontend can't work without backend
- Must deploy Django backend first

## Quick Diagnostic

Run this in browser console on your Vercel site:

```javascript
console.log("Environment check:", {
  hostname: window.location.hostname,
  apiBase: import.meta.env.VITE_API_BASE || "(not set)",
  allEnv: import.meta.env
})
```

**Expected output:**
```javascript
{
  hostname: "labour-in.vercel.app",
  apiBase: "https://your-backend.railway.app/api/",
  allEnv: { VITE_API_BASE: "https://your-backend.railway.app/api/", ... }
}
```

**If `apiBase` is `"(not set)"`** → Environment variable is not configured correctly.

## Still Not Working?

1. **Double-check backend is deployed and accessible**
2. **Verify environment variable in Vercel dashboard**
3. **Redeploy Vercel (don't skip this!)**
4. **Clear browser cache completely**
5. **Check console for the new diagnostic logs**

The new logging will show exactly what URL is being used. Share the console output if still having issues!

