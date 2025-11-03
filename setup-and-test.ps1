# Quick Merlin Setup and Test Script
# Run this from the P1 directory

Write-Host "=== Merlin Quick Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    # Generate Fernet key
    $fernetKey = python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    
    @"
# Backend Configuration
FERNET_KEY=$fernetKey
DATABASE_URL=sqlite+aiosqlite:///./merlin.db
OPTILLM_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO

# OptiLLM Configuration
OPTILLM_BASE_URL=https://api.openai.com/v1
OPTILLM_APPROACH=auto
OPTILLM_API_KEY=

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8001
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "✓ .env file created with encryption key" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Installation Options ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose installation method:" -ForegroundColor Yellow
Write-Host "1. Local Development (Backend + Frontend separately)"
Write-Host "2. Docker Compose (All services)"
Write-Host "3. Skip installation and just test"
Write-Host ""
$choice = Read-Host "Enter choice (1/2/3)"

switch ($choice) {
    "1" {
        Write-Host "`nInstalling backend dependencies..." -ForegroundColor Yellow
        Set-Location backend
        pip install -e ".[dev]"
        Set-Location ..
        
        Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
        Set-Location frontend
        npm install
        Set-Location ..
        
        Write-Host "`n✓ Installation complete!" -ForegroundColor Green
        Write-Host "`nTo start the application:" -ForegroundColor Cyan
        Write-Host "  Terminal 1: cd backend && fastapi dev src/merlin/main.py --port 8001"
        Write-Host "  Terminal 2: cd frontend && npm run dev"
        Write-Host "  Terminal 3 (optional): docker run -p 8000:8000 ghcr.io/codelion/optillm:latest-proxy"
    }
    "2" {
        Write-Host "`nBuilding and starting Docker services..." -ForegroundColor Yellow
        docker-compose up --build -d
        
        Write-Host "`n✓ Docker services started!" -ForegroundColor Green
        Write-Host "`nAccess points:" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:3000"
        Write-Host "  Backend:  http://localhost:8001"
        Write-Host "  API Docs: http://localhost:8001/docs"
        
        Write-Host "`nView logs with: docker-compose logs -f"
    }
    "3" {
        Write-Host "`nSkipping installation..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Quick API Tests ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing backend (ensure it's running on port 8001)..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

try {
    Write-Host "`n1. Health Check:" -ForegroundColor Yellow
    $health = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
    
    Write-Host "`n2. API Keys:" -ForegroundColor Yellow
    $keys = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/keys" -Method Get
    Write-Host "   Configured keys: $($keys.keys.Count)" -ForegroundColor Green
    
    Write-Host "`n3. Available Models:" -ForegroundColor Yellow
    $models = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/chat/models" -Method Get
    Write-Host "   Available models: $($models.models.Count)" -ForegroundColor Green
    
    Write-Host "`n✓ All API tests passed!" -ForegroundColor Green
    
} catch {
    Write-Host "`n⚠ Backend not responding on port 8001" -ForegroundColor Red
    Write-Host "   Make sure to start the backend first:" -ForegroundColor Yellow
    Write-Host "   cd backend && fastapi dev src/merlin/main.py --port 8001" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open http://localhost:3000 in your browser"
Write-Host "2. Go to Settings and add an API key"
Write-Host "3. Return to Chat and start a conversation"
Write-Host ""
Write-Host "For detailed testing instructions, see TESTING.md" -ForegroundColor Gray
Write-Host ""
