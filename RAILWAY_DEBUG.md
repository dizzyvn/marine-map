# 🔍 Railway Backend Troubleshooting

## Current Issue

Your Railway backend is returning **404 Not Found** on all endpoints, which means the FastAPI application isn't running.

## Steps to Debug

### 1. Check Railway Deployment Status

1. Go to: https://railway.app
2. Open your project: `marine-map-production`
3. Click on your backend service
4. Look at the deployment status:
   - ✅ **Running** (green) = Good, but might have wrong configuration
   - 🔄 **Building/Deploying** = Wait for it to finish
   - ❌ **Failed/Crashed** = Deployment error

### 2. Check Railway Logs

**In Railway Dashboard:**
1. Click on your backend service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"**

**Look for these errors:**

#### Common Error 1: Module Not Found
```
ModuleNotFoundError: No module named 'fastapi'
```
**Fix**: Dependencies not installed. Check if `requirements.txt` is in the right place.

#### Common Error 2: Import Error
```
ImportError: cannot import name 'func' from 'sqlalchemy'
```
**Fix**: We already fixed this. Make sure latest code is deployed.

#### Common Error 3: Database Connection
```
Database connection failed
```
**Fix**: Check PostgreSQL is added and `DATABASE_URL` is set.

#### Common Error 4: Port Binding
```
uvicorn running on 0.0.0.0:8000
```
But Railway expects `$PORT` variable.
**Fix**: Check start command uses `$PORT`.

### 3. Verify Configuration

#### Check `railway.json`

Make sure this file exists at the root of your repo:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": null,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Check `backend/Dockerfile`

Should have these key lines:
```dockerfile
# Copy from backend directory
COPY backend/requirements.txt .
COPY backend/ .

# Start command
CMD ["uvicorn", "main_db:app", "--host", "0.0.0.0", "--port", "8000"]
```

**⚠️ ISSUE**: The Dockerfile uses port 8000, but Railway expects `$PORT`!

### 4. Fix the Port Issue

**Option A: Update Dockerfile (Recommended)**

Edit `backend/Dockerfile`, change the last line:

```dockerfile
# OLD (Fixed port)
CMD ["uvicorn", "main_db:app", "--host", "0.0.0.0", "--port", "8000"]

# NEW (Dynamic port from Railway)
CMD ["sh", "-c", "uvicorn main_db:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Option B: Use Railway Start Command**

In Railway dashboard:
1. Go to your service → **Settings**
2. Scroll to **Deploy**
3. Set **Custom Start Command**:
   ```
   uvicorn main_db:app --host 0.0.0.0 --port $PORT
   ```

But you also need to change `railway.json`:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn main_db:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. Check Environment Variables

In Railway → Variables tab, you should have:

```
ALLOWED_ORIGINS=https://marine-map-nu.vercel.app
DATABASE_URL=(automatically set by PostgreSQL plugin)
PORT=(automatically set by Railway)
```

**Don't set PORT manually!** Railway sets it automatically.

### 6. Verify PostgreSQL is Connected

1. In Railway project, check if **PostgreSQL** service exists
2. It should show as "Running"
3. Click on it to see connection details
4. Your backend service should have a **DATABASE_URL** variable automatically

### 7. Trigger a New Deployment

After fixing issues:

**If you changed code:**
```bash
git add .
git commit -m "fix: update Railway deployment configuration"
git push origin main
```
Railway will auto-deploy.

**If you only changed Railway settings:**
1. Go to Railway dashboard
2. Click your service
3. Go to **Deployments** tab
4. Click ⋮ (three dots) on latest deployment
5. Click **"Redeploy"**

## Quick Fix (Most Likely Issue)

The most common issue is the **PORT configuration**. Here's the quick fix:

### Update `backend/Dockerfile`:

```dockerfile
# Last line should be:
CMD ["sh", "-c", "uvicorn main_db:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### Or update `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "cd /app && uvicorn main_db:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Then push and redeploy:
```bash
git add backend/Dockerfile railway.json
git commit -m "fix(railway): use dynamic PORT from environment"
git push origin main
```

## Testing After Fix

Once deployed, test these URLs:

1. **Root endpoint**:
   ```
   https://marine-map-production.up.railway.app/
   ```
   Should return:
   ```json
   {"message": "Da Nang Marine Creature Map API", "version": "2.0.0-db"}
   ```

2. **Health check**:
   ```
   https://marine-map-production.up.railway.app/api/health
   ```
   Should return:
   ```json
   {"status": "healthy", "database": "connected"}
   ```

3. **Images endpoint**:
   ```
   https://marine-map-production.up.railway.app/api/images
   ```
   Should return:
   ```json
   {"total": 0, "images": []}
   ```

## Still Not Working?

### Check Build Logs in Railway

Look for specific errors in the build process:
1. Docker build failures
2. Missing files
3. Permission issues

### Check if main_db.py Exists

The start command uses `main_db:app`, so `backend/main_db.py` must exist.

### Check Railway Service Type

In Railway:
1. Settings → Service
2. Should be **"Web Service"** not "Cron" or "Worker"
3. Root Directory should be `/` (repository root)

### Share Logs

If still stuck, share:
1. Railway build logs (full output)
2. Railway deployment logs (runtime)
3. Screenshot of Railway Variables tab

## Need Help?

Post in Railway Discord or check:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
