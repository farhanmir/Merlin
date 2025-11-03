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
// apiCalls: estimated number of API calls this technique makes
interface TechniqueOverhead {
  multiplier: number;
  fixedMs: number;
  apiCalls: number;
  description: string;
}

export const TECHNIQUE_OVERHEAD: Record<Technique, TechniqueOverhead> = {
  // Planning (medium-high overhead)
  plansearch: {
    multiplier: 4, // Multiple plan candidates
    fixedMs: 1500,
    apiCalls: 8,
    description: '8 API calls: observations + solution + implementation',
  },

  // Core Reasoning (low-medium overhead)
  cot_reflection: {
    multiplier: 3, // Think + Reflect + Answer
    fixedMs: 1000,
    apiCalls: 2,
    description: '2 API calls: initial + reflection',
  },
  moa: {
    multiplier: 4, // Multiple agents + aggregation
    fixedMs: 2000,
    apiCalls: 7,
    description: '7 API calls: 3 initial + 3 critiques + synthesis',
  },

  // Sampling & Verification (medium overhead)
  bon: {
    multiplier: 3, // Best of N (default N=3)
    fixedMs: 500,
    apiCalls: 6,
    description: '6 API calls: 3 generations + 3 ratings',
  },
  self_consistency: {
    multiplier: 5, // Multiple reasoning paths
    fixedMs: 1000,
    apiCalls: 3,
    description: '3 API calls: sample paths (reduced from 5 for free tier)',
  },

  // Search & Optimization (high overhead)
  mcts: {
    multiplier: 6, // Tree search with simulations
    fixedMs: 2500,
    apiCalls: 15,
    description: '15 API calls: tree search with simulations',
  },
  rstar: {
    multiplier: 5, // Rollout simulations
    fixedMs: 2000,
    apiCalls: 12,
    description: '12 API calls: rollout simulations',
  },
  rto: {
    multiplier: 4, // Round-trip optimization
    fixedMs: 1200,
    apiCalls: 4,
    description: '4 API calls: forward + backward passes',
  },

  // Specialized (low-medium overhead)
  leap: {
    multiplier: 3, // Extract + Generate + Apply
    fixedMs: 1000,
    apiCalls: 4,
    description: '4 API calls: examples + mistakes + principles + apply',
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

/**
 * Calculate total API calls for selected techniques
 *
 * @param techniques - List of selected techniques
 * @returns Total estimated API calls
 */
export function calculateTotalApiCalls(techniques: Technique[]): number {
  if (techniques.length === 0) {
    return 1; // Base call without techniques
  }

  return techniques.reduce(
    (sum, t) => sum + (TECHNIQUE_OVERHEAD[t]?.apiCalls || 1),
    0
  );
}

/**
 * Check if technique combination will likely hit rate limits
 *
 * @param techniques - List of selected techniques
 * @param provider - Provider being used (affects rate limits)
 * @returns Object with isValid flag and warning message if applicable
 */
export function validateTechniqueCombination(
  techniques: Technique[],
  provider?: string
): {
  isValid: boolean;
  warning?: string;
  totalCalls: number;
  limit: number;
} {
  const totalCalls = calculateTotalApiCalls(techniques);

  // Provider rate limits (requests per minute)
  const rateLimits: Record<string, number> = {
    google: 15,
    openai: 3, // Free tier
    anthropic: 50,
    groq: 30,
    fireworks: 60,
    together: 60,
    cerebras: 30,
    xai: 20,
    perplexity: 20,
    replicate: 50,
    cohere: 20,
    mistral: 20,
  };

  const limit = provider ? rateLimits[provider] || 60 : 60;

  // Warn if total calls exceed 80% of rate limit
  const threshold = Math.floor(limit * 0.8);

  if (totalCalls > limit) {
    return {
      isValid: false,
      warning: `This combination will exceed your rate limit (${totalCalls} calls > ${limit}/min for ${provider || 'this provider'}). You'll encounter errors.`,
      totalCalls,
      limit,
    };
  }

  if (totalCalls > threshold) {
    return {
      isValid: true,
      warning: `This combination uses ${totalCalls} API calls, close to your ${limit}/min limit. Consider using fewer techniques.`,
      totalCalls,
      limit,
    };
  }

  return {
    isValid: true,
    totalCalls,
    limit,
  };
}

/**
 * Get technique categories for grouping
 */
export function getTechniqueCategory(technique: Technique): string {
  const overhead = TECHNIQUE_OVERHEAD[technique];
  if (!overhead) return 'Other';

  if (overhead.apiCalls >= 10) return 'Heavy';
  if (overhead.apiCalls >= 5) return 'Medium';
  return 'Light';
}

/**
 * Get recommended technique combinations for a provider
 *
 * @param provider - Provider name
 * @returns Recommended combinations with descriptions
 */
export function getRecommendedCombinations(provider?: string): Array<{
  name: string;
  techniques: Technique[];
  apiCalls: number;
  description: string;
}> {
  // Determine rate limit based on provider
  let limit = 60; // Default high limit
  if (provider === 'google') {
    limit = 15;
  } else if (provider === 'openai') {
    limit = 3;
  }

  const combinations = [
    {
      name: 'Quick Enhancement',
      techniques: ['cot_reflection' as Technique],
      apiCalls: 2,
      description: 'Fast improvement with chain-of-thought reasoning',
    },
    {
      name: 'Balanced Quality',
      techniques: ['plansearch' as Technique, 'cot_reflection' as Technique],
      apiCalls: 10,
      description: 'Good balance of planning and reasoning',
    },
    {
      name: 'Multi-Agent',
      techniques: ['moa' as Technique, 'bon' as Technique],
      apiCalls: 13,
      description: 'Multiple perspectives with best-of-n selection',
    },
    {
      name: 'Deep Search',
      techniques: ['mcts' as Technique],
      apiCalls: 15,
      description: 'Advanced tree search for complex problems',
    },
    {
      name: 'Maximum Quality',
      techniques: [
        'plansearch' as Technique,
        'cot_reflection' as Technique,
        'self_consistency' as Technique,
      ],
      apiCalls: 13,
      description: 'Comprehensive reasoning with consistency checking',
    },
  ];

  // Filter by rate limit
  return combinations.filter((c) => c.apiCalls <= limit);
}
