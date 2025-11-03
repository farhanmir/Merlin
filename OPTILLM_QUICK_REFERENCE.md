# OptiLLM Quick Reference

## ⚡ What is OptiLLM?

OptiLLM is an inference optimization layer that improves LLM accuracy through advanced techniques - **without training or fine-tuning**. Just add a technique prefix to your model name!

## 🎯 Quick Start

1. **Select a model** (e.g., GPT-4o-mini)
2. **Choose technique(s)** in Advanced Settings
3. **Send your message** - OptiLLM handles the rest!

## 🏆 Top Techniques (Ranked by Stability)

### ✅ Most Stable (Recommended for Beginners)
- **PlanSearch** 🎯 - Search over problem-solving plans (+20% accuracy on code)
- **ReRead** 📖 - Process query twice (2x latency, low cost)
- **Best of N** 🏆 - Generate 3 responses, pick best (3x cost)

### ⚠️ Advanced (Higher Cost/Latency)
- **MARS** 🪐 - Multi-agent reasoning (+69% on math, very slow)
- **CePO** 🧠 - Planning + optimization (+36% on math, very slow)
- **MoA** 👥 - Agent collaboration (GPT-4 quality from GPT-4o-mini!)

### ❌ Avoid with Gemini Models
- **CoT Reflection** - Returns None error
- **LEAP** - Returns None error  
- **Self-Consistency** - Python compatibility error

## 📊 Performance by Use Case

### Math & Logic
```
Best: MARS, CePO, Self-Consistency
Good: PlanSearch, Z3
Cost: Very High
```

### Code Generation
```
Best: PlanSearch, RTO, MoA
Good: CoT Reflection, Best of N
Cost: Medium-High
```

### Writing & Analysis
```
Best: MoA, CoT Reflection, Best of N
Good: ReRead, PlanSearch
Cost: Low-Medium
```

### Quick Tasks
```
Best: ReRead, Best of N
Good: CoT Reflection
Cost: Low
```

## 💰 Cost Guide

| Technique | API Calls | Cost Multiplier |
|-----------|-----------|-----------------|
| ReRead | 2 | 2x |
| Best of N | 3 | 3x |
| MoA | 3-5 | 3-5x |
| Self-Consistency | 5-10 | 5-10x |
| MARS | 3+ agents | 5-15x |
| CePO | Multiple rounds | 5-15x |
| MCTS/R* | Tree search | 10-50x |

**Warning:** Combining techniques multiplies costs! `mars-moa-self_consistency` can be 50-100x more expensive.

## ⏱️ Latency Guide

- **Instant** (1-2x): ReRead, CoT Reflection, Z3
- **Fast** (2-5x): PlanSearch, Best of N, LEAP
- **Slow** (5-10x): MoA, RTO, Self-Consistency
- **Very Slow** (10x+): MARS, CePO, MCTS, R*

## 🎨 Technique Combinations

### Pipeline (Sequential)
Select multiple techniques - they run left-to-right:
```
PlanSearch → CoT Reflection → RTO
1. Plan the solution
2. Reflect on plan
3. Verify correctness
```

### When to Combine
- ✅ DO: Different phases (plan → execute → verify)
- ❌ DON'T: Similar techniques (moa + self_consistency = wasteful)

### Smart Combos
```typescript
// Code generation
['plansearch', 'rto']  // Plan then verify

// Math problems
['plansearch', 'z3']  // Plan then formal proof

// Complex reasoning
['moa', 'cot_reflection']  // Collaborate then reflect

// Quick improvements
['re2', 'bon']  // Read twice, pick best
```

## 🚨 Troubleshooting

### "OptiLLM error: NoneType"
**Fix:** Remove `cot_reflection`, `leap`, or `self_consistency`  
**Or:** Switch from Gemini to GPT-4o/Claude

### "SequenceMatcher error"
**Fix:** Remove `self_consistency` technique  
**Or:** Update OptiLLM proxy Python version

### Response Too Slow
**Fix:** Use only 1-2 techniques  
**Or:** Choose faster techniques (ReRead, CoT Reflection)

### Cost Too High
**Fix:** Remove MARS, CePO, MCTS, R*  
**Or:** Use Best of N or ReRead instead

## 📱 UI Tips

### Find Advanced Settings
Look for purple **"Advanced Techniques"** panel in left sidebar

### Categories Explained
- **Advanced** - Multi-agent systems (expensive but powerful)
- **Reasoning** - Chain-of-thought, reflection
- **Sampling** - Generate multiple attempts
- **Search** - Explore solution spaces
- **Specialized** - Task-specific approaches

### Technique Counter
Purple badge shows selected count (e.g., "3" = 3 techniques selected)

## 🔬 Benchmarks

### MARS on AIME 2025 (Math Competition)
- Before: 43.3% accuracy
- After: 73.3% accuracy
- **+69% improvement!**

### MoA on Arena-Hard
- GPT-4o-mini baseline: Mid-tier
- GPT-4o-mini + MoA: **Matches GPT-4**
- Save money, get same quality!

### PlanSearch on LiveCodeBench
- Before: 50.6% pass@5
- After: 59.3% pass@5
- **+20% improvement**

## 🎓 Learning Path

1. **Week 1**: Try `plansearch` on all tasks
2. **Week 2**: Add `bon` (Best of N) for quality boost
3. **Week 3**: Experiment with `moa` for hard problems
4. **Week 4**: Combine techniques for specific use cases

## ⚙️ Model Compatibility

### Fully Compatible ✅
- OpenAI: GPT-4o, GPT-4o-mini, GPT-4-turbo
- Anthropic: Claude 3.5 Sonnet, Claude 3.5 Haiku

### Limited Compatibility ⚠️
- Google Gemini: Use ONLY `plansearch` or no techniques

### Not Supported ❌
- o1/o1-mini: Use native reasoning, don't combine with OptiLLM
- DeepSeek-R1: Use native reasoning

## 🔗 Learn More

- [Full Technique Guide](./OPTILLM_TECHNIQUES.md) - Detailed docs
- [OptiLLM GitHub](https://github.com/algorithmicsuperintelligence/optillm) - Source code
- [Implementation Details](./OPTILLM_IMPLEMENTATION_SUMMARY.md) - Technical notes

---

**Pro Tip:** Start simple! One technique is often better than three. More ≠ better. 🎯
