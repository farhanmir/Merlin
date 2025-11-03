# Free Deployment Guide for Merlin AI

## Option 1: **Render.com** (Recommended - Easiest)

### Features:
- ✅ **100% FREE** for static sites and web services
- ✅ Automatic deploys from GitHub
- ✅ Free PostgreSQL database (90-day retention)
- ✅ Free SSL certificates
- ✅ Custom domains supported
- ⚠️ Services sleep after 15 min of inactivity (cold start ~30s)

### Deployment Steps:

#### 1. **Backend (FastAPI)**
```bash
# Add to backend/render.yaml
services:
  - type: web
    name: merlin-backend
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -e .
    startCommand: uvicorn merlin.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: FERNET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: merlin-db
          property: connectionString
      - key: OPTILLM_URL
        value: http://localhost:8000
```

#### 2. **Frontend (Next.js)**
```bash
# Add to frontend/render.yaml
services:
  - type: web
    name: merlin-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./out
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://merlin-backend.onrender.com
```

#### 3. **Deploy**
```bash
# 1. Push to GitHub
git add .
git commit -m "Add Render config"
git push

# 2. Go to render.com → New → Web Service
# 3. Connect GitHub repo
# 4. Render auto-detects render.yaml
```

**Cost:** $0/month
**Limitations:** Cold starts, 750 hours/month free tier

---

## Option 2: **Railway.app** (Most Generous Free Tier)

### Features:
- ✅ $5 FREE credits/month (enough for small apps)
- ✅ No sleep/cold starts
- ✅ Better performance than Render
- ✅ Automatic GitHub deploys
- ✅ Built-in PostgreSQL
- ⚠️ Requires credit card (not charged unless you exceed $5)

### Deployment:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Add environment variables in Railway dashboard
```

**Cost:** $0/month (within $5 credit)
**Limitations:** Need credit card, limited to $5/month usage

---

## Option 3: **Vercel (Frontend) + Render (Backend)**

### Best hybrid approach:

#### **Frontend on Vercel** (Next.js)
- ✅ Unlimited bandwidth
- ✅ Instant deploys
- ✅ Global CDN
- ✅ Zero config Next.js

```bash
npm install -g vercel
cd frontend
vercel
# Follow prompts, set NEXT_PUBLIC_API_URL
```

#### **Backend on Render** (FastAPI)
- Same as Option 1 above

**Cost:** $0/month
**Best for:** Production apps with high traffic

---

## Option 4: **Fly.io** (Global Edge Network)

### Features:
- ✅ 3 VMs free (256MB RAM each)
- ✅ No cold starts
- ✅ Deploy close to users (global regions)
- ✅ Persistent volumes
- ⚠️ More complex setup

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

**Cost:** $0/month (within free tier)

---

## Option 5: **Google Cloud Run** (Serverless)

### Features:
- ✅ 2 million requests/month FREE
- ✅ Scales to zero (no cold start charges)
- ✅ Pay per request
- ✅ 1 GB RAM free tier
- ⚠️ Requires Google account & billing setup

```bash
# Install gcloud CLI
gcloud init

# Deploy backend
gcloud run deploy merlin-backend \
  --source . \
  --platform managed \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy merlin-frontend \
  --source . \
  --platform managed \
  --allow-unauthenticated
```

**Cost:** $0/month (within 2M requests)

---

## **Recommended Stack for You:**

### For **Hobby/Testing:**
- **Frontend:** Vercel (best Next.js support)
- **Backend:** Render.com (simple, free)
- **Database:** Render PostgreSQL (free 90 days)

### For **Production:**
- **Frontend:** Vercel
- **Backend:** Railway.app ($5/month credit, no cold starts)
- **Database:** Railway PostgreSQL

---

## Environment Variables Setup

### Backend (.env)
```bash
FERNET_KEY=<generate-with-cryptography.fernet.generate_key()>
DATABASE_URL=postgresql://...  # From Render/Railway
OPTILLM_URL=http://localhost:8000  # Or deploy OptiLLM separately
GPTZERO_API_KEY=<your-key-when-you-get-it>
UNDETECTABLE_AI_KEY=<your-key>
CORS_ORIGINS=https://your-app.vercel.app
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://merlin-backend.onrender.com
```

---

## OptiLLM Deployment Note

⚠️ **OptiLLM is challenging to deploy** because it's a Python service that needs to run alongside your backend.

**Options:**
1. **Run on same container** (Render/Railway) - Add to Dockerfile
2. **Separate service** (deploy OptiLLM as its own Render service)
3. **Skip OptiLLM** - Call LLM APIs directly (lose optimization techniques)

---

## **Quick Start (5 minutes):**

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/merlin.git
git push -u origin main

# 2. Frontend (Vercel)
cd frontend
npm install -g vercel
vercel  # Follow prompts

# 3. Backend (Render)
# Go to render.com → New Web Service
# Connect GitHub → Select repo
# Build: pip install -e .
# Start: uvicorn merlin.main:app --host 0.0.0.0 --port $PORT
# Add FERNET_KEY env var

# Done! Your app is live 🎉
```

---

## Cost Breakdown (Monthly)

| Platform | Free Tier | Paid (if needed) |
|----------|-----------|------------------|
| Render | 750 hrs/month | $7/month (no sleep) |
| Railway | $5 credit | $5-20/month |
| Vercel | Unlimited | $20/month (pro) |
| Fly.io | 3 VMs free | $5-10/month |
| Google Cloud | 2M requests | Pay-per-use |

**Recommendation:** Start with **Vercel + Render** (100% free) → Upgrade to **Vercel + Railway** when you need better performance ($5/month).
