# Deployment Checklist

## ✅ Step-by-Step Guide

### 1. GitHub Setup (5 minutes)
- [ ] Create GitHub repository (public)
- [ ] Push code: `git remote add origin <your-repo-url>`
- [ ] Push code: `git push -u origin main`

### 2. Neon PostgreSQL (5 minutes)
- [ ] Sign up: https://neon.tech
- [ ] Create project: `merlin-db`
- [ ] Copy connection string
- [ ] Run schema SQL (see DEPLOYMENT_FREE.md)
- [ ] Save connection string for later

### 3. Replit OptiLLM (10 minutes)
- [ ] Sign up: https://replit.com
- [ ] Create Repl: Python template, name `optillm-proxy`
- [ ] Install: `pip install optillm`
- [ ] Create main.py (see DEPLOYMENT_FREE.md)
- [ ] Run and copy URL
- [ ] Save URL for later

### 4. Render Backend (10 minutes)
- [ ] Sign up: https://render.com
- [ ] New Web Service → Connect GitHub repo
- [ ] Select repository: `YOUR_USERNAME/merlin`
- [ ] Root directory: `backend`
- [ ] Build command: `pip install -e .`
- [ ] Start command: `uvicorn merlin.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add environment variables:
  - [ ] `FERNET_KEY` (generate: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)
  - [ ] `DATABASE_URL` (from Neon)
  - [ ] `OPTILLM_URL` (from Replit)
  - [ ] `CORS_ORIGINS` (update after frontend deployment)
- [ ] Deploy and wait
- [ ] Copy backend URL: `https://merlin-backend.onrender.com`

### 5. Vercel Frontend (5 minutes)
- [ ] Sign up: https://vercel.com
- [ ] Import project → GitHub repo
- [ ] Root directory: `frontend`
- [ ] Framework: Next.js (auto-detected)
- [ ] Add environment variable:
  - [ ] `NEXT_PUBLIC_API_URL` = `https://merlin-backend.onrender.com`
- [ ] Deploy
- [ ] Copy frontend URL: `https://merlin-ai.vercel.app`

### 6. Update CORS (2 minutes)
- [ ] Go to Render dashboard
- [ ] Edit `CORS_ORIGINS` environment variable
- [ ] Add: `https://merlin-ai-YOUR_USERNAME.vercel.app`
- [ ] Save (auto-redeploys)

### 7. Test Everything (5 minutes)
- [ ] Visit frontend URL
- [ ] Add API key (Settings)
- [ ] Send test message
- [ ] Try OptiLLM technique (plansearch)
- [ ] Verify response

## 🎉 You're Live!

Your deployment URLs:
- **Frontend**: `https://merlin-ai-YOUR_USERNAME.vercel.app`
- **Backend**: `https://merlin-backend.onrender.com`
- **Database**: Neon PostgreSQL
- **OptiLLM**: Replit URL

## 📝 Important Info

### Free Tier Limits
- **Render**: Sleeps after 15min idle (30-60s wake time)
- **Replit**: Sleeps after 1hr idle (10-15s wake time)
- **Neon**: Auto-pauses after 5min (1-2s wake time)
- **Vercel**: No sleep, unlimited bandwidth

### Environment Variables Needed

**Backend (Render)**:
```
FERNET_KEY=<44-char-key>
DATABASE_URL=postgresql://user:pass@host.neon.tech/merlin?sslmode=require
OPTILLM_URL=https://optillm-proxy.replit.app
CORS_ORIGINS=https://merlin-ai.vercel.app
```

**Frontend (Vercel)**:
```
NEXT_PUBLIC_API_URL=https://merlin-backend.onrender.com
```

### Troubleshooting
- Backend slow? → Normal, free tier sleeps
- CORS error? → Check CORS_ORIGINS includes your Vercel URL
- Database error? → Check DATABASE_URL connection string
- OptiLLM error? → Check OPTILLM_URL and that Replit is running

## 🚀 Next Steps

1. Share your URL on Twitter/Reddit!
2. Add custom domain (Vercel settings)
3. Set up monitoring (UptimeRobot)
4. Add analytics (Vercel Analytics)
5. Star the repo on GitHub ⭐
