@echo off
REM Test OptiLLM with Google Gemini
REM Usage: test-optillm.bat YOUR_GOOGLE_API_KEY

echo ========================================
echo Testing OptiLLM with Google Gemini
echo ========================================
echo.

if "%1"=="" (
    echo ERROR: Please provide your Google API key as argument
    echo Usage: test-optillm.bat YOUR_GOOGLE_API_KEY
    echo.
    echo Or set it as environment variable:
    echo set GOOGLE_API_KEY=your-key-here
    echo test-optillm.bat
    exit /b 1
)

REM Set API key
set GOOGLE_API_KEY=%1

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Activate virtual environment
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo ERROR: Virtual environment not found!
    echo Please create it first: python -m venv .venv
    exit /b 1
)

REM Run the test
echo Running OptiLLM tests...
echo.
python test_optillm.py

pause
