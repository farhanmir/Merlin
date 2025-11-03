# OptiLLM Testing Guide

## Quick Start

Test all OptiLLM techniques with Google Gemini using the riddle.

### Prerequisites

1. **Google API Key** - Get one from: https://aistudio.google.com/app/apikey
2. **Python virtual environment** with dependencies installed

### Setup (First Time Only)

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .
```

### Run Tests

**Option 1: PowerShell Script (Recommended)**
```powershell
# From project root
.\test-optillm.ps1 -ApiKey "YOUR_GOOGLE_API_KEY"

# Or set environment variable first
$env:GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"
.\test-optillm.ps1
```

**Option 2: Manual Run**
```powershell
# From project root
cd backend
.\.venv\Scripts\Activate.ps1
$env:GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"
python test_optillm.py
```

**Option 3: Batch File**
```cmd
test-optillm.bat YOUR_GOOGLE_API_KEY
```

## What Gets Tested

The script will test each technique individually:

1. ✅ Baseline (no techniques)
2. ✅ MARS - Multi-Agent Reasoning System
3. ✅ CePO - Cerebras Planning and Optimization
4. ✅ MOA - Mixture of Agents
5. ✅ CoT Reflection - Chain of Thought with Reflection
6. ✅ PlanSearch - Planning with search
7. ✅ BoN - Best of N sampling
8. ✅ Self-Consistency - Multiple reasoning paths
9. ✅ PVG - Prover-Verifier Game
10. ✅ MCTS - Monte Carlo Tree Search
11. ✅ LEAP - Learn from Examples
12. ✅ Re2 - Read twice approach
13. ✅ RTO - Round Trip Optimization

## Expected Output

```
================================================================================
🧙 MERLIN OPTILLM TESTING SUITE
================================================================================
Model: gemini-1.5-flash
Provider: Google Gemini
API Key: ✓ Set
================================================================================

📋 Available Techniques (12):
   1. mars
   2. cepo
   3. moa
   ...

🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
================================================================================
🎯 Testing BASELINE (No Techniques)
================================================================================

✅ SUCCESS - Baseline
📝 Response:
--------------------------------------------------------------------------------
The word is **heroine**.
...

🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
Progress: 1/12
================================================================================
🧪 Testing Technique: MARS
================================================================================

✅ SUCCESS - mars
📝 Response (first 500 chars):
--------------------------------------------------------------------------------
The answer is heroine.
...
```

## Troubleshooting

### Import Errors
```powershell
cd backend
pip install -e .
```

### Rate Limit Errors
- Script automatically waits 5 seconds between techniques
- Google Free Tier: 15 requests/minute
- If you still hit limits, edit `test_optillm.py` and increase sleep time

### Virtual Environment Not Found
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
```

### API Key Issues
- Make sure key is valid: https://aistudio.google.com/app/apikey
- Check it's set: `echo $env:GOOGLE_API_KEY`

## Test Results

After running, you'll get a summary showing:
- ✅ Which techniques succeeded
- ❌ Which techniques failed (with error messages)
- 📝 First 500 characters of each response

## Next Steps

Once testing is complete:
1. Review which techniques work best for your use case
2. Check response times (longer techniques = better quality usually)
3. Test with different models (gemini-1.5-pro, gemini-2.0-flash-exp)
4. Try combining techniques in the main app

## Advanced: Test Specific Techniques Only

Edit `test_optillm.py` and modify:

```python
# Test only specific techniques
techniques_to_test = ["plansearch", "cot_reflection", "mars"]

# Replace the loop with:
for technique in techniques_to_test:
    success, result = await test_technique(service, technique)
    results[technique] = {'success': success, 'result': result}
    await asyncio.sleep(5)
```
