# How to Verify OptiLLM is Working

## ✅ Quick Verification Checklist

1. **Check OptiLLM is running**:
   ```powershell
   docker ps  # Should show optillm container on port 8000
   curl http://localhost:8000/health  # Should return 200 OK
   ```

2. **Look for the Technique Panel**:
   - Open http://localhost:3000
   - **Left sidebar** → Below "Model Selection" → "OptiLLM Optimization Techniques"
   - Click to expand and select techniques (MOA, PlanSearch, CoT-Reflection, etc.)

3. **Run the performance test**:
   ```powershell
   .\test_optillm.ps1
   ```

---

## 🔬 Understanding the Results

### Latency Differences = Proof of Work

| Technique | Expected Latency | Why? |
|-----------|-----------------|------|
| **Baseline** (no prefix) | 1x (fastest) | Single model call |
| **MOA** (`moa-`) | 2-3x slower | Calls model **multiple times** with different agents, aggregates responses |
| **PlanSearch** (`plansearch-`) | 2-4x slower | Creates plan first, then executes |
| **CoT-Reflection** (`cot_reflection-`) | 1.5-2x slower | Better prompting + reflection step |
| **Self-Consistency** (`self_consistency-`) | 3-5x slower | Samples **multiple** reasoning paths |

**If MOA takes 2-3x longer** → OptiLLM is working! It's running the model multiple times.

### Response Quality Differences

Test with the **"strawberry R count"** problem (LLMs often fail this):

```powershell
# Without optimization - might get wrong answer or weak reasoning
POST http://localhost:8001/api/v1/chat/completions
{ "model": "gemini/gemini-2.5-flash", "messages": [...] }

# With MOA - more thorough step-by-step
POST http://localhost:8001/api/v1/chat/completions
{ "model": "moa-gemini/gemini-2.5-flash", "messages": [...] }
```

**Look for**:
- More explicit step enumeration with MOA
- "Found one!" style confirmations
- Higher confidence in final answer

---

## 🎯 Using Techniques in the UI

### Method 1: Technique Panel (Frontend)
1. Open http://localhost:3000
2. **Left sidebar** → Expand "OptiLLM Optimization Techniques"
3. Check boxes for techniques you want:
   - ✅ MOA (best for complex questions)
   - ✅ CoT-Reflection (good balance of speed/quality)
   - ✅ PlanSearch (for multi-step problems)
4. Send your message - techniques are automatically applied

### Method 2: Direct API (Testing)
Use technique prefixes in model name:

```powershell
# Mixture of Agents
$body = @{
    model = 'moa-gemini/gemini-2.5-flash'
    messages = @(@{role='user'; content='Explain quantum computing'})
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:8001/api/v1/chat/completions' -Method Post -Body $body -ContentType 'application/json'

# Chain multiple techniques (applied left-to-right)
$body = @{
    model = 'plansearch-cot_reflection-gemini/gemini-2.5-flash'
    messages = @(@{role='user'; content='Write a 5-paragraph essay on climate change'})
} | ConvertTo-Json
```

---

## 🧪 Available Techniques

| Technique ID | When to Use | Expected Improvement |
|--------------|-------------|---------------------|
| `moa` | Complex questions, conflicting information | ⭐⭐⭐⭐⭐ Best accuracy, 2-3x slower |
| `plansearch` | Multi-step tasks, essay writing | ⭐⭐⭐⭐ Structured approach, 2-4x slower |
| `cot_reflection` | Reasoning tasks, math problems | ⭐⭐⭐⭐ Good balance, 1.5-2x slower |
| `self_consistency` | High-stakes decisions | ⭐⭐⭐⭐⭐ Very reliable, 3-5x slower |
| `leap` | Learning/reasoning tasks | ⭐⭐⭐ Moderate improvement, 2x slower |
| `rstar` | Recursive problems | ⭐⭐⭐⭐ Deep reasoning, 3-4x slower |
| `bon` (Best-of-N) | Creative tasks | ⭐⭐⭐ Tries N times, picks best |
| `mcts` | Search/exploration problems | ⭐⭐⭐⭐ Tree search, 3-5x slower |
| `z3` | Logic/constraint problems | ⭐⭐⭐⭐⭐ Formal verification |

---

## 📊 Benchmarking Example

```powershell
# Run the automated test
.\test_optillm.ps1

# Expected output:
# Baseline: 5s → "There are 3 Rs"
# MOA: 12s → "Let's count: s(not R), t(not R), r(Found one!)..."
# CoT: 5s → "1.s 2.t 3.r(1) 4.a 5.w 6.b 7.e 8.r(2) 9.r(3) 10.y"
```

**Key indicators OptiLLM is working**:
1. ✅ MOA takes 2-3x longer (proves multi-agent calls)
2. ✅ Responses show different reasoning styles
3. ✅ No errors in OptiLLM container logs
4. ✅ Backend logs show technique prefix being stripped correctly

---

## 🐛 Troubleshooting

### "Error: Failed to get a response"
```powershell
# 1. Check OptiLLM is running
docker ps  # Should see optillm container

# 2. Check OptiLLM logs
docker logs --tail 50 optillm

# 3. Test OptiLLM directly
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini/gemini-2.5-flash","messages":[{"role":"user","content":"Hi"}]}'
```

### "I can't find the Technique Panel"
- Make sure frontend is on http://localhost:3000
- Look in **left sidebar** below Model Selector
- Should say "OptiLLM Optimization Techniques" with collapsible arrow
- If missing, check browser console for React errors

### Techniques don't seem to work
```powershell
# Check backend is stripping prefixes correctly
# Should see "Stripped technique prefix from model name" in logs
docker logs backend --tail 20

# Verify model format is correct (needs gemini/ prefix)
# ✅ Correct: "moa-gemini/gemini-2.5-flash"
# ❌ Wrong: "moa-gemini-2.5-flash"
```

---

## 🚀 Next Steps

1. **Test different techniques** - Try PlanSearch for essay writing, MOA for fact-checking
2. **Compare quality** - Same question with/without optimization
3. **Measure latency** - Use PowerShell `Measure-Command` to benchmark
4. **Chain techniques** - Combine `plansearch-moa-` for maximum quality (very slow!)

**Pro tip**: For production, use faster techniques like `cot_reflection` or `bon` (Best-of-N with N=3). Save `moa` and `self_consistency` for critical tasks where accuracy matters more than speed.
