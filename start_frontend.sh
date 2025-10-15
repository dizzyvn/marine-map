#!/bin/bash

# Frontend Start Script - Mimics Vercel Deployment
# This script runs the frontend exactly as it would run on Vercel (dev mode)

set -e

echo "🐠 Starting Frontend (Vercel-like environment)..."
echo ""

# Change to frontend directory
cd frontend

# Check if node_modules exists or is incomplete
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@tailwindcss/postcss" ]; then
    echo "📦 Installing dependencies..."
    rm -rf node_modules package-lock.json
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check for environment variables
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: frontend/.env not found"
    echo "📝 Creating default .env file..."
    echo "VITE_API_URL=http://localhost:8000" > .env
    echo "✅ Created frontend/.env with default API URL"
fi

echo ""
echo "🔧 Configuration:"
source .env 2>/dev/null || true
echo "   VITE_API_URL: ${VITE_API_URL:-http://localhost:8000}"
echo ""

# Start development server (Vercel uses preview builds, but dev mode is equivalent for testing)
echo "🚀 Starting Vite dev server on http://localhost:5173..."
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
