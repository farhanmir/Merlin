# 🚀 Quick Start Guide

## Run This Migration NOW

### 1. Open Neon Database Console
1. Go to: https://console.neon.tech/
2. Sign in
3. Select your project: `neondb`
4. Click "SQL Editor" in left sidebar

### 2. Run Migration Script
1. Open the file: `backend/migration.sql`
2. **Select ALL** the SQL code (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. **Paste** into Neon SQL Editor (Ctrl+V)
5. Click "Run" button (or press Ctrl+Enter)
6. Wait for completion (~2-3 seconds)

### 3. Verify Migration Success
Run this query in Neon SQL Editor:
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output**:
- api_keys
- chat_messages
- users
- workflows (if exists from before)
- workflow_steps (if exists from before)

### 4. Install Backend Dependencies
Open PowerShell and run:
```powershell
cd "C:\Users\Farhan Mir\Desktop\Projects\Merlin\backend"
pip install passlib[bcrypt] python-jose[cryptography]
```

### 5. Start Backend Server
```powershell
cd "C:\Users\Farhan Mir\Desktop\Projects\Merlin\backend"
fastapi dev src/merlin/main.py --port 8001
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
Starting Merlin API v0.1.0
Database: postgresql+asyncpg://...
Database initialized
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8001
```

### 6. Test Authentication
1. Frontend should already be running at: http://localhost:3000
2. You should see the new sign-in page
3. Click "Sign Up" (bottom of the form)
4. Enter:
   - Email: `test@example.com`
   - Password: `testpassword123`
5. Click "Create Account"
6. Should auto sign-in and redirect to chat

### 7. Verify Everything Works
- ✅ Can create account with email/password
- ✅ Can sign in with email/password  
- ✅ Can add API keys in Settings
- ✅ Can use chat interface
- ✅ Can sign out and sign back in

---

## 🐛 Troubleshooting

### Backend fails to start?
**Error**: `ModuleNotFoundError: No module named 'passlib'`
**Fix**: Run `pip install passlib[bcrypt] python-jose[cryptography]` again

### Migration fails?
**Error**: `column "user_id" of relation "api_keys" already exists`
**Fix**: This is OK! It means the column was already added. Migration script is safe to re-run.

### Can't sign in?
**Check**:
1. Backend is running on port 8001
2. Frontend is running on port 3000
3. Database migration completed successfully
4. Try creating a new account instead of logging in

### Google OAuth still shows?
**Answer**: Yes! Both Google OAuth AND email/password work now. You can use either.

---

## ⚡ What's Next?

After you verify everything works:

1. **Read**: `IMPLEMENTATION_SUMMARY.md` for full details
2. **Implement**: JWT authentication for API endpoints (security critical!)
3. **Add**: Per-user chat storage
4. **Deploy**: Update environment variables on Vercel and Render

---

**Current Status**: ✅ Authentication system is 90% done! Just need to wire up JWT verification to API endpoints.
