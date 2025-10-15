# 🛠️ Railway & Vercel CLI Tools

Quick guide to using Railway and Vercel command-line tools for deployment and database management.

---

## Railway CLI

### Installation

**Using npm (recommended):**
```bash
npm install -g @railway/cli
```

**Using Homebrew (macOS):**
```bash
brew install railway
```

**Verify installation:**
```bash
railway --version
```

### Setup & Authentication

```bash
# Login (opens browser for OAuth)
railway login

# Link to your project
cd /Users/dizzyvn/workspace/personal/danang-marine-creature-map
railway link

# Select your project from the list
```

### Common Commands

#### View Status
```bash
railway status          # Check all services
railway ps              # List running services
```

#### Environment Variables
```bash
railway variables       # List all variables
railway variables set KEY=value    # Set a variable
```

#### Database Access
```bash
# Connect to PostgreSQL
railway run psql

# Run SQL file
railway run psql < backend/schema.sql

# Run a single SQL command
railway run psql -c "SELECT COUNT(*) FROM images;"
```

#### Logs & Debugging
```bash
railway logs            # View deployment logs
railway logs --follow   # Live tail logs
```

#### Deployment
```bash
railway up              # Deploy current directory
railway redeploy        # Redeploy latest deployment
```

#### Run Commands in Railway Environment
```bash
# Run any command with Railway environment
railway run python backend/migrate_to_db.py
railway run npm test
```

#### Open Dashboard
```bash
railway open            # Open project in browser
```

### Useful Railway CLI Workflows

#### 1. Set up Database
```bash
# Link project
railway link

# Create schema
railway run psql < backend/schema.sql

# Verify tables
railway run psql -c "\dt"
```

#### 2. Migrate Data
```bash
# Set environment and run migration
railway run python backend/migrate_to_db.py
```

#### 3. Check Deployment
```bash
# View logs
railway logs --follow

# Check status
railway status
```

#### 4. Update Environment Variables
```bash
# Set CORS
railway variables set ALLOWED_ORIGINS=https://marine-map-nu.vercel.app

# View all variables
railway variables
```

---

## Vercel CLI

### Installation

**Using npm:**
```bash
npm install -g vercel
```

**Verify installation:**
```bash
vercel --version
```

### Setup & Authentication

```bash
# Login (opens browser for OAuth)
vercel login

# Link to your project (in frontend directory)
cd frontend
vercel link
```

### Common Commands

#### Deployment

```bash
# Deploy to preview (temporary URL)
vercel

# Deploy to production
vercel --prod

# Deploy with specific environment
vercel --prod --env VITE_API_URL=https://your-api.railway.app
```

#### Environment Variables

```bash
# List environment variables
vercel env ls

# Add environment variable
vercel env add VITE_API_URL production
# Then paste: https://web-production-c247.up.railway.app

# Pull environment variables to local
vercel env pull
```

#### Project Management

```bash
# View project info
vercel inspect

# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback

# Remove deployment
vercel rm <deployment-url>
```

#### Logs & Debugging

```bash
# View logs (not real-time, use dashboard for live logs)
vercel logs <deployment-url>
```

#### Open Dashboard

```bash
vercel open             # Open project in browser
```

### Useful Vercel CLI Workflows

#### 1. Quick Preview Deploy
```bash
cd frontend
vercel
# Gives you a preview URL instantly
```

#### 2. Production Deploy with Environment
```bash
cd frontend
vercel --prod
```

#### 3. Set Environment Variables
```bash
# Add API URL for all environments
vercel env add VITE_API_URL

# Choose: Production, Preview, Development (select all)
# Paste: https://web-production-c247.up.railway.app
```

#### 4. Test Build Locally
```bash
# Build locally first
npm run build

# Preview production build
vercel build
```

---

## Combined Workflow: Full Deployment

### Setup (One-time)

```bash
# 1. Install CLIs
npm install -g @railway/cli vercel

# 2. Login to both
railway login
vercel login

# 3. Link projects
cd /path/to/project
railway link

cd frontend
vercel link
```

### Deploy Backend (Railway)

```bash
# From project root
railway link

# Set environment variables
railway variables set ALLOWED_ORIGINS=https://marine-map-nu.vercel.app

# Deploy (auto-deploys on git push, or manual)
git push origin main

# Check logs
railway logs --follow

# Test API
curl https://web-production-c247.up.railway.app/api/health
```

### Set up Database (Railway)

```bash
# Create schema
railway run psql < backend/schema.sql

# Migrate data (if you have existing data)
railway run python backend/migrate_to_db.py

# Verify
railway run psql -c "SELECT COUNT(*) FROM images;"
```

### Deploy Frontend (Vercel)

```bash
cd frontend

# Set API URL
vercel env add VITE_API_URL
# Paste: https://web-production-c247.up.railway.app
# Select: All environments

# Deploy to production
vercel --prod

# Test frontend
open https://marine-map-nu.vercel.app
```

---

## Quick Reference

### Railway CLI Cheat Sheet

```bash
railway login           # Authenticate
railway link            # Link project
railway status          # Check services
railway logs            # View logs
railway run psql        # Database shell
railway variables       # List env vars
railway up              # Deploy
railway open            # Open dashboard
```

### Vercel CLI Cheat Sheet

```bash
vercel login            # Authenticate
vercel link             # Link project
vercel                  # Deploy preview
vercel --prod           # Deploy production
vercel env ls           # List env vars
vercel env add          # Add env var
vercel ls               # List deployments
vercel open             # Open dashboard
```

---

## Troubleshooting

### Railway CLI Issues

**Error: "Not logged in"**
```bash
railway login
```

**Error: "No project linked"**
```bash
railway link
# Select your project
```

**Error: "Command not found: railway"**
```bash
# Reinstall
npm install -g @railway/cli

# Or use npx
npx @railway/cli login
```

### Vercel CLI Issues

**Error: "Not logged in"**
```bash
vercel login
```

**Error: "No framework detected"**
```bash
# Make sure you're in the frontend directory
cd frontend
vercel
```

**Error: "Build failed"**
```bash
# Test locally first
npm run build

# Check for errors
```

---

## Alternative: Use Web Dashboards

If you prefer GUIs:

- **Railway**: https://railway.app
- **Vercel**: https://vercel.com/dashboard

Both dashboards provide:
- Full deployment control
- Environment variable management
- Log viewing
- Database management
- Monitoring & analytics

The CLIs are faster for repetitive tasks, but dashboards are better for one-time setup and visual monitoring.

---

## Recommended Approach

**For initial setup**: Use web dashboards (easier to see what you're doing)

**For daily work**: Use CLIs (faster for deployments, logs, database)

**For your project**:
1. ✅ Set up services in Railway/Vercel dashboards
2. ✅ Configure environment variables in dashboards
3. ✅ Use Railway CLI for database operations
4. ✅ Let git push auto-deploy (no CLI needed for deployments)
5. ✅ Use CLI for debugging (logs, variables, testing)
