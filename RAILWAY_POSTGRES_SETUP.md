# 🗄️ Railway PostgreSQL Setup Guide

Complete step-by-step guide to set up PostgreSQL database on Railway for your Marine Creature Map.

---

## Part 1: Add PostgreSQL to Railway Project

### Step 1: Open Your Railway Project

1. Go to https://railway.app
2. Sign in to your account
3. Click on your project: **marine-map-production** (or whatever you named it)

### Step 2: Add PostgreSQL Service

1. In your project dashboard, click the **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically:
   - Create a PostgreSQL container
   - Generate a database with credentials
   - Set environment variables

### Step 3: Verify PostgreSQL is Running

1. Click on the PostgreSQL service (purple icon)
2. You should see:
   - Status: **"Running"** (green indicator)
   - Resource usage graphs
   - Connection details

### Step 4: Check DATABASE_URL is Set

1. Click on your **backend service** (not the database)
2. Go to **"Variables"** tab
3. You should see `DATABASE_URL` automatically added
   - Format: `postgresql://user:password@host:port/database`
   - Railway automatically links this from the PostgreSQL service

**If DATABASE_URL is missing:**
1. Click **"+ New Variable"**
2. Click **"Add Reference"**
3. Select: `PostgreSQL` → `DATABASE_URL`
4. This creates the connection automatically

---

## Part 2: Initialize Database Schema

Now we need to create the tables in the database.

### Option A: Using Railway CLI (Recommended)

#### 1. Install Railway CLI

**macOS/Linux:**
```bash
npm install -g @railway/cli
```

**Or with Homebrew:**
```bash
brew install railway
```

#### 2. Login to Railway

```bash
railway login
```

This opens a browser window to authenticate.

#### 3. Link to Your Project

```bash
cd /Users/dizzyvn/workspace/personal/danang-marine-creature-map
railway link
```

Select your project from the list.

#### 4. Connect to PostgreSQL

```bash
railway run psql
```

This opens an interactive PostgreSQL shell connected to your Railway database.

#### 5. Create Tables

In the psql shell, run:

```sql
-- Check if connected
\conninfo

-- Create the images table
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR UNIQUE NOT NULL,
    path TEXT,
    width INTEGER,
    height INTEGER,
    make VARCHAR,
    model VARCHAR,
    datetime TIMESTAMP WITH TIME ZONE,
    datetimeoriginal TIMESTAMP WITH TIME ZONE,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    manually_tagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on filename for faster lookups
CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);

-- Create index on datetimeoriginal for sorting
CREATE INDEX IF NOT EXISTS idx_images_datetimeoriginal ON images(datetimeoriginal);

-- Create the locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify tables were created
\dt
```

You should see:
```
             List of relations
 Schema |    Name    | Type  |  Owner
--------+------------+-------+----------
 public | images     | table | postgres
 public | locations  | table | postgres
```

Type `\q` to exit psql.

### Option B: Using SQL Client (Alternative)

If you prefer a GUI like TablePlus, DBeaver, or pgAdmin:

#### 1. Get Connection Details

From Railway dashboard:
1. Click on **PostgreSQL** service
2. Go to **"Connect"** tab
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:PASSWORD@host.railway.app:PORT/railway
   ```

#### 2. Connect with Your SQL Client

Use the connection string or individual credentials:
- **Host**: `host.railway.app` (from connection string)
- **Port**: `XXXXX` (5-digit number from connection string)
- **Database**: `railway`
- **Username**: `postgres`
- **Password**: (from connection string)

#### 3. Run Schema SQL

Copy the SQL from `backend/schema.sql` and execute it in your SQL client.

---

## Part 3: Migrate Existing Data (Optional)

If you have images in your local JSON file that you want to migrate to the database:

### Step 1: Get Railway Database URL

```bash
railway variables | grep DATABASE_URL
```

Or copy from Railway dashboard → PostgreSQL → Connect.

### Step 2: Set Environment Variable Locally

```bash
cd backend
export DATABASE_URL="postgresql://postgres:PASSWORD@host.railway.app:PORT/railway"
```

Replace with your actual connection string.

### Step 3: Run Migration Script

```bash
python migrate_to_db.py
```

This will:
- Read `data/images_metadata.json`
- Insert all images into Railway PostgreSQL
- Show progress and results

**Expected output:**
```
🗄️  Database Migration Tool
========================

1. Checking database connection...
  ✅ Database connected

2. Checking database schema...
  ✅ Found images table
  ✅ Found locations table

3. Loading local metadata...
  📦 Found 50 images in data/images_metadata.json

4. Migrating images to database...
  ✅ Added: IMG_20250723_205941.jpg
  ✅ Added: IMG_20250719_213700.jpg
  ...

✅ Migration complete!
   Total: 50 images
   Added: 50
   Skipped: 0
```

---

## Part 4: Verify Database is Working

### Test 1: Check Tables Exist

```bash
railway run psql -c "\dt"
```

Should list `images` and `locations` tables.

### Test 2: Count Records

```bash
railway run psql -c "SELECT COUNT(*) FROM images;"
```

Should show the number of migrated images.

### Test 3: Test API Endpoint

Once your backend is deployed, test:

```bash
curl https://web-production-c247.up.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Test 4: Get Images from API

```bash
curl https://web-production-c247.up.railway.app/api/images
```

Should return:
```json
{
  "total": 50,
  "images": [...]
}
```

---

## Part 5: Environment Variables Checklist

Make sure these are set in Railway → Backend Service → Variables:

```bash
# Required
DATABASE_URL=(automatically set by PostgreSQL plugin)
ALLOWED_ORIGINS=https://marine-map-nu.vercel.app

# Optional - Paths
FISHES_DIR=/app/uploads
THUMBNAILS_DIR=/app/thumbnails

# Don't set PORT - Railway sets it automatically
```

---

## Troubleshooting

### Error: "relation 'images' does not exist"

**Problem**: Tables weren't created.

**Solution**: Run the schema SQL again (Part 2).

### Error: "database connection failed"

**Problem**: DATABASE_URL not set or incorrect.

**Solution**:
1. Check PostgreSQL service is running (green status)
2. Verify DATABASE_URL exists in backend variables
3. Try removing and re-adding the reference

### Error: "password authentication failed"

**Problem**: Credentials changed or wrong database.

**Solution**:
1. Get fresh connection string from Railway PostgreSQL → Connect
2. Update your local DATABASE_URL
3. Try again

### Tables created but empty

**Problem**: Migration didn't run or no local data.

**Solution**:
- If you have local data: Run `migrate_to_db.py` (Part 3)
- If starting fresh: Upload images through the app UI

### Database is slow or timing out

**Problem**: Database is in a different region than your backend.

**Solution**:
1. Check both services are in the same region
2. Railway → Settings → Change region if needed
3. Both should be in same region (e.g., us-west1)

---

## Next Steps

Once database is set up:

1. ✅ PostgreSQL running on Railway
2. ✅ Tables created (images, locations)
3. ✅ Data migrated (if you had existing data)
4. ✅ DATABASE_URL set in backend variables
5. ✅ Backend can connect to database
6. 🚀 Deploy and test!

**Test your deployment:**
```bash
# Health check (should show "database: connected")
curl https://web-production-c247.up.railway.app/api/health

# Get stats
curl https://web-production-c247.up.railway.app/api/stats

# Get images
curl https://web-production-c247.up.railway.app/api/images
```

---

## Quick Reference Commands

```bash
# Railway CLI commands
railway login              # Login to Railway
railway link              # Link to your project
railway run psql          # Connect to PostgreSQL
railway variables         # List environment variables
railway logs              # View deployment logs
railway status            # Check service status

# PostgreSQL commands (in psql)
\dt                       # List tables
\d images                 # Describe images table
\q                        # Quit psql

# Test commands
railway run psql -c "SELECT COUNT(*) FROM images;"
railway run psql -c "SELECT * FROM images LIMIT 5;"
```

---

Need help? Check Railway docs: https://docs.railway.app/databases/postgresql
