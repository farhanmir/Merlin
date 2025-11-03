# Merlin Testing Guide

## Prerequisites

Before testing, ensure you have:
- **Node.js 20+** and npm installed
- **Python 3.11+** installed
- **Docker and Docker Compose** (optional, for containerized testing)

## Option 1: Quick Local Testing (Recommended for Development)

### Step 1: Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
pip install -e ".[dev]"

# Generate Fernet encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Copy the output (44-character key)

# Create .env file in project root
cd ..
New-Item -ItemType File -Path .env -Force
Add-Content -Path .env -Value "FERNET_KEY=<paste-your-key-here>"
Add-Content -Path .env -Value "DATABASE_URL=sqlite+aiosqlite:///./merlin.db"
Add-Content -Path .env -Value "OPTILLM_URL=http://localhost:8000"
Add-Content -Path .env -Value "CORS_ORIGINS=http://localhost:3000"
Add-Content -Path .env -Value "LOG_LEVEL=INFO"

# Start the backend
cd backend
fastapi dev src/merlin/main.py --port 8001
```

### Step 2: Frontend Setup (New Terminal)

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Step 3: OptiLLM Setup (New Terminal, Optional)

```powershell
# Run OptiLLM in Docker
docker run -p 8000:8000 `
  -e OPTILLM_BASE_URL=https://api.openai.com/v1 `
  -e OPTILLM_APPROACH=auto `
  ghcr.io/codelion/optillm:latest-proxy
```

**Note:** OptiLLM is optional for initial testing. You can test BYOK management without it.

### Step 4: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs (Swagger UI)
- **OptiLLM:** http://localhost:8000 (if running)

---

## Option 2: Docker Compose Testing (Production-like)

```powershell
# Ensure .env file exists with FERNET_KEY
# (See Step 1 above for generating the key)

# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8001
# OptiLLM: http://localhost:8000
```

---

## Manual Testing Checklist

### 1. Health Check
```powershell
# Test backend health
curl http://localhost:8001/health

# Expected: {"status":"ok","version":"0.1.0"}
```

### 2. API Key Management

**a. Add an API Key:**
1. Navigate to http://localhost:3000/settings
2. Click on a provider (OpenAI, Anthropic, or Google)
3. Enter a test API key (or real one)
4. Click "Validate & Save"
5. Verify it shows as "valid" with masked key

**b. List API Keys:**
```powershell
# Via API
curl http://localhost:8001/api/v1/keys

# Expected: {"keys":[...]}
```

**c. Delete an API Key:**
1. In Settings UI, click the trash icon
2. Confirm deletion
3. Verify key is removed

### 3. Chat Interface

**a. Without API Key:**
1. Go to http://localhost:3000
2. Try to send a message
3. Should see "No API keys configured" warning

**b. With API Key:**
1. Add a valid API key in Settings
2. Return to Chat
3. Select a model from dropdown
4. (Optional) Enable techniques in Advanced Settings
5. Type a message and send
6. Verify streaming response appears

### 4. OptiLLM Techniques

1. In chat sidebar, expand "Advanced Settings"
2. Enable techniques (e.g., PlanSearch, CoT-Reflection)
3. Send a message
4. Verify techniques are applied (check backend logs)

---

## Automated Testing

### Backend Unit Tests

```powershell
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=merlin --cov-report=html

# Run specific test file
pytest tests/test_keys.py
pytest tests/test_chat.py

# View coverage report
# Open htmlcov/index.html in browser
```

### Frontend Type Checking

```powershell
cd frontend

# Type check
npm run type-check

# Lint
npm run lint

# Build (verifies no build errors)
npm run build
```

---

## API Testing with curl

### 1. Add API Key
```powershell
curl -X POST http://localhost:8001/api/v1/keys `
  -H "Content-Type: application/json" `
  -d '{\"provider\":\"openai\",\"api_key\":\"sk-test-key-123456789\"}'
```

### 2. List Models
```powershell
curl http://localhost:8001/api/v1/chat/models
```

### 3. Send Chat Message (Non-Streaming)
```powershell
curl -X POST http://localhost:8001/api/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    \"model\":\"gpt-4o\",
    \"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],
    \"techniques\":[],
    \"stream\":false
  }'
```

### 4. Delete API Key
```powershell
curl -X DELETE http://localhost:8001/api/v1/keys/openai
```

---

## Troubleshooting

### Backend won't start
```powershell
# Check if FERNET_KEY is set
Get-Content .env | Select-String "FERNET_KEY"

# Check if port 8001 is in use
netstat -ano | findstr :8001

# View backend logs for errors
fastapi dev src/merlin/main.py --port 8001
```

### Frontend won't start
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Check if port 3000 is in use
netstat -ano | findstr :3000

# Try with verbose output
npm run dev -- --verbose
```

### Database errors
```powershell
# Remove database and restart
Remove-Item merlin.db -ErrorAction SilentlyContinue
# Restart backend - it will recreate tables
```

### CORS errors in browser
- Ensure backend `CORS_ORIGINS` includes `http://localhost:3000`
- Check browser console for specific error messages
- Verify frontend is calling `http://localhost:8001` (check `NEXT_PUBLIC_API_URL`)

### Tailwind styles not loading
```powershell
cd frontend
# Ensure postcss.config.js exists
Get-Item postcss.config.js

# Rebuild
npm run build
```

---

## Environment Variables Reference

**Required:**
- `FERNET_KEY` - 44-character base64 encryption key (generate with Python command above)

**Optional:**
- `DATABASE_URL` - Default: `sqlite+aiosqlite:///./merlin.db`
- `OPTILLM_URL` - Default: `http://localhost:8000`
- `CORS_ORIGINS` - Default: `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` - Default: `http://localhost:8001`

---

## Next Steps After Testing

1. **Add Real API Keys** - Use actual OpenAI/Anthropic/Google keys for full functionality
2. **Test OptiLLM Techniques** - Experiment with different technique combinations
3. **Deploy** - Use docker-compose for production deployment
4. **Monitor** - Check logs for any errors or warnings

---

## Quick Test Script

Save as `test-merlin.ps1`:

```powershell
Write-Host "Testing Merlin API..." -ForegroundColor Green

# Test health
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
curl -s http://localhost:8001/health | ConvertFrom-Json | ConvertTo-Json

# Test API keys endpoint
Write-Host "`n2. List API Keys:" -ForegroundColor Yellow
curl -s http://localhost:8001/api/v1/keys | ConvertFrom-Json | ConvertTo-Json

# Test models endpoint
Write-Host "`n3. List Available Models:" -ForegroundColor Yellow
curl -s http://localhost:8001/api/v1/chat/models | ConvertFrom-Json | ConvertTo-Json

Write-Host "`nAll tests completed!" -ForegroundColor Green
```

Run with: `.\test-merlin.ps1`
