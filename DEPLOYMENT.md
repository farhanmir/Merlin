# Production Deployment Guide

## 🎯 Current Status
- ✅ Local development working with SQLite
- ✅ Authentication system complete
- ✅ Per-user data isolation implemented
- ⏳ Production deployment pending

## 📋 Pre-Deployment Checklist

### 1. Neon PostgreSQL Database Setup

**Your Neon connection string format:**
```
postgresql+asyncpg://USER:PASSWORD@HOST/DATABASE
```

**Steps:**
1. Go to https://console.neon.tech
2. Select your Merlin project
3. Click "Reset password" if needed (this fixes "password authentication failed")
4. Copy the connection string
5. Replace `postgresql://` with `postgresql+asyncpg://`
6. **Remove any SSL parameters** (asyncpg handles SSL automatically for Neon)

**Example:**
```
postgresql+asyncpg://farhanmir:NEW_PASSWORD@ep-something.us-east-2.aws.neon.tech/merlin
```

### 2. Run Database Migration on Neon

Since we added new tables (`users`, updated `api_keys` with `user_id`, `chat_messages`), we need to update the production database.

**Option A: Full Reset (DESTRUCTIVE - deletes all data)**
```sql
-- Run this in Neon SQL Editor (https://console.neon.tech)
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS workflows;
DROP TABLE IF EXISTS workflow_steps;

-- Tables will be auto-created by backend on first startup
```

**Option B: Preserve existing data (Safer)**
```sql
-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Add user_id to api_keys (if table exists)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- 3. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    model VARCHAR(100),
    techniques TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- 4. Delete old API keys without user_id (they're orphaned)
DELETE FROM api_keys WHERE user_id IS NULL;
```

### 3. Render Backend Environment Variables

Go to https://dashboard.render.com → Your Merlin backend service → Environment

**Update these variables:**

```bash
# Database (CRITICAL - update this!)
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DATABASE

# JWT Secret (generate your own!)
# Run: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your-jwt-secret-here

# Keep these the same:
FERNET_KEY=<your-existing-fernet-key-from-render>
CORS_ORIGINS=["http://localhost:3000","https://merlin-gamma.vercel.app"]
OPTILLM_URL=http://localhost:8000
```

**After updating:**
1. Click "Save Changes"
2. Render will automatically redeploy your backend
3. Wait for the deployment to complete (~2-3 minutes)

### 4. Vercel Frontend Environment Variables

Go to https://vercel.com → Your Merlin project → Settings → Environment Variables

**Verify this is set:**
```bash
NEXT_PUBLIC_API_URL=https://merlin-backend-bvc6.onrender.com
```

If you need to update:
1. Add/update the variable
2. Redeploy: Deployments → Click "..." → Redeploy

### 5. Test Production Deployment

**Backend Health Check:**
```
https://merlin-backend-bvc6.onrender.com/health/detailed
```

Should return:
```json
{
  "timestamp": "...",
  "overall_status": "healthy",
  "services": {
    "database": {
      "status": "connected",
      "message": "Database connection successful"
    }
  }
}
```

**Frontend Auth Flow:**
1. Go to https://merlin-gamma.vercel.app
2. Click "Create Account"
3. Register with a test email (e.g., test@example.com)
4. Should successfully log in and see empty chat
5. Add an API key in Settings
6. Send a test message
7. Sign out and sign back in - messages should persist

## 🚨 Troubleshooting

### "password authentication failed for user"
- Reset your Neon password in the console
- Update DATABASE_URL in Render with new password
- Redeploy

### "relation users does not exist"
- Run the migration SQL in Neon SQL Editor
- Restart Render service

### "401 Unauthorized" errors in frontend
- Check JWT_SECRET_KEY is set in Render
- Check CORS_ORIGINS includes your Vercel URL
- Clear browser cookies and try again

### "CORS policy" errors
- Verify CORS_ORIGINS in Render is a JSON array
- Should be: ["http://localhost:3000","https://merlin-gamma.vercel.app"]
- No spaces in the JSON!

## 📝 Post-Deployment Tasks

After successful deployment:

1. **Test multi-user isolation:**
   - Create 2 accounts in production
   - Add different API keys to each
   - Send messages in both
   - Verify data is isolated

2. **Clean up local environment:**
   - Delete test users from production
   - Consider adding rate limiting
   - Monitor Render logs for errors

3. **Update documentation:**
   - Add authentication guide to README
   - Document the new endpoints
   - Update API documentation

## 🎉 Success Criteria

✅ Backend health check returns "healthy"
✅ Can create account in production
✅ Can log in and see empty chat
✅ Can add API keys (encrypted)
✅ Can send messages and see them persist
✅ Chat history shows in sidebar
✅ Signing out and back in preserves data
✅ Different users have isolated data

---

## Generated Secrets (DO NOT COMMIT!)

Generate your own secrets locally:

```bash
# Generate JWT Secret (64 characters)
python -c "import secrets; print(secrets.token_hex(32))"

# Generate Fernet Key (44 characters)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**⚠️ NEVER commit secrets to Git! Add them directly to Render/Vercel environment variables.**
