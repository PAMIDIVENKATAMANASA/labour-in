# How to Start the Django Backend Server

## Quick Start

The `ERR_CONNECTION_REFUSED` error means the Django backend server is not running or not accessible.

### Step 1: Stop Any Running Servers

First, stop any existing Django servers:

```bash
# Find and kill existing Django processes
pkill -f "manage.py runserver"

# Or manually kill the process if you know the PID
# kill <PID>
```

### Step 2: Navigate to Django Project

```bash
cd /home/manasa/labour-in/django_project
```

### Step 3: Activate Virtual Environment

```bash
# Option 1: If venv exists and works
source venv/bin/activate

# Option 2: If venv has issues, recreate it
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 4: Run Database Migrations (if needed)

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 5: Start the Server

```bash
python manage.py runserver 0.0.0.0:8000
```

You should see output like:
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CONTROL-C.
```

### Step 6: Verify Server is Running

Open a new terminal and test:

```bash
curl http://localhost:8000/api/
```

You should get a response (even if it's an error, it means the server is running).

## Alternative: Use System Python

If the virtual environment has issues, you can use system Python:

```bash
cd /home/manasa/labour-in/django_project
python3 manage.py runserver 0.0.0.0:8000
```

## Troubleshooting

### Port Already in Use

If you see "Address already in use":

```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Virtual Environment Issues

If you see "bad interpreter" errors:

```bash
# Remove old venv
rm -rf venv

# Create new venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Permission Errors

Make sure you have write permissions:

```bash
chmod +x manage.py
```

## Keep Server Running

To keep the server running in the background:

```bash
# Option 1: Use nohup
nohup python manage.py runserver 0.0.0.0:8000 > server.log 2>&1 &

# Option 2: Use screen
screen -S django-server
python manage.py runserver 0.0.0.0:8000
# Press Ctrl+A then D to detach
# Use 'screen -r django-server' to reattach
```

## Check Server Status

```bash
# Check if server is running
ps aux | grep "manage.py runserver"

# Check if port 8000 is listening
netstat -tuln | grep 8000
# or
ss -tuln | grep 8000
```

## Frontend Connection

Once the server is running, your frontend at `http://localhost:8080` should be able to connect to the API at `http://localhost:8000/api/`.

Make sure:
- Django server is running on port 8000
- Frontend dev server is running on port 8080
- No firewall is blocking the connection
- CORS is properly configured in Django settings

