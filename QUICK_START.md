# ⚡ Quick Start Guide

Get the app running in **5 minutes**!

---

## 🏃 Local Development (No Database)

Current setup uses JSON files - perfect for quick testing:

```bash
# 1. Start backend (Terminal 1)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# 2. Start frontend (Terminal 2)
cd frontend
npm install
npm run dev

# 3. Open browser
open http://localhost:5173
```

Done! 🎉

---

## 🐘 Local Development (With Database)

Want to test with PostgreSQL locally?

### Step 1: Install PostgreSQL

**macOS**:
```bash
brew install postgresql@14
brew services start postgresql@14
createdb marine_creatures
```

**Linux**:
```bash
sudo apt install postgresql
sudo -u postgres createdb marine_creatures
```

### Step 2: Setup Backend

```bash
cd backend

# Create environment file
cp .env.example .env

# Initialize database
psql marine_creatures < schema.sql

# Migrate existing data
python migrate_to_db.py

# Start backend with database
uvicorn main_db:app --reload
```

### Step 3: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

---

## 🚀 Deploy to Production

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full deployment guide.

**TL;DR - Railway (Fastest)**:

1. Push to GitHub
2. Sign up at [railway.app](https://railway.app)
3. "New Project" → Deploy from GitHub
4. Add PostgreSQL database
5. Done! (~30 min)

---

## 📁 Project Structure

```
danang-marine-creature-map/
├── backend/
│   ├── main.py              # JSON-based API (dev)
│   ├── main_db.py           # Database API (production)
│   ├── database.py          # DB connection
│   ├── models.py            # SQLAlchemy models
│   ├── schema.sql           # DB schema
│   ├── migrate_to_db.py     # Data migration script
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── lib/             # API client
│   │   └── types/           # TypeScript types
│   └── package.json
├── fishes/                  # Image storage
├── experiment/apis/         # API test scripts
├── DEPLOYMENT.md           # Deployment guide
└── QUICK_START.md          # This file
```

---

## 🔧 Common Commands

### Backend

```bash
# Development (JSON files)
uvicorn main:app --reload

# Production (Database)
uvicorn main_db:app --reload

# Run migration
python migrate_to_db.py

# Install dependencies
pip install -r requirements.txt
```

### Frontend

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Images Not Loading

1. Check `fishes/` directory has images
2. Check backend is running on port 8000
3. Visit http://localhost:8000/images/ to see files

### Database Connection Failed

1. Check PostgreSQL is running: `pg_isready`
2. Check `.env` file exists with correct `DATABASE_URL`
3. Verify database exists: `psql -l | grep marine`

---

## 📚 Next Steps

1. ✅ Get app running locally
2. 📖 Read [DEPLOYMENT.md](DEPLOYMENT.md) for production
3. 🧪 Check [experiment/apis/REPORT.md](experiment/apis/REPORT.md) for API features
4. 🐠 Start adding your marine creature photos!

---

**Need help?** Open an issue or check the docs!
