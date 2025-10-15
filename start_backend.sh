#!/bin/bash

# Backend Start Script - Uses Docker (same as Railway deployment)
# This script builds and runs the backend in Docker exactly as Railway does

set -e

echo "🐠 Starting Backend with Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t marine-map-backend -f backend/Dockerfile . --quiet

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"
echo ""

# Check if PostgreSQL container is running
if ! docker ps --format '{{.Names}}' | grep -q "marine-postgres"; then
    echo "🐘 Starting PostgreSQL container..."
    docker run -d \
        --name marine-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=marine_creatures \
        -p 5432:5432 \
        postgres:15-alpine

    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 3
    echo "✅ PostgreSQL started"
else
    echo "✅ PostgreSQL container already running"
fi

echo ""

# Stop and remove old backend container if exists
if docker ps -a --format '{{.Names}}' | grep -q "marine-backend"; then
    echo "🧹 Removing old backend container..."
    docker stop marine-backend > /dev/null 2>&1 || true
    docker rm marine-backend > /dev/null 2>&1 || true
fi

# Run the backend container
echo "🚀 Starting backend container..."
docker run -d \
    --name marine-backend \
    -p 8000:8000 \
    -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/marine_creatures" \
    -e PORT=8000 \
    -e ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000" \
    -v "$(pwd)/backend/uploads:/app/uploads" \
    -v "$(pwd)/backend/thumbnails:/app/thumbnails" \
    marine-map-backend

echo ""
echo "✅ Backend started successfully!"
echo ""
echo "📡 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo "📊 Health Check: http://localhost:8000/api/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    docker logs -f marine-backend"
echo "   Stop backend: docker stop marine-backend"
echo "   Stop all:     docker stop marine-backend marine-postgres"
echo ""
echo "Press Ctrl+C to view logs (containers will keep running)"
echo ""

# Follow logs
docker logs -f marine-backend
