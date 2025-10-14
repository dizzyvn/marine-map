#!/bin/bash

# Da Nang Marine Creature Map - Frontend Start Script

echo "🐠 Starting Da Nang Marine Creature Map Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Start the development server
echo "🚀 Starting Vite dev server on http://localhost:5173..."
echo ""
npm run dev
