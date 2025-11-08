# Network Access Setup Guide

## Overview
This guide explains how to access your application from other devices on the same WiFi network.

## Prerequisites
1. Both devices must be on the same WiFi network
2. You need to know your computer's local IP address (e.g., `10.19.58.120`)

## Step 1: Find Your IP Address

### On Linux/Mac:
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### On Windows:
```bash
ipconfig
# Look for IPv4 Address under your WiFi adapter
```

## Step 2: Update Django Settings

The settings have been updated to allow access from your network IP:
- `ALLOWED_HOSTS` includes your IP address
- `CORS_ALLOW_ALL_ORIGINS = True` in DEBUG mode (for development)
- `CSRF_TRUSTED_ORIGINS` includes your frontend URL

## Step 3: Start the Servers

### Backend (Django):
```bash
cd django_project
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### Frontend (Vite):
```bash
# In the project root
npm run dev -- --host 0.0.0.0 --port 8080
# or if using vite directly
vite --host 0.0.0.0 --port 8080
```

## Step 4: Access from Other Devices

1. **On your computer**: Access at `http://localhost:8080` or `http://127.0.0.1:8080`
2. **On other devices**: Access at `http://10.19.58.120:8080` (replace with your IP)

## Important Notes

### Security Warning
- `CORS_ALLOW_ALL_ORIGINS = True` is only enabled in DEBUG mode
- `ALLOWED_HOSTS = ['*']` is only for development
- **DO NOT use these settings in production!**

### Firewall
If you can't access from other devices:
1. Check your firewall settings
2. Allow incoming connections on ports 8000 and 8080
3. On Linux, you might need to run:
   ```bash
   sudo ufw allow 8000
   sudo ufw allow 8080
   ```

### Troubleshooting

#### CORS Errors
- Make sure Django server is running on `0.0.0.0:8000` (not just `localhost:8000`)
- Restart Django server after changing CORS settings
- Check browser console for specific CORS error messages

#### Connection Refused
- Verify both servers are running
- Check firewall settings
- Ensure devices are on the same network
- Try pinging the IP address from the other device

#### API Not Found
- Verify the frontend is using the correct API base URL
- Check `src/lib/api.ts` - it should detect port 8080 and use your IP
- The API base should be: `http://10.19.58.120:8000/api/`

## Testing

1. Open browser on another device
2. Navigate to `http://10.19.58.120:8080`
3. Try logging in
4. Check browser console for any errors
5. Check Django server logs for requests

## Production Deployment

For production, you should:
1. Set `DEBUG = False`
2. Remove `'*'` from `ALLOWED_HOSTS`
3. Set `CORS_ALLOW_ALL_ORIGINS = False`
4. Specify exact allowed origins in `CORS_ALLOWED_ORIGINS`
5. Use a proper web server (nginx, Apache) as reverse proxy
6. Use HTTPS with proper SSL certificates

