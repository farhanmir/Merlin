# OptiLLM Technique Implementation - Summary

## What Was Changed

### Problem
The initial Merlin implementation only included 6 of OptiLLM's 20+ available inference optimization techniques:
- ❌ Old: `plansearch`, `cot_reflection`, `moa`, `self_consistency`, `leap`, `rstar`
- ✅ New: All 14 **proxy-compatible** techniques from OptiLLM v0.3.4

### What Was Updated

#### 1. Frontend Types (`frontend/src/lib/types.ts`)
**Added 8 new techniques** to the `Technique` union type:
```typescript
export type Technique =
  // Advanced (NEW)
  | 'mars'   // Multi-Agent Reasoning System
  | 'cepo'   // Cerebras Planning & Optimization
  // Core Reasoning
  | 'plansearch'
  | 'cot_reflection'
  | 'moa'
  // Sampling & Verification (NEW)
  | 'bon'    // Best of N
  | 'pvg'    // Prover-Verifier Game
  // Search & Optimization (NEW)
  | 'mcts'   // Monte Carlo Tree Search
  | 'rto'    // Round Trip Optimization
  | 'rstar'
  // Specialized (NEW)
  | 're2'    // ReRead
  | 'z3'     // Z3 Solver
  | 'self_consistency'
  | 'leap';
```

#### 2. Frontend UI (`frontend/src/components/chat/technique-panel.tsx`)
**Complete redesign** with categorized techniques:

**Before:**
- Flat list of 6 techniques
- No organization
- No type safety

**After:**
- 14 techniques organized into 6 categories:
  - 🪐 **Advanced**: MARS, CePO, PlanSearch
  - 🤔 **Reasoning**: CoT + Reflection, MoA
  - 🏆 **Sampling**: Best of N, Self-Consistency, PVG
  - 🌳 **Search**: MCTS, R*, RTO
  - 🦘 **Specialized**: LEAP, ReRead, Z3
- Type-safe with `Technique` type
- Category headers for better UX
- Increased max height to `32rem` (from `24rem`)

#### 3. Backend API (`backend/src/merlin/api/v1/chat.py`)
**Updated technique prefix stripping** to support all 14 techniques:

```python
# Old: Random order
for prefix in ["moa-", "plansearch-", "cot_reflection-", ...]:

# New: Organized by category with comments
for prefix in [
    # Advanced Multi-Agent & Planning
    "mars-",
    "cepo-",
    "plansearch-",
    # Core Reasoning
    "cot_reflection-",
    "moa-",
    # Sampling & Verification
    "bon-",
    "self_consistency-",
    "pvg-",
    # Search & Optimization
    "mcts-",
    "rstar-",
    "rto-",
    # Specialized Techniques
    "leap-",
    "re2-",
    "z3-",
]:
```

#### 4. Documentation
**Created comprehensive technique guide** (`OPTILLM_TECHNIQUES.md`):
- Detailed description of all 14 techniques
- Category organization
- Performance benchmarks from OptiLLM README
- **Known issues with Gemini models** (cot_reflection, leap, self_consistency)
- Cost & latency matrix
- Troubleshooting guide
- Usage examples

## Techniques Not Included (Require Local Inference)

The following OptiLLM techniques require the **local inference server** and **cannot** be used through the proxy:

1. **Deep Confidence** (`N/A for proxy`) - Requires local model access
2. **CoT Decoding** (`N/A for proxy`) - Decoding strategy, not prompt technique
3. **Entropy Decoding** (`N/A for proxy`) - Decoding strategy, not prompt technique
4. **Thinkdeeper** (`N/A for proxy`) - OpenAI's `reasoning_effort` param for o1/DeepSeek-R1
5. **AutoThink** (`N/A for proxy`) - Steering vectors require local model

These techniques would require:
- Running OptiLLM's built-in inference server
- Loading HuggingFace models locally
- Using `OPTILLM_API_KEY` instead of provider keys
- Significant GPU/compute resources

**Decision:** Not implemented as Merlin focuses on BYOK (Bring-Your-Own-Key) with cloud providers.

## Plugin System

OptiLLM also has 13+ **plugins** (not techniques), including:
- MCP Client, Router, Memory, Privacy, JSON, Web Search, Deep Research, etc.

**Decision:** Plugins are **server-side configuration** (set via `~/.optillm/mcp_config.json` or command flags when starting OptiLLM). They are not user-selectable per-request, so they are **not** exposed in Merlin's UI.

Users running their own OptiLLM server can enable plugins via:
```bash
optillm --approach auto --enable-plugin memory --enable-plugin privacy
```

## Known Issues & Compatibility

### Gemini Model Compatibility
Based on user testing, the following techniques have **confirmed bugs** with Google Gemini models:

| Technique | Issue | Error Message |
|-----------|-------|---------------|
| `cot_reflection` | Returns `None` | `expected string or bytes-like object, got 'NoneType'` |
| `leap` | Returns `None` | `argument of type 'NoneType' is not iterable` |
| `self_consistency` | Python compat | `'SequenceMatcher' object has no attribute 'matching_blocks'` |

**Recommended Configuration for Gemini:**
```typescript
// SAFE ✅
techniques: ['plansearch']  // Most stable

// RISKY ⚠️
techniques: ['mars', 'cepo', 'bon', 'moa']  // Untested with Gemini

// BROKEN ❌
techniques: ['cot_reflection', 'leap', 'self_consistency']  // Known issues
```

**Recommended Models for Full Technique Support:**
- ✅ **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- ✅ **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku
- ⚠️ **Google**: Use minimal techniques or test thoroughly

## Testing Recommendations

### For Users
1. **Start Simple**: Test with NO techniques first (verify base model works)
2. **Add Gradually**: Try `plansearch` alone, then add one technique at a time
3. **Monitor Errors**: Check browser console and backend logs for OptiLLM errors
4. **Switch Models**: If Gemini issues persist, try GPT-4o or Claude

### For Developers
When adding new techniques in the future:

1. **Update 3 Files**:
   - `frontend/src/lib/types.ts` - Add to `Technique` type
   - `frontend/src/components/chat/technique-panel.tsx` - Add to `TECHNIQUES` array
   - `backend/src/merlin/api/v1/chat.py` - Add to prefix stripping loop

2. **Test Matrix**:
   - ✅ Test with OpenAI GPT-4o (most compatible)
   - ✅ Test with Anthropic Claude (second most compatible)
   - ⚠️ Test with Google Gemini (known issues, may fail)
   - ✅ Test streaming vs non-streaming
   - ✅ Test technique combinations (pipeline with `&`)

3. **Update Documentation**:
   - Add to `OPTILLM_TECHNIQUES.md` with benchmarks
   - Note any compatibility issues
   - Add cost/latency estimates

## Performance Impact

### Cost Multipliers (API calls)
| Technique | API Calls | Cost Multiplier |
|-----------|-----------|-----------------|
| `re2` | 2x | 2x |
| `bon` (N=3) | 3x | 3x |
| `moa` | 3-5x | 3-5x |
| `self_consistency` | 5-10x | 5-10x |
| `mars` | 3+ agents | 3-10x |
| `cepo` | Multiple rounds | 5-15x |
| `mcts` | Tree search | 10-50x |

**Warning for Users:** Combining multiple high-cost techniques (e.g., `mars-moa-self_consistency`) can result in **50-100x API cost**. Use sparingly!

### Latency Impact
- **Low** (< 2x): `re2`, `cot_reflection`, `z3`
- **Medium** (2-5x): `plansearch`, `bon`, `leap`
- **High** (5-10x): `moa`, `rto`, `self_consistency`
- **Very High** (10x+): `mars`, `cepo`, `mcts`, `rstar`

## Files Changed

### Frontend
1. ✅ `frontend/src/lib/types.ts` - Added 8 new technique types
2. ✅ `frontend/src/components/chat/technique-panel.tsx` - Complete redesign with categories

### Backend
1. ✅ `backend/src/merlin/api/v1/chat.py` - Updated technique prefix stripping

### Documentation
1. ✅ `OPTILLM_TECHNIQUES.md` - **NEW** Comprehensive technique guide
2. ✅ `OPTILLM_IMPLEMENTATION_SUMMARY.md` - **NEW** This file

### Not Changed (Already Correct)
- ✅ `backend/src/merlin/schemas/chat.py` - Uses `list[str]`, already flexible
- ✅ `backend/src/merlin/services/optillm_service.py` - Generic implementation works for all techniques
- ✅ `frontend/src/lib/store.ts` - Technique handling is generic
- ✅ `frontend/src/lib/api.ts` - API client is technique-agnostic

## Migration Notes

### For Existing Users
No breaking changes! Existing technique selections will continue to work:
- Old technique IDs (`plansearch`, `moa`, etc.) remain valid
- New techniques simply add more options
- No database schema changes needed
- No API contract changes

### For Developers
The implementation is **backwards compatible** and **future-proof**:
- Adding new techniques requires updating only 3 files (types, UI, backend prefix list)
- No changes to API schemas or service layer
- Type safety prevents invalid technique IDs
- Categories make UI scalable to 20+ techniques

## Next Steps

### Immediate
1. ✅ Test frontend compiles (`npm run build`)
2. ✅ Test backend accepts all technique prefixes
3. ✅ Verify type safety in IDE

### Short-term
1. User testing with different models
2. Document which techniques work best together
3. Add technique recommendations in UI (e.g., "Recommended: plansearch for Gemini")

### Long-term
1. Add **parallel technique execution** (`|` operator) to UI
2. Add **technique presets** (e.g., "Math Optimization Bundle" = mars + cepo + plansearch)
3. Add **cost estimator** showing API call multiplier before sending
4. Add **technique performance tracking** (measure latency/quality per technique)
5. Integrate **OptiLLM plugins** if users run own OptiLLM server (MCP, Memory, Deep Research)

## References

- [OptiLLM v0.3.4 README](https://github.com/algorithmicsuperintelligence/optillm/blob/main/README.md)
- [OptiLLM Benchmarks](https://github.com/algorithmicsuperintelligence/optillm#-proven-results)
- [Merlin copilot-instructions.md](.github/copilot-instructions.md)
- [OptiLLM Techniques Guide](OPTILLM_TECHNIQUES.md) (this repo)

---

**Implementation completed on**: 2025-11-02  
**OptiLLM version**: 0.3.4  
**Total techniques added**: 8 new + 6 existing = **14 total**  
**Techniques NOT added**: 5 local-only techniques (Deep Confidence, CoT Decoding, Entropy Decoding, Thinkdeeper, AutoThink)  
**Known issues**: 3 techniques broken with Gemini (cot_reflection, leap, self_consistency)
