#!/bin/bash

# Backend Start Script - Mimics Railway Docker Deployment
# This script runs the backend exactly as it would run on Railway

set -e

echo "🐠 Starting Backend (Railway-like environment)..."
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  WARNING: backend/.env not found"
    echo "📝 Creating backend/.env from .env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env - please update DATABASE_URL and other settings"
    else
        echo "❌ ERROR: backend/.env.example not found"
        exit 1
    fi
fi

# Source environment variables
export $(grep -v '^#' backend/.env | xargs)

# Set default PORT if not set
export PORT=${PORT:-8000}

# Set default DATABASE_URL if not set (for local PostgreSQL)
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://marine_user:marine_password@localhost:5432/marine_map"
    echo "📊 Using local database: $DATABASE_URL"
fi

echo "🔧 Configuration:"
echo "   PORT: $PORT"
echo "   DATABASE_URL: ${DATABASE_URL%%\?*}" # Hide query params
echo ""

# Change to backend directory
cd backend

# Check if we're in Docker or local
if [ -f "/.dockerenv" ]; then
    echo "🐳 Running in Docker container"
    # In Docker, dependencies are already installed
else
    echo "💻 Running locally"

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "📦 Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate

    # Install/update dependencies
    echo "📥 Installing dependencies..."
    pip install -q -r requirements.txt
    echo ""
fi

# Create required directories
mkdir -p uploads thumbnails

# Start the server (exactly as Railway does)
echo "🚀 Starting FastAPI server on http://0.0.0.0:$PORT..."
echo "📡 API documentation: http://localhost:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn main_db:app --host 0.0.0.0 --port $PORT
