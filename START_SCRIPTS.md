# Local Development Start Scripts

This project includes two start scripts that mimic the production deployment environments:

## 🖥️ Backend (Railway-like)

**Script:** `./start_backend.sh`

This script starts the backend exactly as it runs on Railway:
- Uses PostgreSQL database (local or Railway)
- Runs `uvicorn main_db:app --host 0.0.0.0 --port $PORT`
- Creates required directories (uploads, thumbnails)
- Loads environment from `backend/.env`

### Prerequisites

1. PostgreSQL running locally on port 5432 (or update DATABASE_URL in backend/.env)
2. Python 3.11+ installed

### Quick Start

```bash
# Start PostgreSQL locally (if using Docker)
docker run --name postgres-marine \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=marine_creatures \
  -p 5432:5432 \
  -d postgres:15-alpine

# Run backend
./start_backend.sh
```

The backend will be available at: http://localhost:8000

API docs: http://localhost:8000/docs

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

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marine_creatures
DEBUG=true
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FISHES_DIR=../fishes
THUMBNAILS_DIR=./thumbnails
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

## 🐳 Using Docker Compose (Alternative)

If you prefer Docker:

```bash
docker-compose -f docker-compose.test.yml up
```

This will start both PostgreSQL and the backend in containers.

## 🔍 Troubleshooting

### Backend Issues

**Database connection failed:**
- Ensure PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check DATABASE_URL in `backend/.env`
- Verify database exists: `psql -U postgres -l`

**Port already in use:**
- Change PORT in `backend/.env`
- Or kill the process: `lsof -ti:8000 | xargs kill`

### Frontend Issues

**API connection failed:**
- Ensure backend is running on port 8000
- Check VITE_API_URL in `frontend/.env`
- Verify CORS settings in backend allow localhost:5173

**Dependencies errors:**
- Delete `frontend/node_modules` and run script again
- Run `npm install` manually in frontend directory
