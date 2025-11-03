# Free Tier Rate Limiting Strategy

## 🎯 Objective
Ensure Merlin AI Workbench stays within all free tier limits while providing good UX.

## 📊 Free Tier Constraints

### Neon PostgreSQL (Most Restrictive)
- ⚠️ **Active time: 5 hours/day maximum**
- Compute hours: 191 hours/month (~6.4 hours/day)
- Storage: 512 MB
- Written data: 5 GB/month
- Connections: 100 concurrent

### Render Web Service
- ✅ 750 hours/month (sufficient for 24/7)
- Auto-shutdown after 15 min inactivity
- Cold start: 30-60 seconds

### Vercel Hosting
- ✅ 100 GB bandwidth/month
- Serverless execution: 10 seconds max
- No hard request limits

## 🧮 Rate Limit Calculation

**Bottleneck: Neon's 5-hour daily active time**

### Per-User Limit: 30 requests/hour

**Assumptions:**
- Average user session: 1 hour
- Concurrent users during peak: ~30 users
- Database query time per request: ~100ms (OptiLLM does heavy lifting)

**Daily Math:**
- 30 users × 30 req/hour × 1 hour = 900 requests/day
- 900 requests × 100ms = 90 seconds = 1.5 minutes active DB time
- **Safety margin: 3.5 hours remaining for other operations**

**Conservative Buffer:**
- Actual DB time may be higher with complex queries
- 30 req/hour ensures we stay well under 5-hour limit
- Even with 50 concurrent users, we'd only use ~2-3 hours/day

## 🚀 Scalability Plan

When upgrading to paid tiers:

1. **Neon Scale** ($19/month):
   - Active time: Unlimited
   - Increase to 100 req/hour per user

2. **Render Standard** ($7/month):
   - No auto-shutdown
   - Better cold start performance

3. **Current Setup (Free Tier)**:
   - 30 req/hour = **720 messages/day per user**
   - Sufficient for MVP and portfolio demonstration
   - Shows production-grade rate limiting implementation

## 📈 Monitoring

Watch these metrics in production:
- Neon active time (dashboard)
- Request patterns (slowapi)
- User feedback on limits

If limits feel too restrictive, consider:
1. Increase to 40 req/hour (still safe)
2. Add daily quotas instead of hourly
3. Implement request pooling/caching
