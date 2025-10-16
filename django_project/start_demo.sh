#!/bin/bash

echo "🚀 Starting Skilled Labor Platform Demo"
echo "========================================"

# Check if virtual environment exists
if [ ! -d "../venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source ../venv/bin/activate

# Check if Redis is running
echo "🔍 Checking Redis status..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running. Starting Redis..."
    sudo systemctl start redis-server
    sleep 2
fi

# Check if Redis is accessible
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not accessible. Please install and start Redis:"
    echo "   sudo apt install redis-server"
    echo "   sudo systemctl start redis-server"
    exit 1
fi

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Checking for admin user..."
if ! python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print('Admin exists:', User.objects.filter(username='admin').exists())" | grep -q "True"; then
    echo "👤 Creating admin user..."
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" | python manage.py shell
fi

# Start the server
echo "🌐 Starting Django development server..."
echo ""
echo "🎉 SKILLED LABOR PLATFORM IS READY!"
echo "========================================"
echo ""
echo "🌐 ACCESS POINTS:"
echo "   • Django Admin: http://localhost:8000/admin/"
echo "   • API Root: http://localhost:8000/api/"
echo "   • WebSocket Test: http://localhost:8000/static/test_websocket.html"
echo ""
echo "🔑 CREDENTIALS:"
echo "   • Username: admin"
echo "   • Password: admin123"
echo ""
echo "📚 DOCUMENTATION:"
echo "   • Setup Guide: README_SETUP.md"
echo "   • API Docs: API_DOCUMENTATION.md"
echo "   • Business Logic: BUSINESS_LOGIC_DOCUMENTATION.md"
echo ""
echo "🧪 TESTING:"
echo "   • Run: python demo_all_features.py"
echo "   • Run: python test_job_matching.py"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python manage.py runserver 0.0.0.0:8000
