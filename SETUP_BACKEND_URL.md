# ✅ Backend URL Setup - Quick Fix

## Your Backend URL
**Backend is deployed at:** `https://labour-in-1.onrender.com`

## Step 1: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your `labour-in` project

2. **Navigate to Environment Variables:**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add the Variable:**
   - **Key:** `VITE_API_BASE`
   - **Value:** `https://labour-in-1.onrender.com/api/`
   - **Important:** Must end with `/api/` (with trailing slash!)
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **Save**

4. **Redeploy (CRITICAL!):**
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click the **⋯** (three dots) menu
   - Click **Redeploy**
   - Wait for deployment to complete (2-3 minutes)

5. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear cache completely

6. **Test:**
   - Visit: https://labour-in.vercel.app/login
   - Open browser console (F12)
   - You should see: `[API] API_BASE resolved: { envVar: "https://labour-in-1.onrender.com/api/", ... }`
   - Try logging in - it should work!

## Verification

After redeploying, check the browser console. You should see:

```
[API] API_BASE resolved: {
  envVar: "https://labour-in-1.onrender.com/api/",
  detected: "/api/",
  final: "https://labour-in-1.onrender.com/api/",
  fullUrl: "https://labour-in-1.onrender.com/api/auth/login/"
}
```

If you see `envVar: "(not set)"`, the environment variable wasn't set correctly or you need to redeploy.

## Common Mistakes

❌ **Wrong:** `https://labour-in-1.onrender.com` (missing `/api/`)
❌ **Wrong:** `https://labour-in-1.onrender.com/api` (missing trailing `/`)
✅ **Correct:** `https://labour-in-1.onrender.com/api/`

## Still Not Working?

1. Double-check the environment variable is set correctly in Vercel
2. Make sure you **redeployed** after setting it
3. Clear browser cache completely
4. Check the Network tab in DevTools to see what URL is being called

The URL in the Network tab should be `https://labour-in-1.onrender.com/api/auth/login/`, NOT `https://labour-in.vercel.app/api/auth/login/`

