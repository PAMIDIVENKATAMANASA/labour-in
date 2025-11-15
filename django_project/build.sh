#!/bin/bash
# Build script for Render deployment
set -o errexit

echo "🔧 Building Django application..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate --noinput

# Collect static files (if needed)
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput || true

echo "✅ Build complete!"

