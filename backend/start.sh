#!/bin/bash

# Da Nang Marine Creature Map - Backend Start Script

echo "🐠 Starting Da Nang Marine Creature Map Backend..."

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
pip install -r requirements.txt --quiet

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
fi

# Start the server
echo "🚀 Starting FastAPI server on http://localhost:8000..."
echo ""
uvicorn main:app --reload --port 8000
