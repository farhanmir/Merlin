# OptiLLM Techniques Guide

This document describes all 14 inference optimization techniques available in Merlin through OptiLLM.

## ⚠️ Important Compatibility Notes

### Known Issues with Gemini Models
Based on testing, the following techniques have compatibility issues with Google Gemini models:
- ❌ **cot_reflection**: Returns `None` instead of text
- ❌ **leap**: Returns `None` instead of text  
- ❌ **self_consistency**: Python `SequenceMatcher` compatibility error

### Recommended Configurations

**For Gemini Models:**
- ✅ Use **only** `plansearch` (most stable)
- ✅ Or use NO techniques (verify basic flow works)
- ✅ Or switch to GPT-4o/Claude 3.5 Sonnet for full technique support

**For Best Results:**
- Start with 1-2 techniques maximum
- Gradually add more to find working combinations
- Monitor error messages from OptiLLM
- Remember: More techniques = higher latency & cost

## Technique Categories

### 🪐 Advanced Multi-Agent & Planning

#### MARS (Multi-Agent Reasoning System)
- **Slug**: `mars`
- **Description**: Multi-agent reasoning with diverse temperature exploration, cross-verification, and iterative improvement
- **Best For**: Complex reasoning tasks, math problems (AIME, IMO), coding challenges
- **Performance**: +30.0pp on AIME 2025 (43.3% → 73.3%) using Gemini 2.5 Flash Lite
- **Cost**: High (3+ agent calls)
- **Latency**: Very High

#### CePO (Cerebras Planning and Optimization)
- **Slug**: `cepo`
- **Description**: Combines Best of N, Chain-of-Thought, Self-Reflection, and Self-Improvement
- **Best For**: Math, code generation, reasoning benchmarks
- **Performance**: +18.6pp on Math-L5 using Llama 3.3 70B
- **Cost**: High (multiple sampling rounds)
- **Latency**: Very High

#### PlanSearch
- **Slug**: `plansearch`
- **Description**: Search algorithm over candidate plans for solving problems in natural language
- **Best For**: Code generation, multi-step planning
- **Performance**: +20% pass@5 on LiveCodeBench using GPT-4o-mini
- **Cost**: Medium (searches over multiple plans)
- **Latency**: Medium
- **Stability**: ✅ Most stable with Gemini

### 🤔 Core Reasoning

#### CoT with Reflection
- **Slug**: `cot_reflection`
- **Description**: Chain-of-thought reasoning with `<thinking>`, `<reflection>`, and `<output>` sections
- **Best For**: Complex reasoning, self-correction, transparent thinking
- **Cost**: Low (single pass with structured output)
- **Latency**: Low
- **Stability**: ❌ Known issue with Gemini (returns None)

#### Mixture of Agents (MoA)
- **Slug**: `moa`
- **Description**: Multiple AI agents collaborate and critique each other's responses
- **Best For**: Achieving GPT-4 performance from GPT-4o-mini, diverse perspectives
- **Performance**: Matches GPT-4 on Arena-Hard-Auto using GPT-4o-mini
- **Cost**: High (multiple agent calls)
- **Latency**: High

### 🏆 Sampling & Verification

#### Best of N (BoN)
- **Slug**: `bon`
- **Description**: Generates N responses and selects the best one (default N=3)
- **Best For**: Quick quality improvements, when you want the best of multiple attempts
- **Cost**: High (N parallel calls)
- **Latency**: Medium (parallel)

#### Self-Consistency
- **Slug**: `self_consistency`
- **Description**: Sample multiple reasoning paths and select the most consistent answer
- **Best For**: Math problems, questions with deterministic answers
- **Cost**: High (multiple samples)
- **Latency**: Medium
- **Stability**: ❌ Known issue with Gemini (SequenceMatcher error)

#### Prover-Verifier Game (PVG)
- **Slug**: `pvg`
- **Description**: Adversarial approach with prover and verifier agents
- **Best For**: Formal reasoning, verification, catching errors
- **Cost**: High (multiple roles)
- **Latency**: High

### 🌳 Search & Optimization

#### Monte Carlo Tree Search (MCTS)
- **Slug**: `mcts`
- **Description**: Tree search for iterative decision-making and exploration
- **Best For**: Multi-step decision problems, game-like scenarios
- **Cost**: Very High (tree exploration)
- **Latency**: Very High
- **Config**: Controlled by `--simulations`, `--exploration`, `--depth` flags

#### R* Algorithm (R-STAR)
- **Slug**: `rstar`
- **Description**: Advanced self-taught reasoning with rollouts
- **Best For**: Complex problem-solving, self-improvement
- **Cost**: Very High (multiple rollouts)
- **Latency**: Very High
- **Config**: Controlled by `--rstar-max-depth`, `--rstar-num-rollouts`, `--rstar-c` flags

#### Round Trip Optimization (RTO)
- **Slug**: `rto`
- **Description**: Optimize responses through round-trip translation/verification
- **Best For**: Code correctness, translation quality
- **Cost**: High (forward + backward pass)
- **Latency**: High

### 🦘 Specialized Techniques

#### LEAP
- **Slug**: `leap`
- **Description**: Learn task-specific principles from few-shot examples
- **Best For**: Tasks with clear patterns, few-shot learning
- **Cost**: Medium
- **Latency**: Medium
- **Stability**: ❌ Known issue with Gemini (returns None)

#### ReRead (RE2)
- **Slug**: `re2`
- **Description**: Process queries twice to improve reasoning
- **Best For**: Complex questions, reading comprehension
- **Cost**: Low (2x same query)
- **Latency**: Low

#### Z3 Solver
- **Slug**: `z3`
- **Description**: Formal logic using Z3 theorem prover
- **Best For**: Mathematical proofs, logical constraints
- **Cost**: Low (if Z3 available)
- **Latency**: Low
- **Requirements**: Z3 solver must be installed

## Combining Techniques

OptiLLM supports combining techniques in two ways:

### Pipeline (`&` operator)
Techniques are applied left-to-right in sequence:
```typescript
// In code
techniques: ['plansearch', 'cot_reflection']

// Translates to model name
model: 'plansearch-cot_reflection-gpt-4o'

// Execution
1. PlanSearch creates a plan
2. CoT Reflection refines the plan with thinking/reflection
```

### Parallel (`|` operator - not yet in UI)
Techniques run in parallel, returning multiple responses:
```typescript
// Via extra_body (not in current UI)
optillm_approach: 'bon|moa|mcts'

// Execution
1. Best of N generates 3 responses
2. MoA generates collaborative response
3. MCTS explores decision tree
4. All results returned as list
```

## Usage Examples

### Simple Usage (1 Technique)
```typescript
const response = await sendChatMessage({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Solve: 2x + 3 = 7' }],
  techniques: ['plansearch'], // Just PlanSearch
  stream: true,
});
```

### Advanced Usage (Multiple Techniques)
```typescript
const response = await sendChatMessage({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Write a sorting algorithm' }],
  techniques: ['plansearch', 'cot_reflection', 'rto'], // Pipeline
  stream: true,
});

// Translates to: plansearch-cot_reflection-rto-gpt-4o
// 1. PlanSearch creates code plan
// 2. CoT Reflection refines with thinking
// 3. RTO verifies code correctness
```

### Conservative Usage (Gemini-Safe)
```typescript
const response = await sendChatMessage({
  model: 'gemini/gemini-2.5-pro',
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  techniques: ['plansearch'], // ONLY plansearch for Gemini
  stream: true,
});
```

## Performance Benchmarks

### MARS on AIME 2025
| Model | Technique | Accuracy | Improvement |
|-------|-----------|----------|-------------|
| Gemini 2.5 Flash Lite | Baseline | 43.3% | - |
| Gemini 2.5 Flash Lite | MARS | 73.3% | **+30.0pp** |

### CePO on Math-L5
| Model | Technique | Accuracy | Improvement |
|-------|-----------|----------|-------------|
| Llama 3.3 70B | Baseline | 51.0% | - |
| Llama 3.3 70B | CePO | 69.6% | **+18.6pp** |

### MoA on Arena-Hard
| Model | Technique | Performance |
|-------|-----------|-------------|
| GPT-4o-mini | Baseline | Mid-tier |
| GPT-4o-mini | MoA | **Matches GPT-4** |

### PlanSearch on LiveCodeBench
| Model | Technique | pass@5 | Improvement |
|-------|-----------|--------|-------------|
| GPT-4o-mini | Baseline | 50.61% | - |
| GPT-4o-mini | PlanSearch | 59.31% | **+20%** |

## Cost & Latency Matrix

| Technique | Cost | Latency | Stability (Gemini) |
|-----------|------|---------|-------------------|
| mars | Very High | Very High | ⚠️ Untested |
| cepo | Very High | Very High | ⚠️ Untested |
| plansearch | Medium | Medium | ✅ Stable |
| cot_reflection | Low | Low | ❌ Returns None |
| moa | High | High | ⚠️ Untested |
| bon | High | Medium | ⚠️ Untested |
| self_consistency | High | Medium | ❌ SequenceMatcher error |
| pvg | High | High | ⚠️ Untested |
| mcts | Very High | Very High | ⚠️ Untested |
| rstar | Very High | Very High | ⚠️ Untested |
| rto | High | High | ⚠️ Untested |
| leap | Medium | Medium | ❌ Returns None |
| re2 | Low | Low | ⚠️ Untested |
| z3 | Low | Low | ⚠️ Untested |

**Legend:**
- ✅ Stable: Confirmed working
- ❌ Broken: Known compatibility issue
- ⚠️ Untested: Not yet tested with Gemini

## Troubleshooting

### Error: "OptiLLM error: expected string or bytes-like object, got 'NoneType'"
**Cause**: Technique returned `None` instead of text (known issue with `cot_reflection`, `leap` on Gemini)  
**Solution**: Remove the problematic technique or switch to GPT-4o/Claude

### Error: "'SequenceMatcher' object has no attribute 'matching_blocks'"
**Cause**: Python version compatibility issue in OptiLLM's `self_consistency` technique  
**Solution**: Use different technique or upgrade OptiLLM proxy's Python version

### Error: "argument of type 'NoneType' is not iterable"
**Cause**: Multiple techniques returning `None` (e.g., `leap` + others)  
**Solution**: Test techniques individually to find working combination

### General Debugging Steps
1. **Test with NO techniques** - Verify basic model works
2. **Test with ONLY plansearch** - Most stable single technique
3. **Add techniques one-at-a-time** - Isolate problematic combinations
4. **Switch models** - Try GPT-4o or Claude 3.5 Sonnet instead of Gemini
5. **Check OptiLLM logs** - Backend shows detailed error messages

## References

- [OptiLLM GitHub](https://github.com/algorithmicsuperintelligence/optillm)
- [MARS Paper](https://arxiv.org/abs/xxxx) - Multi-Agent Reasoning
- [CePO Paper](https://cerebras.ai/blog/cepo) - Planning & Optimization
- [MOA Paper](https://arxiv.org/abs/2406.04692) - Mixture of Agents
- [PlanSearch Paper](https://arxiv.org/abs/2406.12952) - Planning in NL

## Contributing New Techniques

When OptiLLM adds new techniques:

1. **Update types** in `frontend/src/lib/types.ts`:
   ```typescript
   export type Technique = 
     | 'existing_technique'
     | 'new_technique'; // Add here
   ```

2. **Add to UI** in `frontend/src/components/chat/technique-panel.tsx`:
   ```typescript
   {
     id: 'new_technique',
     name: 'Display Name',
     description: 'What it does',
     icon: '🎯',
     category: 'Appropriate Category',
   }
   ```

3. **Update backend** in `backend/src/merlin/api/v1/chat.py`:
   ```python
   for prefix in [
       # ... existing prefixes ...
       "new_technique-",
   ]:
   ```

4. **Test thoroughly** with different models before deploying
5. **Update this documentation** with benchmarks and compatibility notes
