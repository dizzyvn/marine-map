# 🚀 Deployment Guide

This guide will walk you through deploying the Da Nang Marine Creature Map to production using **Railway** (recommended for fastest deployment).

---

## Prerequisites

- Git repository (GitHub/GitLab)
- Railway account (free tier available: [railway.app](https://railway.app))
- Your existing images in `/fishes` directory

---

## Option 1: Railway (Recommended - Fastest) ⭐

**Total Time**: ~30-45 minutes
**Cost**: $5/month after free trial ($5 credit included)

### Step 1: Prepare Your Code (5 min)

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "feat: add database support and deployment config"
   git push origin main
   ```

2. **Make sure these files exist** (already created):
   - ✅ `backend/requirements.txt`
   - ✅ `backend/main_db.py`
   - ✅ `backend/database.py`
   - ✅ `backend/models.py`
   - ✅ `backend/schema.sql`
   - ✅ `railway.json`
   - ✅ `Procfile`

### Step 2: Deploy Backend to Railway (15 min)

1. **Sign up** at [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the project

3. **Add PostgreSQL**:
   - In your project, click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets `DATABASE_URL` environment variable
   - No configuration needed! 🎉

4. **Configure Environment Variables**:
   - Go to your service → "Variables" tab
   - Add these variables:
     ```
     ALLOWED_ORIGINS=*
     FISHES_DIR=/app/fishes
     THUMBNAILS_DIR=/app/thumbnails
     ```

5. **Deploy**:
   - Railway will automatically build and deploy
   - Wait for deployment to finish (~3-5 minutes)
   - Copy your app URL (e.g., `https://your-app.railway.app`)

### Step 3: Initialize Database (5 min)

1. **Connect to Railway Postgres**:
   - In Railway dashboard, click on your PostgreSQL database
   - Click "Connect" → Copy the connection string
   - Or use the Railway CLI:
     ```bash
     railway login
     railway link
     railway run psql
     ```

2. **Run schema**:
   ```bash
   # Using Railway CLI
   railway run psql < backend/schema.sql

   # Or connect directly with psql
   psql "postgresql://user:pass@host:port/db" < backend/schema.sql
   ```

3. **Migrate data** (if you have existing data):
   ```bash
   # Set DATABASE_URL in your local .env
   cd backend
   cp .env.example .env
   # Edit .env with your Railway database URL

   # Run migration
   python migrate_to_db.py
   ```

### Step 4: Upload Images to Railway (10 min)

Railway doesn't have persistent storage in the free tier, so you have two options:

**Option A: Use Railway Volumes (Recommended)**
1. In Railway dashboard, go to your service
2. Click "Settings" → "Volumes"
3. Add volume:
   - Mount path: `/app/fishes`
   - Size: 5GB (adjust based on your needs)

4. Upload images:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and link project
   railway login
   railway link

   # Upload files
   railway run bash
   # In the Railway shell:
   # Upload your images (you'll need to use scp or similar)
   ```

**Option B: Use External Storage (S3, Cloudinary, etc.)**
- Modify `main_db.py` to use cloud storage
- Update image URLs in API responses

### Step 5: Deploy Frontend to Vercel (5 min)

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Import Project**:
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Framework: Vite
   - Root Directory: `frontend`

3. **Configure Environment**:
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.railway.app
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done! Your app is live 🎉

### Step 6: Test Your Deployment (5 min)

1. Visit your Vercel URL
2. Check if images load
3. Test uploading a new image
4. Test GPS tagging
5. Check the map view

---

## Option 2: Render (Alternative - Slower but Free)

**Total Time**: ~60-90 minutes
**Cost**: FREE (with limitations)

### Backend on Render

1. Create account at [render.com](https://render.com)

2. **New Web Service**:
   - Connect GitHub repo
   - Name: `danang-marine-api`
   - Environment: Python 3
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main_db:app --host 0.0.0.0 --port $PORT`

3. **Add PostgreSQL**:
   - Click "New" → "PostgreSQL"
   - Name: `danang-marine-db`
   - Copy connection string

4. **Environment Variables**:
   ```
   DATABASE_URL=<your-postgres-url>
   ALLOWED_ORIGINS=*
   FISHES_DIR=/opt/render/project/src/fishes
   THUMBNAILS_DIR=/opt/render/project/src/thumbnails
   ```

5. Deploy and initialize database (same as Railway)

⚠️ **Note**: Free tier has 15-minute spin-down (slow cold starts)

---

## Option 3: Docker Deployment (Any Platform)

Use the provided `Dockerfile`:

```bash
# Build
docker build -t danang-marine-api ./backend

# Run
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -v $(pwd)/fishes:/app/uploads \
  danang-marine-api
```

Works on:
- Digital Ocean App Platform
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Your own server

---

## Local Development with Database

If you want to test with database locally:

### 1. Install PostgreSQL

**macOS**:
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu)**:
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
createdb marine_creatures
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marine_creatures
```

### 4. Initialize Database

```bash
# Create tables
psql marine_creatures < schema.sql

# Migrate existing data
python migrate_to_db.py
```

### 5. Run Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run with database
uvicorn main_db:app --reload
```

---

## Post-Deployment Checklist

- [ ] Backend health check works: `https://your-api.railway.app/api/health`
- [ ] Database connected (health check shows "connected")
- [ ] Images load on homepage
- [ ] Map shows image markers
- [ ] Can upload new images
- [ ] GPS tagging works
- [ ] Image deletion works
- [ ] Locations API works

---

## Troubleshooting

### Database Connection Failed

**Problem**: `Database connection failed` in logs

**Solution**:
1. Check `DATABASE_URL` environment variable is set
2. Verify Postgres service is running
3. Check connection string format: `postgresql://user:pass@host:port/database`

### Images Not Loading

**Problem**: 404 errors for images

**Solution**:
1. Check Railway volume is mounted
2. Verify images were uploaded
3. Check `FISHES_DIR` environment variable

### Frontend Can't Connect to API

**Problem**: CORS errors or connection refused

**Solution**:
1. Verify `VITE_API_URL` is set correctly in Vercel
2. Check `ALLOWED_ORIGINS` in backend includes your frontend URL
3. Verify backend is running: visit `/api/health`

### Cold Start Issues (Render)

**Problem**: First request takes 30+ seconds

**Solution**:
- Upgrade to paid plan ($7/month) for always-on
- Or switch to Railway (better free tier)

---

## Scaling & Optimization

Once deployed, consider:

1. **Image Storage**: Move to S3/Cloudinary for better performance
2. **CDN**: Add Cloudflare for faster image delivery
3. **Database**: Add connection pooling for high traffic
4. **Caching**: Add Redis for API response caching
5. **Monitoring**: Set up Sentry for error tracking

---

## Cost Estimates

### Railway (Recommended)
- **Free Trial**: $5 credit
- **After Trial**: ~$5-10/month
  - Hobby plan: $5/month
  - PostgreSQL: Included
  - Storage: ~$0.25/GB/month

### Render
- **Free**: $0/month
  - Slow cold starts (15 min spin-down)
  - 750 hours/month
- **Paid**: $7/month per service

### Vercel (Frontend)
- **Free**: Unlimited for hobby projects
- Perfect for React/Vite apps

---

## Support

Need help? Check:
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Ready to deploy? Start with Railway for the fastest results! 🚀**
