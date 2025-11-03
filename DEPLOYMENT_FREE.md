# Free Deployment Guide for Merlin AI Workbench

## 🎯 Goal
Deploy Merlin online so **anyone can use it** without you running your laptop 24/7 - **completely FREE**.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Users (Worldwide)                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Frontend - Vercel (Free Tier)                  │
│  • Next.js 15 application                                │
│  • Unlimited bandwidth                                   │
│  • Auto HTTPS + CDN                                      │
│  • Custom domain support                                 │
│  https://merlin-ai.vercel.app                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│         Backend - Render (Free Tier)                     │
│  • FastAPI application                                   │
│  • 750 hours/month free                                  │
│  • Auto sleep after 15min idle                           │
│  • Auto wake on request                                  │
│  https://merlin-backend.onrender.com                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│      Database - Neon Postgres (Free Tier)                │
│  • PostgreSQL database                                   │
│  • 0.5 GB storage (plenty for this app)                  │
│  • Auto sleep after inactivity                           │
│  postgresql://user:pass@host/merlin                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│    OptiLLM Proxy - Railway (Free Trial → Hobby)          │
│  • OptiLLM Docker container                              │
│  • $5/month after trial OR self-host                     │
│  • Alternative: Replit (free with sleep)                 │
│  https://optillm.railway.app                             │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Complete Deployment Steps

### Step 1: Prepare Your Repository (5 minutes)

1. **Push to GitHub** (if not already):
   ```powershell
   cd "C:\Users\Farhan Mir\Desktop\Projects\Merlin"
   git init
   git add .
   git commit -m "Initial commit - Merlin AI Workbench"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/merlin.git
   git push -u origin main
   ```

2. **Make repository public** (required for free tiers):
   - Go to GitHub repo → Settings → Danger Zone → Change visibility → Public

### Step 2: Deploy Database - Neon (5 minutes)

**Why Neon?** Free PostgreSQL with auto-pause (saves resources when idle).

1. **Sign up**: https://neon.tech (use GitHub login)

2. **Create project**:
   - Project name: `merlin-db`
   - Region: Choose closest to you
   - PostgreSQL version: 15

3. **Get connection string**:
   ```
   Copy the connection string:
   postgresql://user:password@ep-xyz.region.neon.tech/merlin?sslmode=require
   ```

4. **Initialize schema**:
   ```powershell
   # Install psql if needed (via PostgreSQL installer)
   psql "postgresql://user:password@ep-xyz.region.neon.tech/merlin?sslmode=require"
   
   # Or use Neon's web SQL editor
   ```

   Run this SQL:
   ```sql
   -- From your existing schema
   CREATE TABLE api_keys (
       id SERIAL PRIMARY KEY,
       provider VARCHAR(50) NOT NULL UNIQUE,
       encrypted_key TEXT NOT NULL,
       is_valid BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE workflows (
       id SERIAL PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       goal TEXT NOT NULL,
       requirements TEXT,
       status VARCHAR(50) DEFAULT 'NOT_STARTED',
       current_step VARCHAR(100),
       state JSONB DEFAULT '{}',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE workflow_steps (
       id SERIAL PRIMARY KEY,
       workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
       step_name VARCHAR(100) NOT NULL,
       step_type VARCHAR(50) NOT NULL,
       input_data JSONB,
       output_data JSONB,
       model_used VARCHAR(100),
       techniques JSONB,
       status VARCHAR(50) DEFAULT 'PENDING',
       error TEXT,
       started_at TIMESTAMP,
       completed_at TIMESTAMP,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

5. **Save connection string** for later (you'll need it for backend deployment).

### Step 3: Deploy Backend - Render (10 minutes)

**Why Render?** 750 hours/month free (basically 24/7 for one app), auto-sleep saves resources.

1. **Sign up**: https://render.com (use GitHub login)

2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Repository: `YOUR_USERNAME/merlin`
   - Branch: `main`

3. **Configure**:
   ```
   Name: merlin-backend
   Region: Oregon (US West) or closest
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -e .
   Start Command: uvicorn merlin.main:app --host 0.0.0.0 --port $PORT
   Instance Type: Free
   ```

4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   DATABASE_URL = postgresql://user:password@ep-xyz.region.neon.tech/merlin?sslmode=require
   FERNET_KEY = <generate new key - see below>
   OPTILLM_URL = https://optillm.railway.app  (or your OptiLLM URL)
   CORS_ORIGINS = https://merlin-ai.vercel.app,https://merlin-ai-YOUR_USERNAME.vercel.app
   ```

   **Generate FERNET_KEY**:
   ```powershell
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```
   Copy the output (44 characters).

5. **Create Service** → Wait for deployment (5-10 min)

6. **Test**: Visit `https://merlin-backend.onrender.com/health`
   - Should see: `{"status": "healthy", ...}`

7. **Copy your backend URL**: `https://merlin-backend.onrender.com`

### Step 4: Deploy OptiLLM - Railway (10 minutes)

**Why Railway?** Easy Docker deployment, $5/month Hobby plan (or use free trial).

**Alternative Option**: Skip this and use OptiLLM from Docker on your laptop when needed (not recommended for production).

#### Option A: Railway (Recommended - $5/month after trial)

1. **Sign up**: https://railway.app (use GitHub login)

2. **Create Project**:
   - Click "New Project"
   - Deploy from GitHub repo (or use template)

3. **Use Docker**:
   - Create new service → "Empty Service"
   - Settings → Change source → "Docker Image"
   - Image: `ghcr.io/codelion/optillm:latest-proxy`

4. **Environment Variables**:
   ```
   PORT = 8000
   ```
   
   Note: Users will bring their own API keys, so no need to set OpenAI/Anthropic keys here.

5. **Deploy** → Copy URL: `https://optillm-production.up.railway.app`

#### Option B: Replit (Free with sleep)

1. **Sign up**: https://replit.com
2. **Create Repl**:
   - Template: Python
   - Name: `optillm-proxy`
3. **Install**:
   ```bash
   pip install optillm
   ```
4. **Create `main.py`**:
   ```python
   import os
   from optillm import create_app
   
   app = create_app()
   
   if __name__ == "__main__":
       import uvicorn
       port = int(os.getenv("PORT", 8000))
       uvicorn.run(app, host="0.0.0.0", port=port)
   ```
5. **Run** → Copy URL
6. **Limitation**: Sleeps after 1 hour idle, auto-wakes on request (adds ~10s delay)

#### Option C: Self-Host (Free but requires laptop)

Keep OptiLLM running on your laptop:
```powershell
# Run OptiLLM
optillm --port 8000

# Use ngrok for public URL
ngrok http 8000
```

**Not recommended for production** - laptop must stay on 24/7.

### Step 5: Deploy Frontend - Vercel (5 minutes)

**Why Vercel?** Made by Next.js creators, zero-config deployment, unlimited bandwidth.

1. **Sign up**: https://vercel.com (use GitHub login)

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import from GitHub: `YOUR_USERNAME/merlin`

3. **Configure**:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL = https://merlin-backend.onrender.com
   ```

5. **Deploy** → Wait 2-3 minutes

6. **Get URL**: `https://merlin-ai.vercel.app` (or custom domain)

7. **Test**: Visit your URL, try chat!

### Step 6: Update Backend CORS (2 minutes)

Go back to Render dashboard:

1. Open your backend service
2. Environment → Edit `CORS_ORIGINS`
3. Add your Vercel URL:
   ```
   https://merlin-ai-YOUR_USERNAME.vercel.app,https://your-custom-domain.com
   ```
4. Save → Service auto-redeploys

### Step 7: Test Everything (5 minutes)

1. **Visit your Vercel URL**: `https://merlin-ai.vercel.app`

2. **Add API Key**:
   - Go to Settings
   - Add OpenAI/Anthropic/Google API key
   - Should see "✓ Valid" checkmark

3. **Send Test Message**:
   - Go to Chat
   - Select model (e.g., GPT-4o-mini)
   - Try: "What is 2+2?"
   - Should respond correctly

4. **Test Technique**:
   - Open Advanced Settings
   - Select "PlanSearch"
   - Ask: "Write a Python function to reverse a string"
   - Should see planned response

5. **Test Workflow** (if implemented):
   - Go to Workflows
   - Create "Essay Writer" workflow
   - Run end-to-end

## 💰 Cost Breakdown

| Service | Free Tier | Limits | Cost After Free |
|---------|-----------|--------|-----------------|
| **Vercel** | ✅ 100% Free | Unlimited bandwidth, 100 deployments/day | $0/month forever |
| **Render** | ✅ 750 hrs/month | Sleeps after 15min idle, 512MB RAM | $7/month for always-on |
| **Neon** | ✅ 0.5GB storage | Auto-pause after 5min idle | $0/month (or $19 for always-on) |
| **Railway** | ⚠️ $5 credit trial | Credit expires | $5/month Hobby plan |
| **OptiLLM Alt** | ✅ Replit free | Sleeps after 1hr, wakes on request | $0/month |

**Total Free Option**: $0/month (Vercel + Render + Neon + Replit OptiLLM)  
**Total Paid Option**: $5-12/month (Railway OptiLLM + optional Render Pro)

### User API Costs
Users **bring their own API keys**, so LLM costs are on them:
- OpenAI GPT-4o-mini: ~$0.15 per million tokens (~$0.0001 per message)
- OptiLLM techniques multiply costs (e.g., MoA = 3-5x)

## 🔧 Optimizations for Free Tier

### 1. Backend Auto-Sleep (Render Free)

**Issue**: Backend sleeps after 15 minutes idle, takes 30-60s to wake.

**Solution**: Add loading state in frontend:

```typescript
// frontend/src/lib/api.ts
export async function sendChatMessage(request: ChatRequest) {
  try {
    // Show "Waking up server..." if slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      toast.info('Server is waking up from sleep (30-60s)...');
    }, 5000); // Show message after 5s
    
    const response = await fetch(`${API_URL}/api/v1/chat/completions`, {
      // ... existing code
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    // ... rest of code
  } catch (error) {
    // ... error handling
  }
}
```

### 2. Keep Backend Awake (Optional)

Use a free cron service to ping your backend every 14 minutes:

**Option A: UptimeRobot** (free)
1. Sign up: https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://merlin-backend.onrender.com/health`
   - Interval: 5 minutes
   - This keeps backend awake during the day

**Option B: GitHub Actions** (free)
Create `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Backend Alive

on:
  schedule:
    - cron: '*/14 6-22 * * *'  # Every 14 min, 6am-10pm UTC

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: curl https://merlin-backend.onrender.com/health
```

**Note**: Keeping backend awake uses your 750 free hours faster. Only do this if you want instant responses.

### 3. Database Auto-Pause (Neon)

**Issue**: Database auto-pauses after 5 minutes, adds ~1s wake time.

**Solution**: Already handled by SQLAlchemy connection pooling. First request after pause takes 1-2s, subsequent requests are instant.

### 4. OptiLLM Sleep (Replit Free)

**Issue**: OptiLLM on Replit sleeps after 1 hour, adds 10-15s wake time.

**Solutions**:
1. **Pay for Railway** ($5/month) - no sleep
2. **Accept the delay** - add loading message
3. **Self-host on laptop** - when you're using it actively

### 5. Reduce Database Queries

Already implemented! Merlin uses:
- Zustand localStorage for chat messages (no DB reads)
- API keys cached in memory (backend)
- Workflows only hit DB on create/update

## 🌐 Custom Domain (Optional - Free!)

### Get Free Domain
1. **Freenom**: https://freenom.com (free .tk, .ml, .ga domains)
2. **Register**: `merlin-ai.tk` or similar

### Connect to Vercel
1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `merlin-ai.tk`
3. Copy DNS records shown
4. Go to Freenom → Manage Domain → DNS
5. Add Vercel's DNS records:
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```
6. Wait 5-60 minutes for propagation
7. Visit `https://merlin-ai.tk` 🎉

**Alternative**: Use Vercel's free subdomain (no setup needed)

## 📊 Monitoring & Logs

### Frontend (Vercel)
- Dashboard → Project → Deployments → Click deployment → "Logs"
- Real-time function logs
- Automatic error tracking

### Backend (Render)
- Dashboard → Service → "Logs" tab
- Live tail: `tail -f` style logs
- Search and filter

### Database (Neon)
- Dashboard → Project → "Monitoring"
- Query stats, connection count
- Storage usage

### Alerts (Free)
Set up email alerts:
- **Render**: Settings → Notifications → Deploy status
- **Vercel**: Settings → Notifications → Deployment status
- **Neon**: Not available on free tier

## 🔒 Security for Public Deployment

### 1. API Key Encryption ✅
Already implemented! Merlin uses Fernet encryption for API keys.

### 2. Rate Limiting (Add This)

**Backend**: Add rate limiting to prevent abuse:

```powershell
# Install
pip install slowapi
```

Update `backend/src/merlin/main.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/v1/chat/completions")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def chat_completions(...):
    # ... existing code
```

### 3. Environment Variables ✅
Never commit API keys! Already using environment variables.

### 4. HTTPS ✅
Automatic with Vercel and Render!

### 5. CORS ✅
Already configured to only allow your frontend domain.

### 6. Input Validation ✅
Already using Pydantic schemas!

## 🐛 Common Issues & Fixes

### Issue: "Failed to fetch" in frontend

**Cause**: CORS or backend down  
**Fix**:
1. Check backend logs in Render
2. Verify `CORS_ORIGINS` includes your Vercel URL
3. Test backend directly: `curl https://merlin-backend.onrender.com/health`

### Issue: Backend takes 60s to respond first time

**Cause**: Render free tier sleep  
**Fix**: Either pay for Render Pro ($7/month) or add "waking up" message (see Optimizations)

### Issue: Database connection timeout

**Cause**: Neon auto-pause  
**Fix**: Normal! First request after pause takes 1-2s. Subsequent requests instant.

### Issue: OptiLLM techniques not working

**Cause**: OptiLLM container down or wrong URL  
**Fix**:
1. Check Railway/Replit logs
2. Test OptiLLM directly: `curl https://optillm.railway.app/health`
3. Verify `OPTILLM_URL` env var in Render backend

### Issue: Playwright humanization fails

**Cause**: Playwright not installed in Render  
**Fix**: Add to `backend/pyproject.toml` dependencies:
```toml
[project.optional-dependencies]
external = [
    "playwright>=1.40.0",
]
```

And update Render build command:
```bash
pip install -e .[external] && playwright install --with-deps chromium
```

**Note**: This may exceed free tier limits. Consider removing Playwright for free deployment.

## 📈 Scaling Beyond Free Tier

### When to Upgrade?

**Upgrade Render** ($7/month) when:
- ⏱️ 60s wake time is too slow
- 📊 Using more than 750 hours/month
- 💾 Need more than 512MB RAM

**Upgrade Neon** ($19/month) when:
- 💽 Database > 0.5GB (unlikely for this app)
- ⚡ Need always-on database

**Upgrade Railway** ($5/month) when:
- Free trial credits expire
- Need 24/7 OptiLLM availability

### Alternative Free Platforms

If you hit limits:

**Backend Alternatives**:
- **Fly.io**: 3 free VMs (256MB each)
- **Railway**: $5/month after trial
- **Koyeb**: Free tier with sleep
- **Cyclic**: Free tier (less generous than Render)

**Frontend Alternatives**:
- **Netlify**: Similar to Vercel, 100GB bandwidth/month
- **Cloudflare Pages**: Unlimited bandwidth
- **GitHub Pages**: Static only (need to adapt)

**Database Alternatives**:
- **Supabase**: 500MB free, Postgres
- **PlanetScale**: 5GB free, MySQL
- **MongoDB Atlas**: 512MB free, NoSQL

## 🎯 Final Checklist

Before going public:

- [ ] All services deployed (Frontend, Backend, Database, OptiLLM)
- [ ] Environment variables set correctly
- [ ] CORS configured with production URLs
- [ ] API key encryption working
- [ ] Test chat end-to-end
- [ ] Test OptiLLM techniques (at least plansearch)
- [ ] Test on mobile device
- [ ] Check all 3 providers (OpenAI, Anthropic, Google)
- [ ] Add rate limiting (see Security section)
- [ ] Set up monitoring/alerts
- [ ] Optional: Custom domain configured
- [ ] Optional: Keep-alive cron job
- [ ] Share your URL! 🎉

## 🚀 Launch Strategy

### Soft Launch (Testing)
1. Deploy to production URLs
2. Test privately with friends (5-10 people)
3. Monitor logs for errors
4. Fix any issues

### Public Launch
1. Share on Twitter/Reddit/HackerNews
2. Write blog post about your BYOK AI platform
3. Add to Product Hunt
4. Create demo video
5. Add analytics (Vercel Analytics is free!)

### Marketing Copy
```
🚀 Introducing Merlin AI Workbench

BYOK (Bring Your Own Key) AI platform with 14 OptiLLM techniques
✅ 2-10x better accuracy on reasoning tasks
✅ Works with OpenAI, Anthropic, Google
✅ Zero training required
✅ Free to use - you own your API keys

Try it: https://merlin-ai.vercel.app
Source: https://github.com/YOUR_USERNAME/merlin
```

## 📚 Next Steps

Once deployed:

1. **Monitor costs**: Check Render/Railway usage
2. **Gather feedback**: Add feedback form
3. **Add analytics**: Vercel Analytics or Google Analytics
4. **Improve UX**: Loading states, error messages
5. **Add features**: More OptiLLM techniques, workflow templates
6. **Write docs**: User guide, API docs
7. **Build community**: Discord server, GitHub discussions

## 🎓 Learning Resources

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Railway Docs](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Congratulations!** 🎉 You've deployed a production-grade AI application for **$0-5/month**. Share your creation with the world!

**Questions?** Open an issue on GitHub or check the troubleshooting section above.
