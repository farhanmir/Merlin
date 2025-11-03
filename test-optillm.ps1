# Test OptiLLM with Google Gemini
# Usage: .\test-optillm.ps1 -ApiKey "YOUR_GOOGLE_API_KEY"

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiKey
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing OptiLLM with Google Gemini" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if API key is provided
if (-not $ApiKey -and -not $env:GOOGLE_API_KEY) {
    Write-Host "ERROR: Please provide your Google API key" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: Pass as parameter" -ForegroundColor Yellow
    Write-Host "  .\test-optillm.ps1 -ApiKey 'your-key-here'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Set environment variable" -ForegroundColor Yellow
    Write-Host "  `$env:GOOGLE_API_KEY = 'your-key-here'" -ForegroundColor Gray
    Write-Host "  .\test-optillm.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Set API key in environment if provided as parameter
if ($ApiKey) {
    $env:GOOGLE_API_KEY = $ApiKey
}

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

# Check if virtual environment exists
$venvPath = Join-Path $backendPath ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please create it first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Gray
    Write-Host "  python -m venv .venv" -ForegroundColor Gray
    Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Gray
    Write-Host "  pip install -e ." -ForegroundColor Gray
    exit 1
}

# Activate virtual environment
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& $activateScript

# Run the test
Write-Host "Running OptiLLM tests..." -ForegroundColor Green
Write-Host ""
python test_optillm.py

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
