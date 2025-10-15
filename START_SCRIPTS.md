# Local Development Start Scripts

This project includes two start scripts for local development and testing:

## 🖥️ Backend (Uses Docker)

**Script:** `./start_backend.sh`

This script runs the backend in Docker, exactly as Railway does in production:
- Builds Docker image from `backend/Dockerfile`
- Starts PostgreSQL container automatically
- Starts backend container with proper environment variables
- Mounts local `uploads` and `thumbnails` directories
- Shows logs automatically

### Prerequisites

1. Docker Desktop installed and running
2. That's it! Everything else is handled automatically.

### Quick Start

```bash
# Start backend (will build image and start PostgreSQL automatically)
./start_backend.sh
```

The script will:
1. Build the Docker image
2. Start PostgreSQL container (if not running)
3. Start backend container
4. Show logs (press Ctrl+C to exit logs, containers keep running)

**URLs:**
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

**Useful commands:**
```bash
# View logs
docker logs -f marine-backend

# Stop backend only
docker stop marine-backend

# Stop everything
docker stop marine-backend marine-postgres

# Remove everything
docker rm marine-backend marine-postgres
```

## 🌐 Frontend (Vercel-like)

**Script:** `./start_frontend.sh`

This script starts the frontend in development mode:
- Installs dependencies with `npm install`
- Runs Vite dev server on port 5173
- Loads environment from `frontend/.env`

### Prerequisites

1. Node.js 18+ installed
2. Backend running on port 8000 (or update VITE_API_URL)

### Quick Start

```bash
# Run frontend
./start_frontend.sh
```

The frontend will be available at: http://localhost:5173

## 🚀 Running Both

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start_frontend.sh
```

Then open http://localhost:5173 in your browser.

## 📝 Environment Variables

### Backend
Environment variables are set automatically by the `start_backend.sh` script:
- `DATABASE_URL`: Points to the PostgreSQL container
- `PORT`: 8000
- `ALLOWED_ORIGINS`: localhost:5173,localhost:3000

### Frontend (`frontend/.env`)
The script will create this file automatically if it doesn't exist:
```env
VITE_API_URL=http://localhost:8000
```

## 🔍 Troubleshooting

### Backend Issues

**Docker not running:**
- Start Docker Desktop
- Wait for Docker to fully start

**Port 8000 already in use:**
- Stop the old container: `docker stop marine-backend`
- Or use a different port (edit start_backend.sh)

**Database connection failed:**
- Check if PostgreSQL container is running: `docker ps | grep postgres`
- Restart PostgreSQL: `docker restart marine-postgres`
- Check logs: `docker logs marine-postgres`

**Build errors:**
- Clear Docker cache: `docker system prune`
- Rebuild: `docker build --no-cache -t marine-map-backend -f backend/Dockerfile .`

### Frontend Issues

**API connection failed:**
- Ensure backend is running: `docker ps | grep marine-backend`
- Check backend logs: `docker logs marine-backend`
- Verify CORS settings allow localhost:5173

**Dependencies errors:**
- Delete `frontend/node_modules` and run script again
- Run `npm install` manually in frontend directory

### General Tips

**Fresh start:**
```bash
# Stop and remove all containers
docker stop marine-backend marine-postgres
docker rm marine-backend marine-postgres

# Remove volumes (WARNING: deletes database data)
docker volume prune

# Start again
./start_backend.sh
```

**Check what's running:**
```bash
docker ps                    # Running containers
docker ps -a                 # All containers
docker images                # Built images
```
