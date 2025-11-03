/**
 * Response time estimation for AI models and OptiLLM techniques
 * 
 * Estimates are based on:
 * 1. Model baseline speed (tokens/second)
 * 2. Expected output length
 * 3. Technique overhead (multiplier + fixed time)
 */

import type { Technique } from './types';

// Model baseline speeds (tokens per second on average)
const MODEL_SPEEDS: Record<string, number> = {
  // OpenAI Models
  'gpt-4o': 40,
  'gpt-4o-mini': 80,
  'gpt-4-turbo': 35,
  'gpt-4': 25,
  'gpt-3.5-turbo': 60,
  'o1-preview': 20,
  'o1-mini': 30,
  
  // Anthropic Models
  'claude-3-5-sonnet-20241022': 45,
  'claude-3-5-haiku-20241022': 70,
  'claude-3-opus-20240229': 30,
  'claude-3-sonnet-20240229': 40,
  'claude-3-haiku-20240307': 65,
  
  // Google Models
  'gemini-1.5-pro': 35,
  'gemini-1.5-flash': 60,
  'gemini-pro': 40,
  
  // Default for unknown models
  'default': 40,
};

// Technique overhead characteristics
// multiplier: how many times the base response (e.g., 3x means 3 LLM calls)
// fixedMs: additional processing/parsing time in milliseconds
interface TechniqueOverhead {
  multiplier: number;
  fixedMs: number;
  description: string;
}

const TECHNIQUE_OVERHEAD: Record<Technique, TechniqueOverhead> = {
  // Advanced Multi-Agent & Planning (highest overhead)
  'mars': {
    multiplier: 5, // Multiple agents at different temperatures
    fixedMs: 2000,
    description: '5 agents with diverse reasoning',
  },
  'cepo': {
    multiplier: 7, // BoN (3) + CoT + Reflection + Planning
    fixedMs: 3000,
    description: 'Best of 3 + CoT + Self-Reflection',
  },
  'plansearch': {
    multiplier: 4, // Multiple plan candidates
    fixedMs: 1500,
    description: '4 candidate plans evaluated',
  },
  
  // Core Reasoning (medium-high overhead)
  'cot_reflection': {
    multiplier: 3, // Think + Reflect + Answer
    fixedMs: 1000,
    description: '3-stage reasoning process',
  },
  'moa': {
    multiplier: 4, // Multiple agents + aggregation
    fixedMs: 2000,
    description: '4 agents + synthesis',
  },
  
  // Sampling & Verification (medium overhead)
  'bon': {
    multiplier: 3, // Best of N (default N=3)
    fixedMs: 500,
    description: 'Generate 3, pick best',
  },
  'self_consistency': {
    multiplier: 5, // Multiple reasoning paths
    fixedMs: 1000,
    description: '5 reasoning paths',
  },
  // NOTE: PVG disabled - exceeds free tier rate limits (20+ API calls)
  // 'pvg': {
  //   multiplier: 3, // Generate + Verify + Refine
  //   fixedMs: 800,
  //   description: 'Generate + Verify + Refine',
  // },
  
  // Search & Optimization (high overhead)
  'mcts': {
    multiplier: 6, // Tree search with simulations
    fixedMs: 2500,
    description: '6 tree search simulations',
  },
  'rstar': {
    multiplier: 5, // Rollout simulations
    fixedMs: 2000,
    description: '5 rollout simulations',
  },
  'rto': {
    multiplier: 4, // Round-trip optimization
    fixedMs: 1200,
    description: 'Multi-round optimization',
  },
  
  // Specialized Techniques (low-medium overhead)
  'leap': {
    multiplier: 2, // Learning-enhanced planning
    fixedMs: 800,
    description: 'Enhanced planning pass',
  },
  // NOTE: RE2 disabled - exceeds free tier rate limits (15+ API calls)
  // 're2': {
  //   multiplier: 2, // Re-reading
  //   fixedMs: 400,
  //   description: 'Read twice strategy',
  // },
  'z3': {
    multiplier: 1.5, // SMT solver integration
    fixedMs: 1500,
    description: 'Logical constraint solving',
  },
};

/**
 * Estimate response time for a given configuration
 * 
 * @param modelId - The model being used
 * @param estimatedOutputTokens - Expected output length in tokens
 * @param techniques - Array of OptiLLM techniques to apply
 * @returns Estimated time in seconds
 */
export function estimateResponseTime(
  modelId: string,
  estimatedOutputTokens: number = 500, // Default average response
  techniques: Technique[] = []
): number {
  // Get model speed (tokens/sec)
  const tokensPerSecond = MODEL_SPEEDS[modelId] || MODEL_SPEEDS['default'];
  
  // Base time for single LLM call (in seconds)
  const baseTimeSeconds = estimatedOutputTokens / tokensPerSecond;
  
  // If no techniques, return base time
  if (techniques.length === 0) {
    return baseTimeSeconds;
  }
  
  // Calculate combined overhead
  // Use the highest multiplier (techniques don't stack multiplicatively)
  const maxMultiplier = Math.max(
    ...techniques.map(t => TECHNIQUE_OVERHEAD[t]?.multiplier || 1)
  );
  
  // Sum all fixed overhead times
  const totalFixedMs = techniques.reduce(
    (sum, t) => sum + (TECHNIQUE_OVERHEAD[t]?.fixedMs || 0),
    0
  );
  
  // Total time = (base time * max multiplier) + fixed overhead
  const totalSeconds = (baseTimeSeconds * maxMultiplier) + (totalFixedMs / 1000);
  
  return totalSeconds;
}

/**
 * Format estimated time into human-readable string
 * 
 * @param seconds - Time in seconds
 * @returns Formatted string (e.g., "2.5s", "1m 30s", "45s")
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 1) {
    return '<1s';
  }
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get breakdown of time estimation
 * 
 * @param modelId - The model being used
 * @param estimatedOutputTokens - Expected output length
 * @param techniques - OptiLLM techniques
 * @returns Detailed breakdown
 */
export function getTimeBreakdown(
  modelId: string,
  estimatedOutputTokens: number = 500,
  techniques: Technique[] = []
): {
  baseTime: number;
  techniqueOverhead: number;
  total: number;
  details: string[];
} {
  const tokensPerSecond = MODEL_SPEEDS[modelId] || MODEL_SPEEDS['default'];
  const baseTime = estimatedOutputTokens / tokensPerSecond;
  
  if (techniques.length === 0) {
    return {
      baseTime,
      techniqueOverhead: 0,
      total: baseTime,
      details: [
        `Base model speed: ${tokensPerSecond} tokens/sec`,
        `Expected output: ${estimatedOutputTokens} tokens`,
      ],
    };
  }
  
  const maxMultiplier = Math.max(
    ...techniques.map(t => TECHNIQUE_OVERHEAD[t]?.multiplier || 1)
  );
  const totalFixedMs = techniques.reduce(
    (sum, t) => sum + (TECHNIQUE_OVERHEAD[t]?.fixedMs || 0),
    0
  );
  
  const techniqueTime = (baseTime * (maxMultiplier - 1)) + (totalFixedMs / 1000);
  const total = baseTime + techniqueTime;
  
  const details = [
    `Base model: ${formatEstimatedTime(baseTime)}`,
    `Techniques: ${techniques.map(t => TECHNIQUE_OVERHEAD[t]?.description || t).join(', ')}`,
    `Overhead: ${formatEstimatedTime(techniqueTime)}`,
  ];
  
  return {
    baseTime,
    techniqueOverhead: techniqueTime,
    total,
    details,
  };
}

/**
 * Estimate output tokens based on input length
 * Simple heuristic: output is usually 0.5x to 2x input length
 * 
 * @param inputText - User's input message
 * @returns Estimated output tokens
 */
export function estimateOutputTokens(inputText: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  const inputTokens = Math.ceil(inputText.length / 4);
  
  // For short inputs, expect longer outputs
  if (inputTokens < 50) {
    return 300; // Short question, detailed answer
  }
  
  // For medium inputs, expect similar length
  if (inputTokens < 200) {
    return inputTokens * 1.5;
  }
  
  // For long inputs, expect proportional output
  return inputTokens * 1.2;
}
