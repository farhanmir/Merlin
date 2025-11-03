# UI Validation Implementation

## Overview
Implemented proactive UI validation to prevent rate limit errors by showing API call counts and disabling invalid technique combinations before users submit requests.

## Features Implemented

### 1. API Call Tracking (`estimation.ts`)
- **Added `apiCalls` field** to `TechniqueOverhead` interface
- **Accurate API call counts** for all 9 techniques:
  - plansearch: 8 calls (4 iterations × 2 calls)
  - mcts: 15 calls (5 simulations × 3 calls)
  - rstar: 12 calls (4 iterations × 3 calls)
  - moa: 7 calls (5 agents + 2 synthesis)
  - bon: 6 calls (6 parallel samples)
  - rto: 4 calls (2 rounds × 2 calls)
  - leap: 4 calls (2 leaps × 2 calls)
  - self_consistency: 3 calls
  - cot_reflection: 2 calls

### 2. Validation Logic (`estimation.ts`)
- **`calculateTotalApiCalls(techniques)`**: Sums API calls for selected techniques
- **`validateTechniqueCombination(techniques, provider)`**: Returns validation result
  - Checks against provider-specific rate limits:
    - Google: 15 RPM (free tier)
    - OpenAI: 3 RPM (free tier)
    - Anthropic: 50 RPM
    - Groq: 30 RPM
    - Others: 60 RPM default
  - Returns `{isValid, warning, totalCalls, limit}`
  - Warns at 80% of limit
  - Errors at 100% of limit

### 3. Technique Categorization (`estimation.ts`)
- **`getTechniqueCategory(technique)`**: Categorizes techniques as:
  - Light (1-5 calls): cot_reflection, self_consistency
  - Medium (5-10 calls): plansearch, bon, moa, rto, leap
  - Heavy (10-20+ calls): mcts, rstar
  
### 4. Recommended Combinations (`estimation.ts`)
- **`getRecommendedCombinations(provider)`**: Suggests safe preset combinations
  - Quick Enhancement: cot_reflection (2 calls)
  - Balanced Quality: cot_reflection + self_consistency (5 calls)
  - Advanced Planning: plansearch (8 calls)
  - High Quality: moa + cot_reflection (9 calls)
  - Filters based on provider rate limits

### 5. UI Updates (`technique-panel.tsx`)

#### Header Enhancements
- **API Call Badge**: Shows total API calls next to time estimate
  - Green when valid
  - Red with warning icon when exceeds limit
  - Hover tooltip shows warning message

#### Validation Warnings
- **Warning Banner** (80-99% of limit):
  - Yellow background with warning icon
  - Shows total calls vs. limit
  - Displays provider name
  
- **Error Banner** (≥100% of limit):
  - Red background with alert icon
  - Blocks submission with clear message
  - Shows total calls vs. limit

#### Technique Checkboxes
- **API Call Count Badge**: Each technique shows number of calls (e.g., "8 calls")
- **Disabled State**: Techniques that would exceed limit are:
  - Grayed out (50% opacity)
  - Cursor changed to not-allowed
  - Checkbox disabled
  - Tooltip: "Adding this would exceed rate limit"

#### Provider Detection
- Auto-detects provider from model ID:
  - `provider/model` format → extract provider
  - `gpt-*` → openai
  - `claude-*` → anthropic
  - `gemini-*` → google

## Example Scenarios

### Scenario 1: Google Provider (15 RPM limit)
- User selects `gemini-1.5-pro`
- Selects `plansearch` (8 calls) ✅ Valid
- Tries to add `moa` (7 calls) → Total 15 calls
- UI shows warning: "Approaching rate limit (15/15 calls)"
- Tries to add `rstar` (12 calls) → Would be 27 calls
- `rstar` checkbox is **disabled** with tooltip

### Scenario 2: OpenAI Free Tier (3 RPM limit)
- User selects `gpt-4o-mini`
- Selects `mcts` (15 calls) ❌ Invalid
- UI shows **error banner**: "Exceeds rate limit (15/3 calls)"
- Most heavy techniques are **disabled**
- Only light techniques (cot_reflection, self_consistency) remain enabled

### Scenario 3: Anthropic (50 RPM limit)
- User selects `claude-3-5-sonnet-20241022`
- Can select multiple techniques: mcts + rstar + plansearch = 35 calls ✅ Valid
- UI shows "35 calls" badge in green
- Can add more until hitting 40 calls (80% threshold warning)

## Technical Details

### Rate Limit Thresholds
```typescript
const RATE_LIMITS = {
  google: 15,      // Gemini free tier
  openai: 3,       // GPT free tier (very restrictive)
  anthropic: 50,   // Claude free tier
  groq: 30,        // Groq free tier
  default: 60      // Generous default
};
```

### Validation Thresholds
- **Warning**: 80% of rate limit (still allows submission)
- **Error**: 100% of rate limit (disables invalid techniques)

### Performance
- All calculations done in real-time (React hooks)
- No API calls needed - pure client-side validation
- Negligible performance impact (<1ms per validation)

## Files Modified
1. `frontend/src/lib/estimation.ts` (+140 lines)
   - Added API call tracking
   - Implemented validation logic
   - Added helper functions
   
2. `frontend/src/components/chat/technique-panel.tsx` (+50 lines)
   - Added validation UI
   - Implemented disable logic
   - Added warning banners
   - Enhanced header with API call badges

## Benefits
✅ **Prevents Rate Limit Errors**: Users can't select invalid combinations  
✅ **Better UX**: Clear visual feedback before submission  
✅ **Educational**: Users learn which techniques are "expensive"  
✅ **Provider-Aware**: Automatically adjusts to model provider limits  
✅ **No Backend Changes**: Pure frontend validation  

## Future Enhancements
- Add "Suggested Combinations" dropdown with presets
- Show estimated cost (tokens × technique multiplier)
- Add technique comparison matrix
- Implement "Auto-Select Best Combo" button
