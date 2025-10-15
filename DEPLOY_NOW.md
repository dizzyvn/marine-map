# 🚀 Deploy Now - Railway CLI Steps

Follow these steps to deploy your backend using Railway CLI.

---

## Step 1: Login to Railway

Run this command:

```bash
railway login
```

**What happens:**
- Opens a browser window
- Click "Allow" to authenticate
- Terminal will show "Logged in as <your-email>"

**If browser doesn't open:**
- Copy the URL from terminal
- Paste in browser manually
- Complete authentication

---

## Step 2: Link Your Project

```bash
railway link
```

**What happens:**
- Shows a list of your Railway projects
- Use arrow keys to select **"marine-map-production"** (or your project name)
- Press Enter

**Output:**
```
? Select a project marine-map-production
✓ Linked to marine-map-production
```

---

## Step 3: Add PostgreSQL Database

Check if PostgreSQL is already added:

```bash
railway status
```

**If PostgreSQL is missing**, add it:

```bash
# This will prompt you to add database
railway database add

# Select: PostgreSQL
```

**Output:**
```
? Select a database PostgreSQL
✓ Database added to project
```

---

## Step 4: Create Database Schema

Run the SQL schema file:

```bash
railway run psql < backend/schema.sql
```

**What this does:**
- Connects to your Railway PostgreSQL
- Creates `images` and `locations` tables
- Sets up indexes and triggers

**Expected output:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
...
```

**Verify tables were created:**

```bash
railway run psql -c "\dt"
```

**Should show:**
```
             List of relations
 Schema |    Name    | Type  |  Owner
--------+------------+-------+----------
 public | images     | table | postgres
 public | locations  | table | postgres
```

---

## Step 5: Set Environment Variables

Set the CORS origins:

```bash
railway variables set ALLOWED_ORIGINS=https://marine-map-nu.vercel.app
```

**Check all variables:**

```bash
railway variables
```

**Should see:**
```
DATABASE_URL=postgresql://...  (automatically set)
ALLOWED_ORIGINS=https://marine-map-nu.vercel.app
PORT=(automatically set by Railway)
```

---

## Step 6: Deploy

Your project is already on GitHub, so Railway will auto-deploy on push.

**Trigger a redeploy:**

```bash
railway redeploy
```

Or just push to GitHub:

```bash
git push origin main
```

**Watch deployment logs:**

```bash
railway logs --follow
```

**Look for:**
```
Initializing database...
✅ Database initialized
INFO: Application startup complete
INFO: Uvicorn running on http://0.0.0.0:XXXX
```

Press `Ctrl+C` to stop watching logs (deployment continues).

---

## Step 7: Get Your Backend URL

```bash
railway open
```

This opens your Railway dashboard. Your backend URL will be shown (something like):
```
https://web-production-c247.up.railway.app
```

---

## Step 8: Test Your Backend

Test the API endpoints:

```bash
# Health check
curl https://web-production-c247.up.railway.app/api/health

# Should return:
# {"status":"healthy","database":"connected"}

# Get images
curl https://web-production-c247.up.railway.app/api/images

# Should return:
# {"total":0,"images":[]}
```

---

## Step 9: Migrate Existing Data (Optional)

If you have images in `backend/data/images_metadata.json`:

```bash
railway run python backend/migrate_to_db.py
```

**This will:**
- Read your local JSON file
- Upload all images to Railway database
- Show progress

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
  📦 Found 50 images

4. Migrating images to database...
  ✅ Added: IMG_20250723_205941.jpg
  ...

✅ Migration complete!
```

---

## Step 10: Update Vercel Frontend

The frontend needs to know your backend URL.

**Option A: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update:
   - Key: `VITE_API_URL`
   - Value: `https://web-production-c247.up.railway.app`
5. Redeploy frontend

**Option B: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd frontend
vercel link

# Set environment variable
vercel env add VITE_API_URL production
# Paste: https://web-production-c247.up.railway.app

# Deploy
vercel --prod
```

---

## Verification Checklist

After deployment, verify everything works:

### Backend Tests

```bash
# 1. Health check - should show "healthy" and "connected"
curl https://web-production-c247.up.railway.app/api/health

# 2. Root endpoint - should show API message
curl https://web-production-c247.up.railway.app/

# 3. Stats - should show image counts
curl https://web-production-c247.up.railway.app/api/stats

# 4. Images - should list images
curl https://web-production-c247.up.railway.app/api/images
```

### Frontend Tests

1. Open https://marine-map-nu.vercel.app
2. Check browser console (F12) - no CORS errors
3. Upload a test image
4. Check if it appears on map
5. Test GPS tagging

---

## Troubleshooting

### "Not logged in" Error

```bash
railway logout
railway login
```

### "No project linked" Error

```bash
railway link
# Select your project
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
railway status

# Check DATABASE_URL is set
railway variables | grep DATABASE_URL

# Reconnect to database
railway run psql -c "SELECT 1;"
```

### "psql: command not found"

The PostgreSQL client isn't installed locally. You have two options:

**Option 1: Use Railway's psql (recommended)**
```bash
railway run psql < backend/schema.sql
```

**Option 2: Install PostgreSQL locally**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt install postgresql-client
```

### Deployment Still Shows 502

```bash
# Check logs for errors
railway logs

# Common issues:
# - Database not connected
# - Port not binding correctly
# - Python dependencies missing
```

---

## Quick Commands Reference

```bash
# Status and info
railway status          # Check services
railway variables       # List env vars
railway logs            # View logs
railway logs --follow   # Live logs

# Database
railway run psql                    # Connect to DB
railway run psql < schema.sql       # Run SQL file
railway run psql -c "SELECT 1;"     # Run SQL command

# Deployment
railway redeploy        # Redeploy latest
railway up              # Deploy current directory

# Management
railway open            # Open dashboard
railway logout          # Logout
```

---

## You're Ready!

Once you complete these steps:
- ✅ Backend deployed on Railway
- ✅ Database set up with tables
- ✅ CORS configured
- ✅ Frontend can connect
- 🎉 Your app is live!

**Need help?** Share the output of:
```bash
railway logs
```
